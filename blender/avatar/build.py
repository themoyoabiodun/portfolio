"""Procedural stylized bust built from a single reference photo.

Run:  python build.py OUTDIR
Coordinates: meters, head centre at origin, face looks toward -Y, Z up.
"""
import math, os, sys
import numpy as np
from scipy.interpolate import PchipInterpolator
from PIL import Image
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = sys.argv[-1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)
RNG = np.random.default_rng(7)


def srgb(*c):
    """sRGB 0-255 -> linear RGBA for Principled BSDF."""
    lin = [((v / 255 + 0.055) / 1.055) ** 2.4 if v / 255 > 0.04045 else v / 255 / 12.92 for v in c]
    return (*lin, 1.0)


SKIN = np.array([104, 64, 45], float)
SKIN_DARK = np.array([80, 48, 34], float)
HAIR = np.array([16, 13, 12], float)
LIP_UP = np.array([78, 44, 40], float)
LIP_LO = np.array([138, 80, 74], float)

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gauss2(x, z, cx, cz, sx, sz):
    return np.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2))


# ---------------------------------------------------------------- loft helper
def profile(rows):
    rows = np.array(rows, float)
    d = np.r_[0, np.cumsum(np.hypot(np.diff(rows[:, 0]), np.diff(rows[:, 1])))]
    t = d / d[-1]
    return [PchipInterpolator(t, rows[:, k]) for k in range(1, rows.shape[1])], t


