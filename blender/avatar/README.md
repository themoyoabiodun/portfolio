# 3D avatar

Stylized bust modelled procedurally in Blender (5.2 LTS) from a single reference photo.

| File | What it is |
| --- | --- |
| `avatar.blend` | Editable Blender scene (open in Blender 4.2+/5.x) |
| `avatar.glb` | Web-ready glTF binary (textures embedded), Y-up, metres |
| `build.py` | Script that generates the whole model and textures |
| `render.py` | Cycles preview renders (front, three-quarter, face, side) |
| `renders/` | Preview images |

Rebuild (needs the `bpy`, `numpy`, `scipy`, `pillow` Python packages):

```bash
python build.py out
python render.py out/avatar.blend out/renders 1024 64
```

Proportions, hairline, brows, lips and facial hair are all parameters near the top of
`build.py` (`HEAD_ROWS`, `HAIRLINE`, `face_disp`, and the texture-painting section), so
likeness tweaks are a one-line change and a rebuild.
