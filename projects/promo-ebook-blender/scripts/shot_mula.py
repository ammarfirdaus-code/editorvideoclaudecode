"""Shot D: warm room, push-in to easel, 3D "Mula" button pressed by a 3D cursor.

Run:  blender -b -P scripts/shot_mula.py -- [--still FRAME] [--samples N] [--out DIR]
Axes: X right, Y into the room, Z up. 30 fps, frames 1-75 (2.5 s).
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEX = os.path.join(ROOT, 'tex')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
STILL = arg('--still', 0)
SAMPLES = arg('--samples', 64)
OUT = arg('--out', os.path.join(ROOT, 'out', 'mula'))
FPS = 30
f = lambda sec: 1 + round(sec * FPS)

# ---------------------------------------------------------------- reset
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, 75

# ---------------------------------------------------------------- materials
def mat(name, color, rough=0.6, coat=0.0, emit=None, emit_str=0.0, tex=None, bump=0.0, sss=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.2
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.3, 0.15, 0.1)
        b.inputs['Subsurface Scale'].default_value = 0.05
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_str
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(TEX, tex))
        t.interpolation = 'Cubic'
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if bump:
        n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 180; n.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.002
        nt.links.new(n.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def srgb(hexv):
    c = [int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

M = {
    'wall': mat('wall', srgb('ece2fa'), 0.95, bump=0.15),
    'floor': mat('floor', srgb('dccbf3'), 0.75, bump=0.1),
    'white': mat('white', srgb('fffaf4'), 0.45),
    'desk': mat('desk', srgb('fbf8ff'), 0.4, coat=0.2),
    'wood': mat('wood', srgb('cdb8f5'), 0.55),
    'orange': mat('orange', srgb('f55fbc'), 0.35, coat=0.6, bump=0.25, sss=0.1),
    'chair': mat('chair', srgb('8b62f5'), 0.55),
    'peg': mat('peg', (1, 1, 1), 0.6, tex='pegboard.png'),
    'notes': mat('notes', (1, 1, 1), 0.7, tex='notes.png'),
    'plant': mat('plant', srgb('9cc46a'), 0.5, sss=0.2),
    'pot': mat('pot', srgb('f1eafc'), 0.5),
    'cup': mat('cup', srgb('e7dcfb'), 0.5),
    'page_l': mat('page_l', (1, 1, 1), 0.7, tex='page_workflow.png'),
    'page_r': mat('page_r', (1, 1, 1), 0.7, tex='page_screens.png'),
    'indigo': mat('indigo', srgb('3a2fa6'), 0.5),
    'pencils': [mat(f'pen{i}', srgb(h), 0.4) for i, h in enumerate(['7c57f9', 'f55fbc', 'ffd23f', 'ac5ce4', '675afa'])],
    'btn': mat('btn', srgb('e6dcfd'), 0.3, coat=0.8),
    'btntxt': mat('btntxt', srgb('7c57f9'), 0.3, coat=0.6, emit=(1, 0.95, 0.85), emit_str=0.0),
}

# ---------------------------------------------------------------- mesh helpers
def link(o):
    bpy.context.collection.objects.link(o); return o

def box(name, size, loc, m, bevel=0.0, seg=3, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.scale = size; o.location = loc; o.rotation_euler = rot
    o.data.materials.append(m)
    if bevel:
        bpy.context.view_layer.objects.active = o; o.select_set(True)
        bpy.ops.object.transform_apply(scale=True); o.select_set(False)
        mod = o.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = seg; mod.limit_method = 'NONE'
        o.modifiers.new('ws', 'WEIGHTED_NORMAL')
        for p in o.data.polygons: p.use_smooth = True
    return o

def cyl(name, r, h, loc, m, r2=None, verts=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
    bpy.ops.object.shade_smooth(); return o

def plane(name, w, h, loc, rot, m):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1); o.data.materials.append(m); return o

# ---------------------------------------------------------------- room
plane('floor', 40, 40, (0, 0, 0), (0, 0, 0), M['floor'])
WY, WW, WH, WZ = 4.2, 5.2, 3.0, 2.4
for (x, z, w, h) in [(0, WZ + WH / 2 + 2.5, 30, 5), (0, (WZ - WH / 2) / 2, 30, WZ - WH / 2), (-(WW / 2 + 7.5), WZ, 15, WH), (WW / 2 + 7.5, WZ, 15, WH)]:
    box('wall', (w, 0.3, h), (x, WY, z), M['wall'])
for x in (-WW / 2, 0, WW / 2):
    box('mullion', (0.1, 0.22, WH), (x, WY, WZ), M['white'], bevel=0.02)
box('sill', (WW + 0.4, 0.5, 0.1), (0, WY - 0.15, WZ - WH / 2), M['white'], bevel=0.02)
box('sidewall', (0.3, 20, 10), (-5.2, 0, 5), M['wall'])
plane('notes', 1.7, 1.7, (-5.04, 2.2, 3.0), (math.pi / 2, 0, math.pi / 2), M['notes'])
# bright outside
sky = mat('outside', (1, 1, 1), 1.0, emit=(1.0, 0.95, 0.92), emit_str=7.0)
plane('outside', 12, 7, (0, WY + 1.5, WZ), (math.pi / 2, 0, 0), sky)

# desk
box('desktop', (3.4, 1.2, 0.08), (0, 2.6, 1.05), M['desk'], bevel=0.03)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl('leg', 0.025, 1.05, (sx * 1.55, 2.6 + sy * 0.48, 0.525), M['white'], verts=12)

# easel + open book
easel = bpy.data.objects.new('easel', None); link(easel); easel.location = (0, 2.85, 1.78); easel.rotation_euler = (math.radians(-10), 0, 0)
def child(o, parent):
    o.parent = parent; return o
child(box('board', (2.0, 0.06, 1.25), (0, 0, 0), M['wood'], bevel=0.02), easel)
for side, pm in ((-1, M['page_l']), (1, M['page_r'])):
    blk = box('pages', (0.82, 0.05, 1.15), (side * 0.42, -0.07, 0), M['white'], bevel=0.008, rot=(0, 0, side * math.radians(4)))
    child(blk, easel)
    pg = plane('page', 0.82, 1.15, (side * 0.42, -0.0955, 0), (math.pi / 2, 0, side * math.radians(4)), pm)
    pg.scale = (0.82, 1.15, 1); child(pg, easel)
    # nudge page in front of its block, accounting for rotation
    pg.location.y = -0.07 - 0.026 + side * 0.0
child(box('bookcover', (1.72, 0.02, 1.2), (0, -0.035, 0), M['indigo'], bevel=0.005), easel)

# plant
cyl('pot', 0.16, 0.26, (-1.35, 2.75, 1.22), M['pot'], r2=0.12)
for i in range(6):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(-1.35 + (i - 2.5) * 0.05, 2.75, 1.55), segments=16, ring_count=8)
    leaf = bpy.context.active_object; leaf.scale = (0.6, 0.6, 3.2); leaf.rotation_euler = (0, (i - 2.5) * 0.3, 0); leaf.data.materials.append(M['plant']); bpy.ops.object.shade_smooth()
# mug
cyl('mug', 0.17, 0.36, (-0.95, 2.3, 1.27), M['chair'], r2=0.16)
bpy.ops.mesh.primitive_torus_add(major_radius=0.1, minor_radius=0.03, location=(-0.77, 2.3, 1.29), rotation=(math.pi / 2, 0, 0))
bpy.context.active_object.data.materials.append(M['chair']); bpy.ops.object.shade_smooth()
# pencil cup
cyl('pcup', 0.15, 0.34, (1.15, 2.55, 1.26), M['cup'], r2=0.13)
for i in range(6):
    a = i / 6 * 2 * math.pi
    p = cyl('pencil', 0.02, 0.5, (1.15 + math.cos(a) * 0.06, 2.55 + math.sin(a) * 0.06, 1.48), M['pencils'][i % 5], verts=6,
            rot=(math.sin(a) * 0.25, -math.cos(a) * 0.25, 0))
# AMMARCREAVA logo disc standing on the desk
logo_m = mat('logo', (1, 1, 1), 0.35, coat=0.6, tex='logo_round.png')
lnt = logo_m.node_tree; limg = [n for n in lnt.nodes if n.type == 'TEX_IMAGE'][0]
lnt.links.new(limg.outputs['Alpha'], lnt.nodes['Principled BSDF'].inputs['Alpha'])
logo_m.blend_method = 'HASHED' if hasattr(logo_m, 'blend_method') else None
cyl('logostand', 0.05, 0.03, (0.72, 2.45, 1.105), M['white'], verts=24)
cyl('logoback', 0.172, 0.02, (0.72, 2.45, 1.29), M['white'], verts=64, rot=(math.pi / 2, 0, 0))
plane('logo', 0.34, 0.34, (0.72, 2.438, 1.29), (math.pi / 2, 0, 0), logo_m)
# lying book
box('bookflat', (0.55, 0.78, 0.09), (-0.45, 2.25, 1.135), M['indigo'], bevel=0.01, rot=(0, 0, 0.3))
# chair
box('seat', (0.9, 0.85, 0.12), (1.9, 1.6, 0.95), M['chair'], bevel=0.05)
back = box('back', (0.95, 0.1, 1.05), (1.9, 2.0, 1.6), M['chair'], bevel=0.04)
pg = plane('pegface', 0.9, 1.0, (1.9, 1.944, 1.6), (math.pi / 2, 0, 0), M['peg'])
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl('cleg', 0.03, 0.95, (1.9 + sx * 0.36, 1.6 + sy * 0.33, 0.475), M['white'], verts=10)
chair = bpy.data.objects.new('chair', None); link(chair)
for n in ('seat', 'back', 'pegface'):
    bpy.data.objects[n].parent = chair
for o in bpy.data.objects:
    if o.name.startswith('cleg'): o.parent = chair
chair.rotation_euler = (0, 0, math.radians(-25)); chair.location = (0.7, 0.9, 0)

# ---------------------------------------------------------------- Mula button
btn = bpy.data.objects.new('Btn', None); link(btn); btn.location = (-0.05, 1.75, 1.38)
body = box('btnbody', (0.69, 0.1, 0.25), (0, 0, 0), M['btn'], bevel=0.049, seg=8); body.parent = btn
bpy.ops.object.text_add(location=(0, -0.06, 0), rotation=(math.pi / 2, 0, 0))
txt = bpy.context.active_object; txt.name = 'btntext'
txt.data.body = 'Mula'; txt.data.font = bpy.data.fonts.load(os.path.join(TEX, 'Nunito-900.ttf'))
txt.data.size = 0.15; txt.data.extrude = 0.018; txt.data.bevel_depth = 0.005; txt.data.bevel_resolution = 3
txt.data.align_x = 'CENTER'; txt.data.align_y = 'CENTER'; txt.data.materials.append(M['btntxt']); txt.parent = btn

# ---------------------------------------------------------------- cursor
def cursor_mesh(name, m, s):
    pts = [(0, 0), (0, -1.0), (0.24, -0.78), (0.42, -1.16), (0.58, -1.09), (0.41, -0.72), (0.73, -0.72)]
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x * s, 0, y * s)) for x, y in pts]; face = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[face]); ext = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ext, vec=(0, 0.06 * s * 4, 0)); bm.normal_update(); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.data.materials.append(m)
    mod = o.modifiers.new('bev', 'BEVEL'); mod.width = 0.035 * s * 4; mod.segments = 6; mod.limit_method = 'NONE'
    for p in o.data.polygons: p.use_smooth = True
    return o
cur = cursor_mesh('cursor', M['orange'], 0.2)

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 32
cam = link(bpy.data.objects.new('cam', cam_data)); sc.camera = cam
tgt = bpy.data.objects.new('camtarget', None); link(tgt); tgt.location = (0, 2.8, 1.6)
tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
cam_data.dof.use_dof = True; cam_data.dof.focus_object = btn; cam_data.dof.aperture_fstop = 1.6

# ---------------------------------------------------------------- lights
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (*srgb('e9dcfb'), 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 4.5; sun.color = (1.0, 0.94, 0.88); sun.angle = math.radians(6)
so = link(bpy.data.objects.new('sun', sun)); so.rotation_euler = (math.radians(-58), math.radians(8), math.radians(185))
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 120; fill.size = 4; fill.color = (0.92, 0.85, 1.0)
fo = link(bpy.data.objects.new('fill', fill)); fo.location = (1.5, -2.5, 3.0); fo.rotation_euler = (math.radians(60), 0, math.radians(20))

# ---------------------------------------------------------------- animation
def key(o, path, frame, value, interp='BEZIER'):
    setattr(o, path, value) if not isinstance(path, tuple) else None
    o.keyframe_insert(data_path=path, frame=frame)
    for fc in (o.animation_data.action.fcurves if o.animation_data and o.animation_data.action else []):
        for kp in fc.keyframe_points:
            if kp.co.x == frame: kp.interpolation = interp

# camera push-in (three.js coords mapped: x, -z, y)
cam.location = (0.75, -0.9, 1.95); cam.keyframe_insert('location', frame=1)
cam.location = (0.3, -0.05, 1.82); cam.keyframe_insert('location', frame=75)
cam.rotation_euler = (0, 0, 0)
# slight dutch roll via target offset
tgt.location = (0.05, 2.8, 1.62); tgt.keyframe_insert('location', frame=1)
tgt.location = (-0.05, 2.8, 1.58); tgt.keyframe_insert('location', frame=75)

# button pop
for fr, s in ((1, 0.001), (f(0.25), 0.001), (f(0.7), 1.12), (f(1.0), 1.0), (f(1.6), 1.0), (f(1.68), 0.92), (f(1.8), 1.0)):
    btn.scale = (s, s, s); btn.keyframe_insert('scale', frame=fr)
# cursor path, faces camera with small tilt
cur.location = (1.4, 0.3, 0.7); cur.keyframe_insert('location', frame=1); cur.keyframe_insert('location', frame=f(0.8))
cur.location = (0.24, 1.62, 1.37); cur.keyframe_insert('location', frame=f(1.55))
cur.location = (0.24, 1.66, 1.36); cur.keyframe_insert('location', frame=f(1.66))
cur.location = (0.24, 1.62, 1.37); cur.keyframe_insert('location', frame=f(1.8))
cur.location = (0.26, 1.6, 1.36); cur.keyframe_insert('location', frame=75)
cur.rotation_euler = (0, math.radians(12), math.radians(-12))
# colour change on press
b = M['btn'].node_tree.nodes['Principled BSDF'].inputs['Base Color']
t = M['btntxt'].node_tree.nodes['Principled BSDF']
for fr, bc, tcol, em in ((f(1.7), srgb('e6dcfd'), srgb('7c57f9'), 0.0), (f(1.95), srgb('7c57f9'), (1, 1, 1), 2.2)):
    b.default_value = (*bc, 1); b.keyframe_insert('default_value', frame=fr)
    t.inputs['Base Color'].default_value = (*tcol, 1); t.inputs['Base Color'].keyframe_insert('default_value', frame=fr)
    t.inputs['Emission Strength'].default_value = em; t.inputs['Emission Strength'].keyframe_insert('default_value', frame=fr)

# ---------------------------------------------------------------- render settings
r = sc.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 1280, 720; r.resolution_percentage = 100
sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 2; sc.cycles.transmission_bounces = 2
sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
r.use_motion_blur = True; r.motion_blur_shutter = 0.5
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = 0.0
r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 94
r.use_persistent_data = True

# compositor glow
sc.use_nodes = True; nt = sc.node_tree; nt.nodes.clear()
rl = nt.nodes.new('CompositorNodeRLayers'); gl = nt.nodes.new('CompositorNodeGlare'); out = nt.nodes.new('CompositorNodeComposite')
gl.glare_type = 'FOG_GLOW'; gl.quality = 'MEDIUM'; gl.threshold = 0.9; gl.mix = -0.55; gl.size = 8
nt.links.new(rl.outputs['Image'], gl.inputs['Image']); nt.links.new(gl.outputs['Image'], out.inputs['Image'])

os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'out', 'shot_mula.blend'))
if STILL:
    sc.frame_set(STILL); r.filepath = os.path.join(OUT, f'still_{STILL:03d}.jpg'); bpy.ops.render.render(write_still=True)
else:
    r.filepath = os.path.join(OUT, 'f'); bpy.ops.render.render(animation=True)