def make_mesh(name, verts, faces, uvs=None, smooth=True):
    """verts Nx3, faces list of index tuples, uvs: list (per face) of per-loop uv tuples."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uvs is not None:
        uvl = me.uv_layers.new(name="UVMap")
        k = 0
        for poly, fuv in zip(me.polygons, uvs):
            for li, uv in zip(poly.loop_indices, fuv):
                uvl.data[li].uv = uv
    me.validate()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


def grid_faces(nr, ns, uv_u, uv_v, pole_bot=None, pole_top=None, wrap_u=1.0):
    """nr rings x ns segments (closed ring). Returns faces + per-loop uvs.
    pole_bot/pole_top: vertex index of pole or None."""
    faces, uvs = [], []
    idx = lambda i, j: i * ns + (j % ns)

    def u_of(i, j):
        u = uv_u[i, j % ns]
        return u + (wrap_u if j >= ns else 0)

    for i in range(nr - 1):
        for j in range(ns):
            f = (idx(i, j), idx(i, j + 1), idx(i + 1, j + 1), idx(i + 1, j))
            faces.append(f)
            uvs.append([(u_of(i, j), uv_v[i, j]), (u_of(i, j + 1), uv_v[i, (j + 1) % ns]),
                        (u_of(i + 1, j + 1), uv_v[i + 1, (j + 1) % ns]), (u_of(i + 1, j), uv_v[i + 1, j])])
    if pole_bot is not None:
        for j in range(ns):
            faces.append((pole_bot, idx(0, j + 1), idx(0, j)))
            um = (u_of(0, j) + u_of(0, j + 1)) / 2
            uvs.append([(um, 0.0), (u_of(0, j + 1), uv_v[0, (j + 1) % ns]), (u_of(0, j), uv_v[0, j])])
    if pole_top is not None:
        for j in range(ns):
            faces.append((idx(nr - 1, j), idx(nr - 1, j + 1), pole_top))
            um = (u_of(nr - 1, j) + u_of(nr - 1, j + 1)) / 2
            uvs.append([(u_of(nr - 1, j), uv_v[nr - 1, j]), (u_of(nr - 1, j + 1), uv_v[nr - 1, (j + 1) % ns]), (um, 1.0)])
    return faces, uvs


# ================================================================= HEAD
#            z       W      Df     Db     ys
HEAD_ROWS = [(-0.121, 0.000, 0.000, 0.000, -0.010),
             (-0.119, 0.040, 0.030, 0.022, -0.020),
             (-0.113, 0.061, 0.052, 0.032, -0.018),
             (-0.100, 0.077, 0.068, 0.048, -0.010),
             (-0.075, 0.089, 0.080, 0.072, -0.003),
             (-0.037, 0.093, 0.091, 0.092, -0.001),
             (0.000, 0.094, 0.094, 0.100, 0.0),
             (0.045, 0.092, 0.092, 0.103, 0.0),
             (0.070, 0.086, 0.087, 0.100, 0.0),
             (0.094, 0.071, 0.072, 0.088, 0.003),
             (0.106, 0.045, 0.049, 0.065, 0.005),
             (0.113, 0.020, 0.022, 0.030, 0.006),
             (0.115, 0.000, 0.000, 0.000, 0.006)]
(hW, hDf, hDb, hYs), _ = profile(HEAD_ROWS)
hZ = PchipInterpolator(profile(HEAD_ROWS)[1], np.array(HEAD_ROWS)[:, 0])


def head_base(t, a):
    z = hZ(t)
    W, Df, Db, ys = hW(t), hDf(t), hDb(t), hYs(t)
    c = np.cos(a)
    D = np.where(c > 0, Df, Db)
    return W * np.sin(a), ys - D * c, z


HAIRLINE = PchipInterpolator([0, 0.40, 0.70, 1.00, 1.30, 1.60, 2.10, 2.70, math.pi],
                             [0.067, 0.063, 0.048, 0.022, -0.012, -0.020, -0.032, -0.055, -0.062])

EYE_X, EYE_Z = 0.042, -0.018


def hair_mask(a, z):
    hl = HAIRLINE(np.abs(a))
    return smoothstep(hl - 0.002, hl + 0.004, z)


def face_disp(x, z, a):
    """Forward (-Y) displacement for facial features, metres (positive = toward viewer)."""
    front = np.clip(np.cos(a), 0, 1) ** 1.5
    d = np.zeros_like(x)
    # nose: bridge ridge growing to a broad tip
    s = np.clip((0.004 - z) / (0.004 + 0.056), 0, 1)          # 0 at brow, 1 at tip
    bridge_w = 0.007 + 0.010 * s
    d += (0.002 + 0.012 * s ** 1.8) * np.exp(-(x / bridge_w) ** 2) * smoothstep(0.012, 0.0, z) * smoothstep(-0.072, -0.058, z)
    d += 0.015 * gauss2(x, z, 0, -0.055, 0.012, 0.010)          # tip
    d += 0.009 * gauss2(np.abs(x), z, 0.020, -0.059, 0.009, 0.008)  # alae
    # brow ridge + eye sockets
    d += 0.004 * gauss2(np.abs(x), z, 0.040, 0.004, 0.030, 0.008)
    d -= 0.008 * gauss2(np.abs(x), z, EYE_X, EYE_Z, 0.017, 0.012)
    # cheeks
    d += 0.006 * gauss2(np.abs(x), z, 0.055, -0.045, 0.020, 0.020)
    # lips
    d += 0.0045 * gauss2(x, z, 0, -0.0855, 0.026, 0.005)
    d += 0.0055 * gauss2(x, z, 0, -0.0965, 0.024, 0.0055)
    d -= 0.0025 * gauss2(x, z + 0.003 * (x / 0.035) ** 2, 0, -0.0905, 0.030, 0.0014)
    d -= 0.002 * gauss2(x, z, 0, -0.1035, 0.016, 0.003)
    d += 0.005 * gauss2(x, z, 0, -0.110, 0.014, 0.008)          # chin
    return d * front


def head_final(t, a):
    x, y, z = head_base(t, a)
    y = y - face_disp(x, z, a)
    # short hair adds a few millimetres of volume
    hm = hair_mask(a, z)
    p = np.stack([x, y, z * 0.9])
    n = p / np.maximum(np.linalg.norm(p, axis=0), 1e-6)
    off = 0.0045 * hm
    return x + n[0] * off, y + n[1] * off, z + n[2] * off


NR, NS = 180, 220
ts = np.linspace(0, 1, NR + 2)[1:-1]
as_ = np.linspace(-math.pi, math.pi, NS, endpoint=False)
T, A = np.meshgrid(ts, as_, indexing="ij")
X, Y, Z = head_final(T, A)
verts = np.stack([X, Y, Z], -1).reshape(-1, 3)
pb = len(verts); pt = pb + 1
bx, by, bz = head_final(np.array([0.0]), np.array([0.0]))
tx, ty, tz = head_final(np.array([1.0]), np.array([0.0]))
verts = np.vstack([verts, [bx[0], by[0], bz[0]], [tx[0], ty[0], tz[0]]])
U = (A + math.pi) / (2 * math.pi)
faces, uvs = grid_faces(NR, NS, U, T, pb, pt)
head = make_mesh("Head", verts, faces, uvs)

# ---------------------------------------------------------- head texture paint
TW, TH = 4096, 2048
uu, vv = np.meshgrid((np.arange(TW) + 0.5) / TW, (np.arange(TH) + 0.5) / TH)
pa = uu * 2 * math.pi - math.pi
px, py, pz = head_base(vv, pa)
front = np.cos(pa) > 0
ax = np.abs(px)
noise = RNG.random((TH, TW))
col = np.broadcast_to(SKIN, (TH, TW, 3)).copy()
# gentle tone variation: darker toward jaw / around eyes, warmer cheeks
col *= (1 - 0.10 * smoothstep(-0.05, -0.11, pz))[..., None]
col *= (1 - 0.18 * gauss2(ax, pz, EYE_X, EYE_Z, 0.020, 0.010) * front)[..., None]
col += (np.array([8, 2, 0]) * gauss2(ax, pz, 0.055, -0.045, 0.02, 0.02)[..., None] * front[..., None])
col *= (0.97 + 0.06 * noise[..., None])


def paint(mask, color, jitter=0.0):
    global col
    m = np.clip(mask, 0, 1)[..., None]
    c = np.array(color, float) * (1 + jitter * (RNG.random((TH, TW, 1)) - 0.5))
    col = col * (1 - m) + c * m


# hair (close crop: dark with fine speckle)
hm = hair_mask(pa, pz)
speck = (RNG.random((TH, TW)) < 0.55).astype(float)
paint(hm * (0.85 + 0.15 * speck), HAIR, 0.5)

# eyebrows: thick, fairly straight, slight arch, tapering tail
bx_ = (ax - 0.018) / 0.050
brow_c = -0.0005 + 0.0035 * np.sin(np.clip(bx_, 0, 1) * math.pi * 0.9) - 0.003 * np.clip(bx_ - 0.7, 0, 1)
brow_h = 0.0050 * (1 - 0.6 * np.clip(bx_, 0, 1) ** 2)
brow = smoothstep(brow_h, brow_h * 0.55, np.abs(pz - brow_c)) * smoothstep(-0.02, 0.06, bx_) * smoothstep(1.05, 0.9, bx_)
paint(brow * front * (0.75 + 0.25 * speck), HAIR, 0.4)

# upper eyelid crease / lash shadow
paint(0.55 * gauss2(ax, pz, EYE_X, EYE_Z + 0.0075, 0.012, 0.0018) * front, SKIN_DARK * 0.55)

# lips
xl = px / 0.037
up_top = -0.0815 - 0.0035 * xl ** 2 + 0.0012 * np.exp(-((ax - 0.007) / 0.004) ** 2)
lo_bot = -0.1035 + 0.0115 * xl ** 2
in_x = smoothstep(1.0, 0.85, np.abs(xl))
upper = in_x * smoothstep(up_top + 0.0008, up_top - 0.0008, pz) * smoothstep(-0.0915, -0.0895, pz)
lower = in_x * smoothstep(-0.0895, -0.0915, pz) * smoothstep(lo_bot - 0.0012, lo_bot + 0.0012, pz)
paint(upper * front, LIP_UP, 0.12)
paint(lower * front, LIP_LO, 0.10)
paint(0.8 * gauss2(px, pz + 0.003 * xl ** 2, 0, -0.0905, 0.036, 0.0009) * front, LIP_UP * 0.5)

# nostrils (seen from the front as dark crescents under the alae)
paint(0.9 * gauss2(ax, pz, 0.012, -0.0655, 0.0065, 0.0022) * front, (40, 24, 20))

# facial hair: thin moustache, chin beard, sparse jawline stubble
stub = (RNG.random((TH, TW)) < 0.5).astype(float)
must = gauss2(px, pz, 0, -0.0785, 0.024, 0.0028) * smoothstep(1.0, 0.75, np.abs(xl))
chin = smoothstep(-0.099, -0.106, pz) * np.exp(-(px / 0.034) ** 2)
jaw = smoothstep(-0.075, -0.105, pz) * smoothstep(0.03, 0.06, ax) * 0.45
paint((must * 0.8 + chin * 0.85 + jaw) * front * stub, HAIR * 1.4, 0.3)
paint((chin * 0.35 + jaw * 0.5) * front, SKIN_DARK)

Image.fromarray(np.clip(col[::-1], 0, 255).astype(np.uint8)).save(f"{OUT}/head_tex.jpg", quality=90)
rough = 0.58 + 0.40 * hm + 0.1 * (upper + lower) * -1
rgh = np.stack([np.zeros_like(rough), rough, np.zeros_like(rough)], -1) * 255
Image.fromarray(np.clip(rgh[::-1], 0, 255).astype(np.uint8)).save(f"{OUT}/head_rough.jpg", quality=90)

# ================================================================= MATERIALS


def mat_flat(name, rgba, rough=0.5, sss=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    return m


def mat_image(name, path, rough=0.5, repeat=True, rough_path=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.abspath(path))
    tex.extension = "REPEAT" if repeat else "EXTEND"
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if rough_path:
        rt = nt.nodes.new("ShaderNodeTexImage")
        rt.image = bpy.data.images.load(os.path.abspath(rough_path))
        rt.image.colorspace_settings.name = "Non-Color"
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(rt.outputs["Color"], sep.inputs["Color"])
        nt.links.new(sep.outputs["Green"], b.inputs["Roughness"])
    return m


M_HEAD = mat_image("Skin_Head", f"{OUT}/head_tex.jpg", 0.45, repeat=False, rough_path=f"{OUT}/head_rough.jpg")
M_SKIN = mat_flat("Skin", srgb(*SKIN * 0.97), 0.45)
M_EARIN = mat_flat("SkinShadow", srgb(*SKIN_DARK * 0.85), 0.5)
M_LID = mat_flat("Eyelid", srgb(*SKIN * 0.93), 0.45)
M_TEE = mat_flat("Tee", srgb(222, 228, 236), 0.8)
M_BTN = mat_flat("Button", srgb(205, 190, 185), 0.3)
M_BASE = mat_flat("Plinth", srgb(30, 30, 34), 0.35)
head.data.materials.append(M_HEAD)
M_HEAD.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.22

# plaid texture (one repeat, tileable)
def stripes(seq, n):
    cols = []
    for c, w in seq:
        cols += [c] * w
    cols = np.array(cols, float)
    idx = (np.arange(n) * len(cols) // n)
    return cols[idx]


R_, Wt, NV, PK = (200, 22, 38), (238, 236, 240), (45, 45, 75), (225, 150, 160)
SEQ = [(R_, 34), (Wt, 4), (NV, 3), (Wt, 9), (R_, 5), (Wt, 9), (NV, 3), (Wt, 4),
       (R_, 34), (Wt, 12), (NV, 2), (Wt, 12)]
P = 1024
warp = stripes(SEQ, P)
pl = (warp[None, :, :] + warp[:, None, :]) / 2
tw = ((np.arange(P)[None, :] + np.arange(P)[:, None]) // 3 % 2)[..., None]   # twill shimmer
pl = pl * (0.96 + 0.06 * tw) * (0.97 + 0.05 * RNG.random((P, P, 1)))
Image.fromarray(np.clip(pl, 0, 255).astype(np.uint8)).save(f"{OUT}/plaid.jpg", quality=90)
M_PLAID = mat_image("Plaid", f"{OUT}/plaid.jpg", 0.85)
PLAID_REPEAT = 0.11   # metres per tile

# ================================================================= EYES
bvh_head = BVHTree.FromPolygons([tuple(v) for v in verts], [tuple(f) for f in faces])


def front_surface(x, z, bvh):
    hit = bvh.ray_cast(Vector((x, -0.5, z)), Vector((0, 1, 0)))
    return hit[0]


eye_tex = np.zeros((256, 512, 3))
ev = (np.arange(256)[:, None] + 0.5) / 256 * np.ones((1, 512))
eye_tex[:] = (232, 222, 212)
eye_tex[ev > 0.83] = (52, 30, 22)
eye_tex[ev > 0.93] = (10, 8, 8)
Image.fromarray(eye_tex[::-1].astype(np.uint8)).save(f"{OUT}/eye.png")
M_EYE = mat_image("Eye", f"{OUT}/eye.png", 0.15, repeat=False)

ER = 0.0142
for side in (-1, 1):
    ex = side * EYE_X
    s = front_surface(ex, EYE_Z, bvh_head)
    cy = s.y - 0.0025 + ER
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=ER, location=(ex, cy, EYE_Z),
                                         rotation=(math.pi / 2, 0, 0))
    eye = bpy.context.object
    eye.name = f"Eye_{'L' if side < 0 else 'R'}"
    bpy.ops.object.shade_smooth()
    eye.data.materials.append(M_EYE)
    # eyelids: shell around the eyeball with an almond-shaped opening
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=96, v_segments=48, radius=ER * 1.10)
    kill = []
    for v in bm.verts:
        lx, ly, lz = v.co
        q = (lx * side) / (ER * 1.02)               # -1 inner corner .. 1 outer corner
        h = 0.0060 * max(0.0, 1 - q * q) ** 0.75
        c = -0.0006 + 0.0008 * q
        if ly < -0.004 and abs(lz - c) < h:
            kill.append(v)
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    me = bpy.data.meshes.new(f"Lids_{side}")
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    lid = bpy.data.objects.new(f"Eyelids_{'L' if side < 0 else 'R'}", me)
    lid.location = (ex, cy, EYE_Z)
    scene.collection.objects.link(lid)
    me.materials.append(M_LID)

# ================================================================= EARS
for side in (-1, 1):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        taper = 1 - 0.35 * max(0.0, -z) ** 1.5           # narrower lobe
        sy = 0.018 * taper
        nx, ny, nz = x * 0.007, y * sy, z * 0.031
        if x > 0:   # outer face: scoop out the concha, keep a rim
            r = math.hypot(y, z)
            nx -= 0.007 * max(0.0, 1 - (r / 0.8) ** 2)
        v.co = (nx, ny, nz)
    me = bpy.data.meshes.new(f"Ear_{side}")
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ear = bpy.data.objects.new(f"Ear_{'L' if side < 0 else 'R'}", me)
    ear.location = (side * 0.097, 0.010, -0.045)
    ear.rotation_euler = (0.12 * side, 0, -0.42 if side > 0 else math.pi + 0.42)
    scene.collection.objects.link(ear)
    me.materials.append(M_SKIN)

# ================================================================= NECK
NECK_ROWS = [(-0.03, 0.064, 0.058, 0.062, 0.012),
             (-0.10, 0.069, 0.062, 0.064, 0.014),
             (-0.16, 0.072, 0.064, 0.066, 0.014),
             (-0.20, 0.078, 0.068, 0.070, 0.014),
             (-0.24, 0.090, 0.075, 0.075, 0.014)]
(nW, nDf, nDb, nYs), nt_ = profile(NECK_ROWS)
nZ = PchipInterpolator(nt_, np.array(NECK_ROWS)[:, 0])
nr, ns = 40, 96
T2, A2 = np.meshgrid(np.linspace(0, 1, nr), np.linspace(-math.pi, math.pi, ns, endpoint=False), indexing="ij")
c2 = np.cos(A2)
NX = nW(T2) * np.sin(A2)
NY = nYs(T2) - np.where(c2 > 0, nDf(T2), nDb(T2)) * c2
NZ = nZ(T2)
nv = np.stack([NX, NY, NZ], -1).reshape(-1, 3)
f2, uv2 = grid_faces(nr, ns, (A2 + math.pi) / (2 * math.pi), T2)
neck = make_mesh("Neck", nv, f2, uv2)
neck.data.materials.append(M_SKIN)

# ================================================================= TORSO
#             z       W      Df     Db    n
TORSO_ROWS = [(-0.162, 0.082, 0.074, 0.076, 2.0),
              (-0.178, 0.098, 0.079, 0.079, 2.0),
              (-0.197, 0.130, 0.083, 0.080, 2.2),
              (-0.214, 0.172, 0.091, 0.086, 2.6),
              (-0.234, 0.208, 0.099, 0.092, 3.0),
              (-0.262, 0.230, 0.107, 0.098, 3.4),
              (-0.300, 0.240, 0.114, 0.104, 3.8),
              (-0.380, 0.243, 0.120, 0.108, 4.0),
              (-0.460, 0.240, 0.121, 0.108, 4.0),
              (-0.530, 0.236, 0.119, 0.106, 4.0)]
TYS = 0.014
(tW, tDf, tDb, tN), tt_ = profile(TORSO_ROWS)
tZ = PchipInterpolator(tt_, np.array(TORSO_ROWS)[:, 0])


def torso_pts(t, a, shrink=0.0):
    W, Df, Db, n, z = tW(t) - shrink, tDf(t) - shrink, tDb(t) - shrink, tN(t), tZ(t)
    s, c = np.sin(a), np.cos(a)
    e = 2 / n
    x = W * np.sign(s) * np.abs(s) ** e
    y = TYS - np.where(c > 0, Df, Db) * np.sign(c) * np.abs(c) ** e
    return x, y, z


tr, tsg = 90, 240
T3, A3 = np.meshgrid(np.linspace(0, 1, tr), np.linspace(-math.pi, math.pi, tsg, endpoint=False), indexing="ij")
TX, TY, TZ = torso_pts(T3, A3)
# metric UVs: arc length around (u) and along the meridian (v)
seg = np.hypot(np.diff(np.c_[TX, TX[:, :1]], axis=1), np.diff(np.c_[TY, TY[:, :1]], axis=1))
u_m = np.c_[np.zeros((tr, 1)), np.cumsum(seg, axis=1)[:, :-1]]
mer = np.sqrt(np.diff(TX, axis=0) ** 2 + np.diff(TY, axis=0) ** 2 + np.diff(TZ, axis=0) ** 2)
v_m = -np.r_[np.zeros((1, tsg)), np.cumsum(mer, axis=0)]
perim = np.c_[seg].sum(axis=1)
tv = np.stack([TX, TY, TZ], -1).reshape(-1, 3)
# bottom cap centre
cap_i = len(tv)
tv = np.vstack([tv, [0, TYS, TZ[-1, 0]]])
f3, uv3 = [], []
Uu, Vv = u_m / PLAID_REPEAT, v_m / PLAID_REPEAT
for i in range(tr - 1):
    for j in range(tsg):
        j1 = (j + 1) % tsg
        f3.append((i * tsg + j, i * tsg + j1, (i + 1) * tsg + j1, (i + 1) * tsg + j))
        wu = lambda ii, jj, wrap: Uu[ii, jj] + (perim[ii] / PLAID_REPEAT if wrap else 0)
        w = j1 == 0
        uv3.append([(Uu[i, j], Vv[i, j]), (wu(i, j1, w), Vv[i, j1]), (wu(i + 1, j1, w), Vv[i + 1, j1]), (Uu[i + 1, j], Vv[i + 1, j])])
for j in range(tsg):
    j1 = (j + 1) % tsg
    f3.append(((tr - 1) * tsg + j1, (tr - 1) * tsg + j, cap_i))
    uv3.append([(0, 0), (0, 0), (0, 0)])


ZV = -0.300


def vhalf(z):
    return 0.080 * np.clip((z - ZV) / (-0.160 - ZV), 0, 1) ** 0.7


# open V-neck: drop shirt faces in front of the tee
keep_f, keep_uv = [], []
for f, uv in zip(f3, uv3):
    c = tv[list(f)].mean(axis=0)
    if c[1] < TYS and c[2] > ZV and abs(c[0]) < vhalf(c[2]):
        continue
    keep_f.append(f); keep_uv.append(uv)
shirt = make_mesh("Shirt", tv, keep_f, keep_uv)
shirt.data.materials.append(M_PLAID)
# the bottom cap uses a separate dark material for a plinth look
shirt.data.materials.append(M_BASE)
for p in shirt.data.polygons:
    if len(p.vertices) == 3:
        p.material_index = 1
bvh_shirt = BVHTree.FromPolygons([tuple(v) for v in tv], [tuple(f) for f in f3])

# undershirt (white tee) just inside the shirt
TX2, TY2, TZ2 = torso_pts(T3, A3, shrink=0.004)
tv2 = np.stack([TX2, TY2, TZ2], -1).reshape(-1, 3)
f4 = [f for f in f3 if len(f) == 4]
tee = make_mesh("Tee", tv2, f4)
tee.data.materials.append(M_TEE)


# ------------------------------------------------- surface-hugging patches
def patch(name, corners, nu, nv, lift, lift_fn=None, thickness=0.0022, mat=M_PLAID):
    """Bilinear patch from 4 (x,z) corners [p00,p10,p11,p01], snapped to the shirt surface."""
    p00, p10, p11, p01 = [np.array(c, float) for c in corners]
    vs, uvs_, fs = [], [], []
    for i in range(nv + 1):
        for j in range(nu + 1):
            s, t = j / nu, i / nv
            x, z = (1 - s) * (1 - t) * p00 + s * (1 - t) * p10 + s * t * p11 + (1 - s) * t * p01
            loc, nrm, _, _ = bvh_shirt.find_nearest(Vector((x, -0.2, z)))
            if loc is None:
                continue
            hit = bvh_shirt.ray_cast(Vector((x, -0.5, z)), Vector((0, 1, 0)))
            if hit[0] is not None and hit[1].y < -0.3:
                loc, nrm = hit[0], hit[1]
            elif hit[0] is not None and abs(hit[0].z - z) < 0.01:
                loc, nrm = hit[0], hit[1]
            if nrm.y > 0:
                nrm = -nrm
            l = lift + (lift_fn(s, t) if lift_fn else 0)
            p = loc + nrm * l
            vs.append(tuple(p))
            uvs_.append((p.x / PLAID_REPEAT + 0.37, p.z / PLAID_REPEAT + 0.21))
    for i in range(nv):
        for j in range(nu):
            a = i * (nu + 1) + j
            fs.append((a, a + 1, a + nu + 2, a + nu + 1))
    ob = make_mesh(name, np.array(vs), fs, [[uvs_[k] for k in f] for f in fs])
    ob.data.materials.append(mat)
    mod = ob.modifiers.new("Solidify", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = -1
    return ob


for side in (-1, 1):
    sx = side
    # placket strip along the V edge
    zs = np.linspace(-0.170, ZV, 2)
    patch(f"Placket_{side}", [(sx * (vhalf(-0.170) - 0.004), -0.170), (sx * (vhalf(-0.170) + 0.020), -0.170),
                               (sx * 0.020, ZV - 0.004), (sx * -0.004, ZV - 0.004)], 3, 24, 0.0018)
    # collar wing lying on the chest, rolled at the neck
    patch(f"Collar_{side}",
          [(sx * 0.072, -0.156), (sx * 0.104, -0.172), (sx * 0.128, -0.258), (sx * 0.046, -0.238)],
          10, 12, 0.0045, lift_fn=lambda s, t: 0.006 * (1 - t) ** 2, thickness=0.0028)
    # chest pocket + pointed flap
    cx = sx * 0.122
    patch(f"Pocket_{side}", [(cx - 0.058, -0.352), (cx + 0.058, -0.352), (cx + 0.058, -0.432), (cx - 0.058, -0.432)],
          8, 8, 0.0025, thickness=0.0015)
    flap = patch(f"PocketFlap_{side}", [(cx - 0.060, -0.343), (cx + 0.060, -0.343), (cx + 0.060, -0.372), (cx - 0.060, -0.372)],
                 12, 4, 0.0055, thickness=0.002)
    # pull the flap's lower edge into a western point
    for v in flap.data.vertices:
        if v.co.z < -0.365:
            dx = abs(v.co.x - cx) / 0.06
            v.co.z -= 0.013 * (1 - dx)

# centre placket below the V
patch("Placket_C", [(-0.017, ZV + 0.004), (0.017, ZV + 0.004), (0.017, -0.528), (-0.017, -0.528)], 3, 20, 0.002)

# collar stand around the back of the neck
bm = bmesh.new()
ring_lo, ring_hi = [], []
angs = np.linspace(math.radians(52), math.radians(308), 64)
for ang in angs:
    s, c = math.sin(ang), math.cos(ang)
    ring_lo.append(bm.verts.new((0.086 * s, TYS - 0.079 * c, -0.172)))
    ring_hi.append(bm.verts.new((0.084 * s, TYS - 0.077 * c + 0.004 * (c < 0), -0.138)))
for k in range(len(angs) - 1):
    bm.faces.new((ring_lo[k], ring_lo[k + 1], ring_hi[k + 1], ring_hi[k]))
uvl = bm.loops.layers.uv.new("UVMap")
for f in bm.faces:
    for l in f.loops:
        co = l.vert.co
        l[uvl].uv = (math.atan2(co.x, co.y) * 0.08 / PLAID_REPEAT, co.z / PLAID_REPEAT)
me = bpy.data.meshes.new("CollarStand")
bm.to_mesh(me); bm.free(); me.shade_smooth()
stand = bpy.data.objects.new("CollarStand", me)
scene.collection.objects.link(stand)
me.materials.append(M_PLAID)
m = stand.modifiers.new("Solidify", "SOLIDIFY"); m.thickness = 0.003

# buttons
def button(x, z, r=0.0055):
    hit = bvh_shirt.ray_cast(Vector((x, -0.5, z)), Vector((0, 1, 0)))
    if hit[0] is None:
        return
    loc = hit[0] + hit[1] * 0.0065
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=r, depth=0.002, location=loc)
    b = bpy.context.object
    b.rotation_euler = hit[1].to_track_quat('Z', 'Y').to_euler()
    bpy.ops.object.shade_smooth()
    b.data.materials.append(M_BTN)


for z in (-0.318, -0.405, -0.492):
    button(0.0, z)
for side in (-1, 1):
    button(side * 0.122, -0.374)

# ================================================================= OUTPUT
for ob in list(scene.collection.objects):
    ob.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(f"{OUT}/avatar.blend"))
bpy.ops.export_scene.gltf(filepath=os.path.abspath(f"{OUT}/avatar.glb"), export_format="GLB",
                          export_apply=True, export_yup=True)
print("saved")
