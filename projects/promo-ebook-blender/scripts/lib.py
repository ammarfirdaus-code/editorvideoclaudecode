"""Shared Blender helpers: brand materials, object factories, label textures, keyframes, render setup."""
import bpy, bmesh, math, os
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEX = os.path.join(ROOT, 'tex')
GEN = os.path.join(TEX, 'gen'); os.makedirs(GEN, exist_ok=True)
FPS = 30

def T(x, y, z):
    """three.js (Y up, -Z forward) -> Blender (Z up, +Y forward)."""
    return (x, -z, y)

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)

BR = dict(violet='7c57f9', purple='ac5ce4', pink='f55fbc', indigo='675afa', yellow='ffd23f', deep='3b2a7a',
          lav='ece2fa', lav2='dccbf3', white='fbf8ff', ink='2a1f4a')
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in BR.items()}

def reset(frames):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = frames
    return sc

# ------------------------------------------------------------------ materials
_mats = {}
def mat(name, color, rough=0.55, coat=0.0, emit=None, emit_str=0.0, tex=None, bump=0.0, sss=0.0, alpha_tex=False, metal=0.0):
    key = name
    if key in _mats: return _mats[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.15
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.25, 0.15, 0.3)
        b.inputs['Subsurface Scale'].default_value = 0.04
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_str
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex if os.path.isabs(tex) else os.path.join(TEX, tex), check_existing=True)
        t.interpolation = 'Cubic'; t.extension = 'CLIP'
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alpha_tex: nt.links.new(t.outputs['Alpha'], b.inputs['Alpha'])
    if bump:
        n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 160; n.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.002
        nt.links.new(n.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    _mats[key] = m; return m

def C(name, rough=0.55, **kw):
    return mat('c_' + name + str(rough) + str(sorted(kw.items())), srgb(BR.get(name, name)), rough, **kw)

def glossy(name, **kw):
    return C(name, 0.28, coat=0.7, **kw)

# ------------------------------------------------------------------ objects
def link(o):
    bpy.context.collection.objects.link(o); return o

def empty(name, loc=(0, 0, 0), parent=None):
    e = link(bpy.data.objects.new(name, None)); e.location = loc
    if parent: e.parent = parent
    return e

def box(name, size, loc, m, bevel=0.0, seg=4, rot=(0, 0, 0), parent=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.rotation_euler = rot
    if isinstance(m, list):
        for mm in m: o.data.materials.append(mm)
    else: o.data.materials.append(m)
    if bevel:
        mod = o.modifiers.new('bev', 'BEVEL'); mod.width = bevel; mod.segments = seg; mod.limit_method = 'NONE'
        o.modifiers.new('wn', 'WEIGHTED_NORMAL')
        for p in o.data.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o

def cyl(name, r, h, loc, m, r2=None, verts=32, rot=(0, 0, 0), parent=None, cap=True):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot,
                                    end_fill_type='NGON' if cap else 'NOTHING')
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m); bpy.ops.object.shade_smooth()
    if parent: o.parent = parent
    return o

