import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
blend, out = argv[0], argv[1]
res = int(argv[2]) if len(argv) > 2 else 640
samples = int(argv[3]) if len(argv) > 3 else 48
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = res
sc.view_settings.view_transform = "Standard"
sc.view_settings.exposure = -0.75
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.82, 0.84, 0.88, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6

def light(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, "AREA"); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector((0, 0, -0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light("Key", (-0.9, -1.2, 0.6), 160, 0.9, (1, 0.96, 0.9))
light("Fill", (1.1, -1.0, 0.1), 60, 1.2, (0.9, 0.95, 1))
light("Rim", (0.4, 1.0, 0.7), 90, 0.6)

cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 85
cam = bpy.data.objects.new("Cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
views = {"front": (0, -1.75, -0.12, -0.16), "three_quarter": (-34, -1.75, -0.12, -0.16),
         "side": (-90, -1.75, -0.12, -0.16), "face": (0, -0.85, -0.02, -0.02), "face_3q": (-30, -0.85, -0.02, -0.02)}
sel = argv[4].split(",") if len(argv) > 4 else list(views)
for name in sel:
    ang, dist, cz, tz = views[name]
    r = math.radians(ang)
    cam.location = (-math.sin(r) * -dist * -1 if False else math.sin(r) * dist, math.cos(r) * dist, cz + 0.05)
    cam.rotation_euler = (Vector((0, 0, tz)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(out, f"{name}.png")
    bpy.ops.render.render(write_still=True)