def sphere(name, r, loc, m, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object; o.name = name; o.scale = scale; o.data.materials.append(m); bpy.ops.object.shade_smooth()
    if parent: o.parent = parent
    return o

def plane(name, w, h, loc, rot, m, parent=None):
    """Plane in the XZ plane facing -Y (rot applied after)."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new(v) for v in [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]]
    f = bm.faces.new(vs); uv = bm.loops.layers.uv.new()
    for loop, c in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): loop[uv].uv = c
    f.normal_update(); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    if o.data.polygons[0].normal.y > 0: o.data.flip_normals() if hasattr(o.data, 'flip_normals') else None
    if parent: o.parent = parent
    return o

def text3d(name, body, size, depth, m, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0), font='Nunito-900.ttf', parent=None, bevel=None):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body
    cu.font = bpy.data.fonts.load(os.path.join(TEX, font), check_existing=True)
    cu.size = size; cu.extrude = depth; cu.bevel_depth = bevel if bevel is not None else depth * 0.3; cu.bevel_resolution = 3
    cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = link(bpy.data.objects.new(name, cu)); o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    if parent: o.parent = parent
    return o

def cursor(name, color='pink', s=0.2, parent=None):
    pts = [(0, 0), (0, -1.0), (0.24, -0.78), (0.42, -1.16), (0.58, -1.09), (0.41, -0.72), (0.73, -0.72)]
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x * s, 0, y * s)) for x, y in pts]; face = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[face]); ext = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=ext, vec=(0, 0.24 * s, 0)); bmesh.ops.translate(bm, verts=bm.verts, vec=(0, -0.12 * s, 0))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.data.materials.append(glossy(color, bump=0.25))
    mod = o.modifiers.new('bev', 'BEVEL'); mod.width = 0.14 * s; mod.segments = 6; mod.limit_method = 'NONE'
    for p in o.data.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o

# ------------------------------------------------------------------ label textures (PIL)
def font(sz, w=900):
    return ImageFont.truetype(os.path.join(TEX, f'Nunito-{w}.ttf'), sz)

def label_png(name, w, h, draw):
    path = os.path.join(GEN, name + '.png')
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im); draw(d, w, h, im); im.save(path); return path

def pill_png(name, title, sub=None, fg='ink', icon_bg='violet', w=900, h=300):
    def dr(d, W, H, im):
        u = H / 100
        d.rounded_rectangle((W - 78 * u, 24 * u, W - 26 * u, 76 * u), 14 * u, fill=RGB[icon_bg] if icon_bg in RGB else icon_bg)
        tri = 'white' if icon_bg != 'white' else RGB['violet']
        d.polygon([(W - 60 * u, 38 * u), (W - 60 * u, 62 * u), (W - 40 * u, 50 * u)], fill=tri)
        col = RGB[fg] if fg in RGB else fg
        if sub:
            d.text((28 * u, 44 * u), title, font=font(int(30 * u)), fill=col, anchor='lm')
            d.text((30 * u, 74 * u), sub, font=font(int(17 * u), 800), fill=(130, 115, 160), anchor='lm')
        else:
            d.text((28 * u, 50 * u), title, font=font(int(40 * u)), fill=col, anchor='lm')
    return label_png(name, w, h, dr)

def card(name, w, h, body_color, png, depth=0.06, bevel=None, parent=None, emit=0.0):
    """Rounded slab facing -Y with a PNG face."""
    g = empty(name, parent=parent)
    bev = bevel if bevel is not None else min(depth / 2 - 0.001, min(w, h) * 0.3)
    box(name + '_body', (w, depth, h), (0, 0, 0), body_color if not isinstance(body_color, str) else glossy(body_color), bevel=bev, seg=6, parent=g)
    fm = mat('face_' + name, (1, 1, 1), 0.45, tex=png, alpha_tex=True, emit=(1, 1, 1) if emit else None, emit_str=emit)
    if emit:
        fnt = fm.node_tree; img = [n for n in fnt.nodes if n.type == 'TEX_IMAGE'][0]
        fnt.links.new(img.outputs['Color'], fnt.nodes['Principled BSDF'].inputs['Emission Color'])
    plane(name + '_face', w * 0.98, h * 0.98, (0, -depth / 2 - 0.002, 0), (0, 0, 0), fm, parent=g)
    return g

def sticky(name, text, bg='ffd23f', w=0.5, h=0.42, fg=(90, 50, 20), parent=None):
    def dr(d, W, H, im):
        d.rectangle((0, 0, W, H), fill=tuple(int(bg[i:i + 2], 16) for i in (0, 2, 4)))
        f = font(int(H * 0.16), 800); words = text.split(); line = ''; y = H * 0.3
        for wd in words:
            if d.textlength(line + wd + ' ', font=f) > W * 0.8 and line:
                d.text((W * 0.1, y), line, font=f, fill=fg, anchor='lm'); y += H * 0.2; line = ''
            line += wd + ' '
        d.text((W * 0.1, y), line, font=f, fill=fg, anchor='lm')
    png = label_png('sticky_' + name, 600, int(600 * h / w), dr)
    return card(name, w, h, mat('stk_' + bg, srgb(bg), 0.7), png, depth=0.01, bevel=0.002, parent=parent)

def book(name, w=0.55, h=0.78, d=0.08, parent=None):
    """Closed ebook, cover on -Y face."""
    g = empty(name, parent=parent)
    box(name + '_block', (w, d, h), (0, 0, 0), mat('pageedge', srgb('fbf8f2'), 0.9), bevel=0.004, parent=g)
    cm = mat('cover', (1, 1, 1), 0.38, coat=0.3, tex='cover.jpg')
    plane(name + '_cover', w, h, (0, -d / 2 - 0.001, 0), (0, 0, 0), cm, parent=g)
    box(name + '_spine', (0.012, d + 0.004, h + 0.004), (-w / 2, 0, 0), C('indigo'), parent=g)
    box(name + '_back', (w, 0.004, h), (0, d / 2, 0), C('indigo'), parent=g)
    return g

def open_book(name, left='page_workflow.png', right='page_screens.png', pw=0.82, ph=1.15, parent=None):
    """Open book facing -Y; spine at x=0."""
    g = empty(name, parent=parent)
    box(name + '_cov', (pw * 2 + 0.05, 0.02, ph + 0.04), (0, 0.03, 0), C('indigo'), bevel=0.005, parent=g)
    for side, tx in ((-1, left), (1, right)):
        s = empty(name + f'_s{side}', parent=g); s.rotation_euler = (0, 0, side * math.radians(4))
        box(name + f'_blk{side}', (pw, 0.04, ph), (side * pw / 2, 0, 0), mat('pageedge', srgb('fbf8f2'), 0.9), bevel=0.006, parent=s)
        plane(name + f'_pg{side}', pw * 0.995, ph * 0.995, (side * pw / 2, -0.021, 0), (0, 0, 0), mat('pg_' + tx, (1, 1, 1), 0.7, tex=tx), parent=s)
    return g

def pencil(name, color, length=0.5, parent=None):
    g = empty(name, parent=parent)
    cyl(name + '_b', 0.02, length, (0, 0, 0), C(color, 0.4), verts=6, parent=g)
    cyl(name + '_w', 0.02, 0.06, (0, 0, length / 2 + 0.03), mat('wood', srgb('f2c79a'), 0.6), r2=0.004, verts=6, parent=g)
    return g

def pencil_cup(name, m=None, parent=None, n=6):
    g = empty(name, parent=parent)
    cyl(name + '_cup', 0.15, 0.34, (0, 0, 0.17), m or C('lav', 0.5), r2=0.13, parent=g)
    cols = ['violet', 'pink', 'yellow', 'purple', 'indigo', 'pink']
    for i in range(n):
        a = i / n * 2 * math.pi
        p = pencil(f'{name}_p{i}', cols[i % 6], 0.5, parent=g)
        p.location = (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.4); p.rotation_euler = (math.sin(a) * 0.25, -math.cos(a) * 0.25, 0)
    return g

def cloud(name, s=1.0, loc=(0, 0, 0)):
    g = empty(name, loc); m = mat('cloud', (1, 1, 1), 0.85, sss=0.3, emit=(1, 0.97, 1), emit_str=0.25)
    for x, z, r in [(0, 0, 1), (0.9, -0.15, 0.75), (-0.9, -0.2, 0.7), (0.4, 0.45, 0.7), (-0.45, 0.35, 0.62), (1.6, -0.35, 0.5), (-1.6, -0.35, 0.45)]:
        sphere(name + 'b', r * s, (x * s, 0, z * s), m, parent=g, scale=(1, 0.8, 0.85))
    return g

# ------------------------------------------------------------------ keyframes
def f(sec):
    return 1 + round(sec * FPS)

def kf(obj, path, keys, interp='BEZIER', ease='AUTO'):
    """keys: list of (sec, value)."""
    for sec, v in keys:
        setattr(obj, path, v); obj.keyframe_insert(data_path=path, frame=f(sec))
    act = obj.animation_data.action
    for fc in act.fcurves:
        if fc.data_path == path:
            for kp in fc.keyframe_points: kp.interpolation = interp; kp.easing = ease

def vis(obj, keys):
    """keys: list of (sec, visible)."""
    objs = [obj] + list(obj.children_recursive)
    for o in objs:
        for sec, v in keys:
            o.hide_render = not v; o.keyframe_insert('hide_render', frame=f(sec))

def face_rot(obj_loc, cam_loc, roll=0.0):
    d = Vector(cam_loc) - Vector(obj_loc)
    q = d.to_track_quat('-Y', 'Z'); e = q.to_euler(); e.rotate_axis('Y', roll); return e

# ------------------------------------------------------------------ camera / world / render
def camera(lens=35, fstop=2.0, focus=None):
    cd = bpy.data.cameras.new('cam'); cd.lens = lens
    cam = link(bpy.data.objects.new('cam', cd)); bpy.context.scene.camera = cam
    cd.dof.use_dof = fstop > 0; cd.dof.aperture_fstop = max(fstop, 0.1)
    if focus is not None:
        if isinstance(focus, (int, float)): cd.dof.focus_distance = focus
        else: cd.dof.focus_object = focus
    return cam

def look(pos, tgt, roll=0.0):
    d = Vector(tgt) - Vector(pos)
    q = d.to_track_quat('-Z', 'Y'); e = q.to_euler(); e.rotate_axis('Z', roll); return e

def cam_keys(cam, keys, interp='BEZIER'):
    """keys: list of (sec, pos, target, roll). Keyframes location + rotation."""
    prev = None
    for sec, pos, tgt, rl in keys:
        cam.location = pos; e = look(pos, tgt, rl)
        if prev is not None: e.make_compatible(prev)
        cam.rotation_euler = e; prev = e.copy()
        cam.keyframe_insert('location', frame=f(sec)); cam.keyframe_insert('rotation_euler', frame=f(sec))
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = interp

def focus_keys(cam, keys):
    for sec, d in keys:
        cam.data.dof.focus_distance = d; cam.data.dof.keyframe_insert('focus_distance', frame=f(sec))

def world(color='e9dcfb', strength=0.35, gradient=None):
    w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes['Background']
    if gradient:
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
        nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
        ramp.color_ramp.elements[0].position = 0.45; ramp.color_ramp.elements[0].color = (*srgb(gradient[1]), 1)
        ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (*srgb(gradient[0]), 1)
        nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    else:
        bg.inputs['Color'].default_value = (*srgb(color), 1)
    bg.inputs['Strength'].default_value = strength
    return w

def sun(energy=4.5, rot=(-58, 8, 185), color=(1.0, 0.94, 0.88), angle=6):
    s = bpy.data.lights.new('sun', 'SUN'); s.energy = energy; s.color = color; s.angle = math.radians(angle)
    o = link(bpy.data.objects.new('sun', s)); o.rotation_euler = tuple(math.radians(a) for a in rot); return o

def area(energy=120, size=4, loc=(1.5, -2.5, 3.0), rot=(60, 0, 20), color=(0.92, 0.85, 1.0)):
    a = bpy.data.lights.new('area', 'AREA'); a.energy = energy; a.size = size; a.color = color
    o = link(bpy.data.objects.new('area', a)); o.location = loc; o.rotation_euler = tuple(math.radians(v) for v in rot); return o

def render_setup(samples=8, pct=75, out='out/x', glow=True, mblur=True, exposure=0.0):
    sc = bpy.context.scene; r = sc.render
    r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 1280, 720; r.resolution_percentage = pct
    sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.05
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 5; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 2; sc.cycles.transmission_bounces = 1
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
    r.use_motion_blur = mblur; r.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = exposure
    r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 94
    r.use_persistent_data = True
    if glow:
        sc.use_nodes = True; nt = sc.node_tree; nt.nodes.clear()
        rl = nt.nodes.new('CompositorNodeRLayers'); gl = nt.nodes.new('CompositorNodeGlare'); o = nt.nodes.new('CompositorNodeComposite')
        gl.glare_type = 'FOG_GLOW'; gl.quality = 'MEDIUM'; gl.threshold = 0.9; gl.mix = -0.55; gl.size = 8
        nt.links.new(rl.outputs['Image'], gl.inputs['Image']); nt.links.new(gl.outputs['Image'], o.inputs['Image'])
    os.makedirs(os.path.join(ROOT, out), exist_ok=True)
    r.filepath = os.path.join(ROOT, out, 'f')
