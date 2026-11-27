"""All 3D shots of the promo, AMMARCREAVA purple.

Run:  blender -b -P scripts/shots.py -- --shot A [--still SEC] [--samples 8] [--pct 75]
Each shot renders frames 1..N into out/shots/<shot>/.
"""
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import lib
from lib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d):
    return type(d)(argv[argv.index(n) + 1]) if n in argv else d
SHOT = arg('--shot', 'A'); STILL = arg('--still', -1.0); SAMPLES = arg('--samples', 8); PCT = arg('--pct', 75)

# ---------------------------------------------------------------- easing
def clamp(x, a=0, b=1): return min(b, max(a, x))
E = dict(lin=lambda t: t, o3=lambda t: 1 - (1 - t) ** 3, i3=lambda t: t ** 3,
         io3=lambda t: 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2,
         back=lambda t: 1 + 2.9 * (t - 1) ** 3 + 1.9 * (t - 1) ** 2, sin=lambda t: .5 - .5 * math.cos(math.pi * t))
def k(t, a, b, e='io3'): return E[e](clamp((t - a) / (b - a)))
def lerp(a, b, t): return a + (b - a) * t
def lv(A, B, t): return tuple(lerp(x, y, t) for x, y in zip(A, B))
def Tv(v): return T(*v)

def animate(dur, step, fn):
    """Call fn(t, frame) for sampled times; fn inserts keys itself."""
    n = f(dur)
    for fr in list(range(1, n + 1, step)) + [n]:
        fn((fr - 1) / FPS, fr)

def key_obj(o, fr, loc=None, rot=None, scale=None):
    if loc is not None: o.location = loc; o.keyframe_insert('location', frame=fr)
    if rot is not None: o.rotation_euler = rot; o.keyframe_insert('rotation_euler', frame=fr)
    if scale is not None:
        s = (scale,) * 3 if isinstance(scale, (int, float)) else scale
        o.scale = tuple(max(1e-4, v) for v in s); o.keyframe_insert('scale', frame=fr)

def linearize():
    for o in bpy.data.objects:
        ad = o.animation_data
        if ad and ad.action:
            for fc in ad.action.fcurves:
                if fc.data_path in ('location', 'rotation_euler', 'scale'):
                    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'

def cam_fn(cam, dur, fn, step=2, focus=None):
    prev = [None]
    def g(t, fr):
        pos, tgt, rl = fn(t); e = look(pos, tgt, rl)
        if prev[0] is not None: e.make_compatible(prev[0])
        prev[0] = e.copy(); key_obj(cam, fr, loc=pos, rot=e)
        if focus:
            cam.data.dof.focus_distance = focus(t, Vector(pos)); cam.data.dof.keyframe_insert('focus_distance', frame=fr)
    animate(dur, step, g)

def sun_from(direction_point, energy=4.0, color=(1.0, 0.95, 0.9), angle=8):
    s = sun(energy, (0, 0, 0), color, angle)
    s.rotation_euler = (Vector((0, 0, 0)) - Vector(direction_point)).to_track_quat('-Z', 'Y').to_euler(); return s

def floor(color, size=60, bump=0.12, z=0.0, tex=None):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z)); o = bpy.context.active_object
    o.data.materials.append(mat('floor_' + color, srgb(color), 0.85, bump=bump, tex=tex)); return o

def speckle_png():
    def dr(d, W, H, im):
        import random; random.seed(3); d.rectangle((0, 0, W, H), fill=(233, 222, 248))
        for _ in range(5000):
            x, y = random.random() * W, random.random() * H
            d.rectangle((x, y, x + 2, y + 2), fill=(196, 176, 230) if random.random() < .6 else (255, 255, 255))
    return label_png('speckle', 1024, 1024, dr)

# ======================================================================
def build_room(show_easel=True, show_items=True):
    lav = mat('wall', srgb('ece2fa'), 0.95, bump=0.15)
    floor('dccbf3', 40, 0.1)
    WY, WW, WH, WZ = 4.2, 5.2, 3.0, 2.4
    for (x, z, w, h) in [(0, WZ + WH / 2 + 2.5, 30, 5), (0, (WZ - WH / 2) / 2, 30, WZ - WH / 2), (-(WW / 2 + 7.5), WZ, 15, WH), (WW / 2 + 7.5, WZ, 15, WH)]:
        box('wall', (w, 0.3, h), (x, WY, z), lav)
    wm = C('white', 0.45)
    for x in (-WW / 2, 0, WW / 2): box('mullion', (0.1, 0.22, WH), (x, WY, WZ), wm, bevel=0.02)
    box('sill', (WW + 0.4, 0.5, 0.1), (0, WY - 0.15, WZ - WH / 2), wm, bevel=0.02)
    box('sidewall', (0.3, 20, 10), (-5.2, 0, 5), lav)
    plane('notes', 1.7, 1.7, (-5.04, 2.2, 3.0), (0, 0, -math.pi / 2), mat('notes', (1, 1, 1), 0.7, tex='notes.png'))
    plane('outside', 12, 7, (0, WY + 1.5, WZ), (0, 0, 0), mat('outside', (1, 1, 1), 1.0, emit=(1.0, 0.96, 0.95), emit_str=7.0))
    box('desktop', (3.4, 1.2, 0.08), (0, 2.6, 1.05), C('white', 0.4, coat=0.2), bevel=0.03)
    for sx in (-1, 1):
        for sy in (-1, 1): cyl('leg', 0.025, 1.05, (sx * 1.55, 2.6 + sy * 0.48, 0.525), wm, verts=12)
    items = {}
    if show_easel:
        easel = empty('easel', (0, 2.85, 1.78)); easel.rotation_euler = (math.radians(-10), 0, 0)
        box('board', (2.0, 0.06, 1.25), (0, 0.02, 0), C('cdb8f5'), bevel=0.02, parent=easel)
        ob = open_book('easelbook', pw=0.82, ph=1.15, parent=easel); ob.location = (0, -0.06, 0)
        items['easel'] = easel
    if show_items:
        cyl('pot', 0.16, 0.26, (-1.35, 2.75, 1.22), C('f1eafc', 0.5), r2=0.12)
        for i in range(6):
            lf = sphere('leaf', 0.07, (-1.35 + (i - 2.5) * 0.05, 2.75, 1.55), mat('plant', srgb('9cc46a'), 0.5, sss=0.2), scale=(0.6, 0.6, 3.2))
            lf.rotation_euler = (0, (i - 2.5) * 0.3, 0)
        cyl('mug', 0.17, 0.36, (-0.95, 2.3, 1.27), C('8b62f5', 0.5), r2=0.16)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.1, minor_radius=0.03, location=(-0.77, 2.3, 1.29), rotation=(math.pi / 2, 0, 0))
        bpy.context.active_object.data.materials.append(C('8b62f5', 0.5)); bpy.ops.object.shade_smooth()
        pc = pencil_cup('pcup'); pc.location = (1.15, 2.55, 1.09)
        bk = book('flatbook', 0.55, 0.78, 0.09); bk.location = (-0.45, 2.25, 1.135); bk.rotation_euler = (-math.pi / 2, 0, 0.3)
        logo_disc('desklogo', (0.72, 2.45, 1.29), 0.17)
        cyl('logostand', 0.05, 0.03, (0.72, 2.45, 1.105), wm, verts=24)
    # chair
    ch = empty('chair', (0.7, 0.9, 0)); ch.rotation_euler = (0, 0, math.radians(-25))
    cm = C('8b62f5', 0.55)
    box('seat', (0.9, 0.85, 0.12), (1.9, 1.6, 0.95), cm, bevel=0.05, parent=ch)
    box('back', (0.95, 0.1, 1.05), (1.9, 2.0, 1.6), cm, bevel=0.04, parent=ch)
    plane('pegface', 0.9, 1.0, (1.9, 1.944, 1.6), (0, 0, 0), mat('peg', (1, 1, 1), 0.6, tex='pegboard.png'), parent=ch)
    for sx in (-1, 1):
        for sy in (-1, 1): cyl('cleg', 0.03, 0.95, (1.9 + sx * 0.36, 1.6 + sy * 0.33, 0.475), wm, verts=10, parent=ch)
    world('e9dcfb', 0.35)
    sun(4.5, (-58, 8, 185), (1.0, 0.95, 0.9))
    area(120, 4, (1.5, -2.5, 3.0), (60, 0, 20))
    return items

def logo_disc(name, loc, r, rot=(0, 0, 0), parent=None):
    g = empty(name, loc, parent); g.rotation_euler = rot
    cyl(name + '_back', r * 1.01, 0.02, (0, 0.012, 0), C('white', 0.4), verts=64, rot=(math.pi / 2, 0, 0), parent=g)
    plane(name + '_face', r * 2, r * 2, (0, -0.001, 0), (0, 0, 0), mat('logo', (1, 1, 1), 0.35, coat=0.6, tex='logo_round.png', alpha_tex=True), parent=g)
    return g

# ======================================================================
def shot_A():  # 0–3.05 overhead flatlay
    dur = 3.05
    floor('e9def8', 60, 0.1, tex=speckle_png())
    import random; random.seed(5)
    for i in range(7):
        box('paper', (1.1, 1.5, 0.01), (random.uniform(-3.5, 3.5), random.uniform(-2.5, 2.5), 0.006 + i * 0.002), C('fffdf9', 0.8), rot=(0, 0, random.uniform(0, 3)))
    for i in range(6):
        box('eraser', (0.22, 0.22, 0.22), (random.uniform(-3, 3), random.uniform(-2.2, 2.2), 0.11), C('pink' if i % 2 else 'violet', 0.5), bevel=0.04, rot=(0, 0, random.uniform(0, 3)))
    pc = pencil_cup('cup'); pc.location = Tv((-2.1, 0, -1.5)); pc.scale = (2.2,) * 3
    ob = open_book('ob', pw=1.15, ph=1.62); ob.location = Tv((0, 0.06, 0.15)); ob.rotation_euler = (-math.pi / 2, 0, 0.12)
    cb = book('cb', 1.05, 1.48, 0.14); cb.location = Tv((2.35, 0.08, -1.45)); cb.rotation_euler = (-math.pi / 2, 0, -0.35)
    pill = card('pill', 2.3, 0.78, glossy('white'), pill_png('pill_belajar', 'Belajar Prompt', 'Salin & tampal, tanpa koding'), depth=0.14)
    chipA = card('chipA', 1.5, 0.42, glossy('violet'), pill_png('chip_pemula', 'Untuk pemula', fg='white', icon_bg='white', w=1070), depth=0.1)
    chipB = card('chipB', 1.4, 0.4, glossy('pink'), pill_png('chip_cc', 'Claude Code', fg='white', icon_bg='white', w=1050), depth=0.1)
    cur = cursor('cur', 'pink', 0.7)
    cam = camera(40, 2.8)
    def camf(t):
        a = lerp(-0.5, 0.15, k(t, 0, 3.05, 'sin')); r = lerp(7.2, 4.4, k(t, 0, 3.0)); h = lerp(7.4, 3.6, k(t, 0, 3.0))
        tg = lv((0.4, 0, -0.2), (0.6, 0.9, 0.3), k(t, 1.2, 3.0))
        return Tv((tg[0] + math.sin(a) * r * 0.55, h, tg[2] + math.cos(a) * r * 0.6)), Tv(tg), lerp(-0.42, -0.12, k(t, 0, 3))
    cam_fn(cam, dur, camf, focus=lambda t, p: (p - pill.location).length)
    def objs(t, fr):
        pos, _, _ = camf(t)
        for o, t0, p0, p1, tilt in ((pill, 0.35, (0.3, 0.1, 0.2), (0.7, 1.15, 0.55), 0.08), (chipA, 0.55, (-0.6, 0.1, 0.3), (-1.25, 0.75, 0.9), -0.1), (chipB, 0.7, (1.8, 0.1, -1.2), (1.75, 0.8, -0.85), 0.12)):
            q = k(t, t0, t0 + 0.7, 'back'); loc = Tv(lv(p0, p1, q))
            press = math.sin(math.pi * clamp((t - 2.05) / 0.22)) if o is pill else 0
            key_obj(o, fr, loc=loc, rot=face_rot(loc, pos, tilt), scale=max(1e-3, q) * (1 - 0.06 * press))
        cp = k(t, 0.6, 2.0); loc = Tv(lv((2.2, 0.3, 1.4), (1.25, 1.05, 0.9), cp))
        press = math.sin(math.pi * clamp((t - 2.05) / 0.22))
        key_obj(cur, fr, loc=loc, rot=face_rot(loc, pos, 0.25), scale=1 - 0.15 * press)
    animate(dur, 2, objs)
    world('efe6fb', 0.4); sun_from(Tv((-3, 10, -4)), 3.5); area(80, 6, (0, -4, 6), (35, 0, 0))
    return dur

def shot_C():  # 3.05–5.5 room wide, cursor flies to camera
    dur = 2.45; build_room()
    cur = cursor('cur', 'pink', 0.5); cam = camera(40, 2.4)
    camf = lambda t: (Tv(lv((0.9, 1.45, 3.6), (0.4, 1.5, 2.6), k(t, 0, 2.45, 'o3'))), Tv((0, 1.35, -2.6)), lerp(0.12, 0.04, k(t, 0, 2.4)))
    cam_fn(cam, dur, camf, focus=lambda t, p: lerp(5.5, 1.6, k(t, 0.4, 2.3)))
    def objs(t, fr):
        cp = k(t, 0.4, 2.3); loc = Tv(lv((-0.2, 1.3, -2.2), (-0.05, 1.05, 1.55), cp))
        key_obj(cur, fr, loc=loc, rot=face_rot(loc, camf(t)[0], 0.35), scale=lerp(1.0, 2.0, cp))
    animate(dur, 2, objs)
    return dur

def shot_E():  # 8.0–9.6 fast pull back
    dur = 1.6; build_room()
    mini = card('mini', 0.9, 0.3, glossy('violet'), pill_png('mini_mula', 'Mula', fg='white', icon_bg='white'), depth=0.08)
    pen = pencil('flypen', 'pink', 1.2); cam = camera(36, 4.0, focus=4.5)
    def camf(t):
        p = k(t, 0, 1.6)
        return Tv(lv((-0.6, 1.6, -1.2), (2.6, 2.3, 1.6), p)), Tv(lv((0, 1.6, -2.7), (-0.4, 1.3, -2.6), p)), lerp(0.05, -0.25, p)
    cam_fn(cam, dur, camf)
    def objs(t, fr):
        loc = Tv((-0.75, 2.05 + math.sin(t * 2) * 0.05, -2.4)); key_obj(mini, fr, loc=loc, rot=face_rot(loc, camf(t)[0], 0.05))
        fp = k(t, 0.1, 1.2, 'lin'); key_obj(pen, fr, loc=Tv(lv((1.6, 1.3, -1.0), (-1.4, 2.4, -2.4), fp)), rot=(0.3, 1.0 + fp * 2, 0.4))
    animate(dur, 2, objs)
    return dur

def shot_F():  # 9.6–12.6 cup tumble then highlighter
    dur = 3.0
    floor('ede4fb', 60, 0.08)
    box('wall', (40, 0.2, 20), (0, 6, 5), C('d9c8f6', 0.9))
    pm = mat('prompt', (1, 1, 1), 0.8, tex='page_prompt.png')
    paper = empty('paper', Tv((0.3, 0.01, 0))); paper.rotation_euler = (0, 0, -0.18)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); pg = bpy.context.active_object; pg.scale = (4.2, 2.36, 1); pg.data.materials.append(pm); pg.parent = paper
    pg.location.z = 0.006
    hl = mat('hl', srgb('ffd23f'), 0.6); hl.blend_method = 'BLEND' if hasattr(hl, 'blend_method') else None
    nt = hl.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Alpha'].default_value = 0.55
    bars = []
    for i, (yc, wpx) in enumerate(((0.258, 1150), (0.012, 1180), (-0.234, 1260))):
        x0 = -1.86; w = wpx / 2048 * 4.2 + 0.05
        root = empty(f'bar{i}', (x0, yc, 0.009), paper)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0.5, 0, 0)); bar = bpy.context.active_object; bar.scale = (1, 0.17, 1); bar.data.materials.append(hl); bar.parent = root
        root.scale = (1e-4, 1, 1); bars.append((root, w))
    kb = box('kb', (3.4, 1.5, 0.12), Tv((-1.6, 0.06, 2.2)), C('211a28', 0.5), bevel=0.04, rot=(0, 0, -0.5))
    plane('kbface', 3.3, 1.4, (0, 0, 0.062), (math.pi / 2, 0, 0), mat('kbt', (1, 1, 1), 0.5, tex='keyboard.png'), parent=kb)
    # marker
    mk = empty('marker')
    sphere('mk_body', 0.16, (0, 0, 0.3), glossy('ffbf2e'), parent=mk, scale=(1, 1, 6.0))
    cyl('mk_band', 0.165, 0.2, (0, 0, -0.32), C('2a1f4a'), parent=mk)
    cyl('mk_tipbase', 0.12, 0.18, (0, 0, -0.5), glossy('ffbf2e'), r2=0.16, parent=mk)
    box('mk_tip', (0.14, 0.06, 0.18), (0, 0, -0.66), C('ffd84a', emit=srgb('ffc400'), emit_str=0.3), parent=mk)
    cup = pencil_cup('cup', m=mat('meshcup', srgb('5a4a6a'), 0.35, metal=0.6)); cup.scale = (2.3,) * 3
    cam = camera(38, 2.2)
    def camf(t):
        if t < 1.0: return Tv((0.2, 2.3, 4.2)), Tv((0, 1.5, 0.8)), 0.15
        m = t - 1.0; hp = k(m, 0.25, 1.75); wx = marker_world(hp)
        return Tv(lv((1.9, 1.5, 2.6), (1.2, 1.25, 2.1), k(m, 0, 2, 'o3'))), (wx.x * 0.5 + 0.1, wx.y * 0.5, 0.0), lerp(0.3, 0.2, k(m, 0, 2))
    def marker_world(hp):
        line = min(2, int(hp * 3)); lp = clamp(hp * 3 - line); yc, w = [(0.258, 1150), (0.012, 1180), (-0.234, 1260)][line]
        local = Vector((lerp(-1.86, -1.86 + w / 2048 * 4.2, lp), yc, 0.02))
        return paper.rotation_euler.to_matrix() @ local + Vector(paper.location)
    def focus(t, p):
        if t < 1.0: return (p - Vector(cup.location)).length
        return (p - marker_world(k(t - 1.0, 0.25, 1.75))).length
    cam_fn(cam, dur, camf, focus=focus)
    def objs(t, fr):
        if t < 1.0:
            p = k(t, 0, 1.0, 'lin')
            key_obj(cup, fr, loc=Tv((lerp(-1.2, 0.8, p), 1.6 + math.sin(p * 3) * 0.1, 1.0)), rot=(0.6 + p * 0.8, -0.9 + p * 0.5, 0.4))
            key_obj(mk, fr, loc=(0, 0, -5))
        else:
            m = t - 1.0; hp = k(m, 0.25, 1.75)
            key_obj(cup, fr, loc=Tv((-1.9, 0, -1.4)), rot=(0, 0, 0))
            w = marker_world(hp); key_obj(mk, fr, loc=(w.x + 0.35, w.y - 0.15, w.z + 0.75), rot=(-0.25, -0.32, 0.3))
            for i, (root, wd) in enumerate(bars):
                key_obj(root, fr, scale=(max(1e-4, clamp(hp * 3 - i) * wd), 1, 1))
    animate(dur, 2, objs)
    world('efe6fb', 0.4); sun_from(Tv((-4, 8, 3)), 3.5); area(60, 5, (2, -4, 4), (50, 0, 20))
    return dur

def shot_G():  # 12.6–15.0 overhead spread + sticky + ribbon dive
    dur = 2.4
    floor('e9def8', 60, 0.1, tex=speckle_png())
    import random; random.seed(9)
    for i in range(6):
        box('paper', (1.1, 1.5, 0.01), (random.uniform(-3.5, 3.5), random.uniform(-2.5, 2.5), 0.006 + i * 0.002), C('fffdf9', 0.8), rot=(0, 0, random.uniform(0, 3)))
    for i in range(5):
        box('eraser', (0.2, 0.2, 0.2), (random.uniform(-2.8, 2.8), random.uniform(-2, 2), 0.1), C('pink' if i % 2 else 'yellow', 0.5), bevel=0.04, rot=(0, 0, random.uniform(0, 3)))
    ob = open_book('ob', 'page_storyboard.png', 'cover.jpg', 1.2, 1.7); ob.location = (0, 0, 0.06); ob.rotation_euler = (-math.pi / 2, 0, 0)
    st = sticky('st', '27 muka, step by step', 'fff07a', 1.0, 0.85, fg=(110, 70, 30)); st.location = Tv((1.85, 0.08, 0.35)); st.rotation_euler = (-math.pi / 2, 0, 0.1)
    p1 = pencil('p1', 'violet', 1.3); p1.location = Tv((-1.6, 0.05, 1.3)); p1.rotation_euler = (math.pi / 2, 0, 1.2)
    p2 = pencil('p2', 'yellow', 1.0); p2.location = Tv((1.7, 0.05, -1.3)); p2.rotation_euler = (math.pi / 2, 0, -0.5)
    pc = pencil_cup('cup'); pc.location = Tv((-2.0, 0, -1.4)); pc.scale = (2.0,) * 3
    cu = cursor('cur', 'pink', 0.35); cu.location = Tv((1.4, 0.15, -0.75)); cu.rotation_euler = (-math.pi / 2, 0, 0.4)
    # ribbon
    crv = bpy.data.curves.new('rib', 'CURVE'); crv.dimensions = '3D'; sp = crv.splines.new('BEZIER')
    pts = [Tv(p) for p in ((-4, 0.5, 1.6), (-1.5, 0.6, 0.8), (0.5, 0.7, 0.2), (2.5, 0.9, -0.6), (5, 1.2, -1.8))]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts): bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    crv.bevel_depth = 0.07; crv.bevel_resolution = 4
    rib = link(bpy.data.objects.new('rib', crv)); rib.data.materials.append(glossy('violet'))
    for t0, v in ((0, 0.0), (0.9, 0.0), (1.9, 1.0)):
        crv.bevel_factor_end = v; crv.keyframe_insert('bevel_factor_end', frame=f(t0))
    cam = camera(40, 3.2)
    def camf(t):
        dv = k(t, 1.55, 2.4, 'i3')
        p = Tv(lv((0.3, 4.9, 1.1), (0.9, 2.0, 0.2), dv)); p = (p[0] + math.sin(t * 0.8) * 0.15, p[1], p[2])
        return p, Tv(lv((0.1, 0, 0), (0.9, 0, -0.1), dv)), lerp(0.04, 0.3, k(t, 0, 2.4))
    cam_fn(cam, dur, camf, focus=lambda t, p: p.z - 0.05)
    world('efe6fb', 0.4); sun_from(Tv((-3, 10, -4)), 3.5); area(80, 6, (0, -4, 6), (35, 0, 0))
    return dur

def shot_H():  # 15.0–16.6 flying notes + spheres, then white ring
    dur = 1.6
    w = world('f6f0fd', 1.9)
    bg = w.node_tree.nodes['Background'].inputs['Color']
    for t0, col in ((0, 'f6f0fd'), (1.03, 'f6f0fd'), (1.05, 'ffffff')):
        bg.default_value = (*srgb(col), 1); bg.keyframe_insert('default_value', frame=f(t0))
    import random; random.seed(21)
    texts = ['Cari fakta', 'Tulis skrip', 'Suara narasi', 'Sari kata', 'Peta & arkib', 'Muzik & SFX', 'Render MP4', 'Semak fakta']
    cols = ['ffd23f', 'f55fbc', 'ac5ce4', 'fff07a', '7c57f9']
    notes = []
    for i in range(24):
        bgc = cols[i % 5]; fg = (255, 255, 255) if bgc in ('f55fbc', 'ac5ce4', '7c57f9') else (90, 50, 20)
        n = sticky(f'n{i}', texts[i % 8], bgc, 0.9, 0.7, fg=fg)
        n['p'] = (random.uniform(-4.5, 4.5), random.uniform(-2.5, 2.5), -2 - random.uniform(0, 9))
        n['r'] = (random.uniform(0, 6), random.uniform(0, 6), random.uniform(0, 6)); n['v'] = 0.6 + random.random(); notes.append(n)
    balls = []
    for i in range(5):
        b = sphere(f'ball{i}', 0.55 + random.random() * 0.35, (0, 0, 0), C('violet' if i % 2 else 'pink', 0.18, coat=1.0)); b['p'] = ((i - 2) * 0.75, random.uniform(-0.2, 0.2), -5 - random.random() * 0.8); balls.append(b)
    ring = empty('ringg'); bpy.ops.mesh.primitive_torus_add(major_radius=1.4, minor_radius=0.03, location=(0, 0, 0))
    tr = bpy.context.active_object; tr.data.materials.append(C('violet')); tr.parent = ring
    ob = open_book('mini', pw=0.5, ph=0.7)
    cam = camera(32, 3.0, focus=4.0)
    camf = lambda t: (Tv((lerp(-0.6, 0.6, k(t, 0, 1.6)), 0, lerp(2.5, 0.5, k(t, 0, 1.6, 'lin')))), Tv((0, 0, -6)), lerp(-0.2, 0.15, k(t, 0, 1.6)))
    cam_fn(cam, dur, camf)
    def objs(t, fr):
        white = t >= 1.05
        for i, n in enumerate(notes):
            p = n['p']; v = n['v']; r = n['r']
            loc = Tv((p[0] + math.sin(t * v + i) * 0.4, p[1] + math.cos(t * v + i) * 0.3, p[2] + t * 3.5 * v)) if not white else (0, 0, -50)
            key_obj(n, fr, loc=loc, rot=(r[0] + t * 1.5, r[1] + t, r[2]))
        bq = k(t, 0.2, 0.7, 'back')
        for i, b in enumerate(balls):
            p = b['p']; loc = Tv((p[0], p[1] + math.sin(t * 4 + i) * 0.12, p[2])) if not white else (0, 0, -50)
            key_obj(b, fr, loc=loc, scale=max(1e-3, bq))
        if white:
            wt = t - 1.05
            key_obj(ob, fr, loc=Tv((-0.2, 0, -3)), rot=(0.4 + math.pi / 2, 0.2, -0.6 + wt * 1.2), scale=1)
            key_obj(ring, fr, loc=Tv((0.5, 0, -3.2)), rot=(math.pi / 2, wt * 2, 0), scale=1)
        else:
            key_obj(ob, fr, loc=(0, 0, -50), scale=1e-3); key_obj(ring, fr, loc=(0, 0, -50), scale=1e-3)
    animate(dur, 1, objs)
    sun_from((3, -6, 8), 3.0); area(100, 6, (0, -3, 4), (40, 0, 0))
    return dur

def shot_I():  # 16.6–20.1 sky, name, book flip (panel overlay added later)
    dur = 3.5
    world('efe4fd', 1.2)
    def grad(d, W, H, im):
        for y in range(H):
            t = y / H; c = tuple(int(a + (b - a) * min(1, t * 1.15)) for a, b in zip((112, 80, 245), (236, 205, 248)))
            d.line((0, y, W, y), fill=c)
    gp = label_png('skygrad', 64, 512, grad)
    plane('skybg', 60, 34, (0, 22, 2), (0, 0, 0), mat('skybg', (1, 1, 1), 1.0, tex=gp, emit=(1, 1, 1), emit_str=1.0))
    sb = bpy.data.materials['skybg'].node_tree; sbi = [n for n in sb.nodes if n.type == 'TEX_IMAGE'][0]; sb.links.new(sbi.outputs['Color'], sb.nodes['Principled BSDF'].inputs['Emission Color']); sbi.extension = 'EXTEND'
    clouds = []
    for i, (x, y, z, s) in enumerate([(-6, -1.6, -4, 1.4), (5.5, -1.2, -3, 1.3), (-2.5, 2.6, -9, 1.6), (4, 2.2, -10, 1.8), (0, -3.4, -2, 1.5), (-7, 1.5, -12, 2), (8, -0.5, -12, 2), (2, -2.2, -6, 1.1), (-4, 0.2, -7, 0.9)]):
        c = cloud(f'cl{i}', s, Tv((x, y, z))); c['p'] = Tv((x, y, z)); clouds.append(c)
    nm = text3d('name', 'AMMARCREAVA', 1.0, 0.08, mat('nametxt', (1, 1, 1), 0.5, emit=(1, 1, 1), emit_str=0.6), loc=Tv((0, 0.4, -3)))
    ld = logo_disc('skylogo', Tv((0, 1.35, -3.05)), 0.35)
    sub = card('sub', 4.4, 0.4, mat('subbg', (1, 1, 1), 1.0), label_png('subtxt', 1760, 160, lambda d, W, H, im: d.text((W / 2, H / 2), 'Perunding AI & video · 27 muka · 14 prompt', font=font(78), fill=(255, 255, 255), anchor='mm')), depth=0.001)
    sub.location = Tv((0, -0.5, -2.9)); [setattr(c, 'hide_render', True) for c in sub.children if c.name.endswith('_body')]
    # book halves
    bk = empty('bk'); L = empty('bkL', parent=bk); R = empty('bkR', parent=bk)
    box('bkLp', (0.8, 0.04, 1.13), (-0.4, 0, 0), mat('pageedge', srgb('fbf8f2'), 0.9), bevel=0.004, parent=L)
    plane('bkLf', 0.8, 1.13, (-0.4, -0.021, 0), (0, 0, 0), mat('pg_page_workflow.png', (1, 1, 1), 0.7, tex='page_workflow.png'), parent=L)
    plane('bkLb', 0.8, 1.13, (-0.4, 0.021, 0), (0, 0, math.pi), mat('cover', (1, 1, 1), 0.38, coat=0.3, tex='cover.jpg'), parent=L)
    box('bkRp', (0.8, 0.04, 1.13), (0.4, 0, 0), mat('pageedge', srgb('fbf8f2'), 0.9), bevel=0.004, parent=R)
    plane('bkRf', 0.8, 1.13, (0.4, -0.021, 0), (0, 0, 0), mat('pg_page_screens.png', (1, 1, 1), 0.7, tex='page_screens.png'), parent=R)
    cam = camera(42, 0, focus=6)
    camf = lambda t: (Tv((lerp(-0.3, 0.3, k(t, 0, 3.5)), lerp(0.2, 0.6, k(t, 1.4, 2.2)), lerp(5.2, 4.6, k(t, 0, 3.5)))), Tv((0, lerp(0.2, 1.0, k(t, 1.4, 2.2)), -3)), 0)
    cam_fn(cam, dur, camf)
    def objs(t, fr):
        for i, c in enumerate(clouds):
            p = c['p']; key_obj(c, fr, loc=(p[0] + math.sin(t * 0.3 + i) * 0.3 + t * 0.12 * (1 if i % 2 else -1), p[1], p[2]))
        on = k(t, 0.1, 0.5) * (1 - k(t, 1.3, 1.7)); sc_ = max(1e-3, on) * lerp(0.92, 1.02, k(t, 0, 1.7))
        key_obj(nm, fr, scale=sc_); key_obj(ld, fr, scale=sc_)
        key_obj(sub, fr, scale=max(1e-3, k(t, 0.45, 0.8) * (1 - k(t, 1.3, 1.6))))
        fall = k(t, 0, 0.8, 'back')
        key_obj(bk, fr, loc=Tv((lerp(-0.4, 0.05, fall), lerp(3.5, 0.45, fall) + lerp(0, 1.1, k(t, 1.4, 2.4)), -1.2)),
                rot=(lerp(0.4, 0.15, fall), lerp(-0.4, 0.05, fall), -(lerp(1.2, -0.35, k(t, 0, 2.6)) + math.sin(t) * 0.1)))
        op = k(t, 0.75, 1.6)
        key_obj(L, fr, rot=(0, 0, lerp(math.pi - 0.02, 0.25, op))); key_obj(R, fr, rot=(0, 0, lerp(0, -0.25, op)))
    animate(dur, 2, objs)
    sun_from((3, -8, 6), 2.5); area(150, 8, (0, -4, 2), (80, 0, 0), (1, 0.95, 1))
    return dur

def shot_J():  # 20.1–21.6 ring + folder + cards
    dur = 1.5
    world('f8f4fe', 1.9)
    ring = empty('ring'); bpy.ops.mesh.primitive_torus_add(major_radius=3.2, minor_radius=0.42, major_segments=160, minor_segments=24, location=(0, 0, 0))
    to = bpy.context.active_object; to.data.materials.append(C('violet', 0.45)); to.parent = ring
    bpy.ops.mesh.primitive_torus_add(major_radius=3.0, minor_radius=0.02, major_segments=160, location=(0, 0, 0))
    t2 = bpy.context.active_object; t2.data.materials.append(C('pink')); t2.rotation_euler = (math.pi / 2, 0, 0); t2.location = Tv((-1.0, 0, -0.5))
    fold = empty('folder'); bm = C('ffc35a', 0.5)
    box('fb', (2.2, 0.06, 1.5), (0, 0, 0), C('f4a83a', 0.5), bevel=0.03, parent=fold)
    box('ft', (0.8, 0.06, 0.3), (-0.7, 0, 0.8), C('f4a83a', 0.5), bevel=0.03, parent=fold)
    paper = card('fpaper', 1.9, 1.3, C('white'), label_png('pdfpaper', 760, 520, lambda d, W, H, im: (d.rectangle((0, 0, W, H), fill='white'), d.text((60, 90), '.pdf', font=font(80), fill=RGB['ink'], anchor='lm'), [d.rounded_rectangle((60, 170 + i * 60, 60 + 500 - i * 60, 190 + i * 60), 8, fill=(232, 222, 248)) for i in range(4)])), depth=0.015, bevel=0.005, parent=fold)
    paper.location = (0, -0.06, 0.15)
    front = card('ffront', 2.25, 1.15, bm, label_png('folderlbl', 900, 460, lambda d, W, H, im: d.text((W / 2, H * 0.62), 'video-dokumentari', font=font(84), fill=(120, 60, 200), anchor='mm')), depth=0.06, bevel=0.03, parent=fold)
    front.location = (0, -0.12, -0.2)
    ghost = text3d('ghost', 'Skill', 1.5, 0.03, mat('ghost', (1, 1, 1), 0.6, emit=(1, 1, 1), emit_str=0.3), loc=Tv((0, 0, -2.5)))
    slab = box('slab', (2.0, 0.16, 1.2), (0, 0, 0), glossy('violet'), bevel=0.08)
    mk = lambda n, txt: card(n, 1.6, 0.95, C('f6f0fe'), label_png('c_' + n, 640, 380, lambda d, W, H, im: d.text((W * 0.36, H * 0.25), txt, font=font(54), fill=(170, 150, 210), anchor='lm')), depth=0.03, bevel=0.02)
    cA = mk('cA', '.pdf'); cB = mk('cB', 'SKILL.md')
    cam = camera(40, 0, focus=6.5)
    camf = lambda t: (Tv((lerp(-1.0, 0.4, k(t, 0, 1.5)), 0.2, lerp(7.5, 6.2, k(t, 0, 1.5)))), (0, 0, 0), 0)
    cam_fn(cam, dur, camf)
    def objs(t, fr):
        key_obj(ring, fr, loc=Tv((-1.2, 0, 0)), rot=(math.pi / 2, lerp(1.6, 3.4, k(t, 0, 1.5, 'o3')), 0), scale=lerp(1.6, 1.0, k(t, 0, 0.6, 'o3')))
        fo = t < 0.95; q = k(t, 0.05, 0.6, 'back')
        key_obj(fold, fr, loc=Tv((lerp(-3, 0.2, q), lerp(-1, 0, q), 0.5)) if fo else (0, 0, -50), rot=(0.25, -lerp(0.6, 0.12, q), -lerp(-1.2, -0.25, q)), scale=0.75)
        key_obj(paper, fr, loc=(0, -0.06, 0.15 + 0.45 * k(t, 0.45, 0.8, 'o3')))
        key_obj(ghost, fr, scale=max(1e-3, k(t, 0.2, 0.6)) if fo else 1e-3)
        c = k(t, 0.95, 1.5, 'o3'); on = not fo
        key_obj(slab, fr, loc=Tv((0.6, -0.7, 0.3)) if on else (0, 0, -50), rot=(0.9 + math.pi / 2, 0.5, -0.2))
        key_obj(cA, fr, loc=Tv((lerp(0.6, 0.1, c), lerp(-0.5, 0.9, c), lerp(0.4, 0.8, c))) if on else (0, 0, -50), rot=(0.5 + math.pi / 2 - 1.2, 0.35, -0.3))
        key_obj(cB, fr, loc=Tv((lerp(0.6, 0.5, c), lerp(-0.5, 0.2, c), lerp(0.4, 1.0, c))) if on else (0, 0, -50), rot=(0.6 + math.pi / 2 - 1.2, 0.4, -0.25))
    animate(dur, 1, objs)
    sun_from((2, -8, 6), 3.0); area(100, 6, (0, -5, 3), (70, 0, 0))
    return dur

def shot_M():  # 24.6–28.2 end card
    dur = 3.6; build_room(show_easel=False, show_items=False)
    grp = empty('end', Tv((0, 0, -2.2)))
    tm, vm, pm_ = glossy('3b2a7a'), glossy('violet'), glossy('pink')
    parts = [text3d('t1', 'Video', 0.4, 0.05, tm, parent=grp), text3d('t2', 'Dokumentari', 0.4, 0.05, vm, parent=grp),
             text3d('t3a', 'dengan', 0.3, 0.04, tm, parent=grp), text3d('t3b', 'Claude', 0.4, 0.05, pm_, parent=grp)]
    base = [T(-1.55, 2.42, 0), T(-1.0, 2.05, 0), T(-1.62, 1.68, 0), T(-0.62, 1.68, 0)]
    ld = logo_disc('endlogo', T(-1.55, 2.85, 0), 0.16, parent=grp)
    bk = book('endbook', 0.95, 1.34, 0.14); bk.parent = grp
    pill = card('endpill', 1.75, 0.38, glossy('violet'), pill_png('end_dapatkan', 'Dapatkan · RM19', fg='white', icon_bg='white', w=1380), depth=0.1, parent=grp)
    cu = cursor('endcur', 'pink', 0.22, parent=grp)
    pc = pencil_cup('endcup', parent=grp); pc.scale = (1.2,) * 3
    box('enddesk', (6, 1.4, 0.08), (0, 2.25, 1.05), C('white', 0.4, coat=0.2), bevel=0.03)
    import random; random.seed(4)
    cols = ['violet', 'pink', 'yellow', 'purple', 'indigo']
    conf = []
    for i in range(60):
        if i % 3 == 0: bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.05)
        elif i % 3 == 1: bpy.ops.mesh.primitive_cube_add(size=0.06)
        else: bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.05, depth=0.05)
        o = bpy.context.active_object; o.data.materials.append(C(cols[i % 5], 0.4)); o.parent = grp
        o['u'] = (random.random() * 6.28, 0.6 + random.random() * 1.4, 0.8 + random.random() * 1.6, random.random() * 8, random.random() * 0.3); conf.append(o)
    area(260, 3, Tv((-0.6, 2.4, 0.8)), (70, 0, -10), (1, 0.97, 1))
    bpy.data.materials['outside'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 3.5
    cam = camera(38, 2.4)
    camf = lambda t: (Tv(lv((-0.75, 1.55, 2.5), (-0.55, 1.6, 2.05), k(t, 0, 3.6, 'o3'))), Tv((-0.45, 1.85, -2.3)), -0.05)
    cam_fn(cam, dur, camf, focus=lambda t, p: (p - Vector(T(0, 1.6, -2.2))).length)
    def objs(t, fr):
        for i, (o, b) in enumerate(zip(parts, base)):
            q = k(t, 0.15 + i * 0.12, 0.65 + i * 0.12, 'back')
            key_obj(o, fr, loc=(b[0], b[1] - 0.1, b[2]), rot=(math.pi / 2, 0, -lerp(0.6, 0.18, q)), scale=max(1e-3, q))
        key_obj(ld, fr, loc=T(-2.25, 2.42, 0), rot=(0, 0, -0.18), scale=max(1e-3, k(t, 0.1, 0.6, 'back')))
        bq = k(t, 0.55, 1.15, 'back')
        key_obj(bk, fr, loc=T(0.95, lerp(3.2, 1.8, bq) + math.sin(t * 1.6) * 0.03 * k(t, 1.2, 1.6), -0.1), rot=(-0.05, -lerp(0.6, -0.12, bq), 0.5 - math.sin(t) * 0.05))
        pq = k(t, 1.15, 1.6, 'back'); press = math.sin(math.pi * clamp((t - 2.0) / 0.22))
        key_obj(pill, fr, loc=T(-0.95, 1.22, 0.15), rot=(0, 0, -0.18), scale=max(1e-3, pq) * (1 - 0.06 * press))
        cq = k(t, 1.4, 1.9, 'o3'); key_obj(cu, fr, loc=T(lerp(0.3, -0.4, cq), lerp(0.75, 1.08, cq), 0.3), rot=(0, 0.3, -0.18), scale=1 - 0.15 * press)
        key_obj(pc, fr, loc=T(-2.55, lerp(-1, 1.09, k(t, 0, 0.6, 'back')), -0.3))
        for o in conf:
            a, sp, up, rs, dl = o['u']; ct = clamp(t - 0.8 - dl)
            loc = T(0.95 + math.cos(a) * sp * ct * 1.2, 1.8 + up * ct - 1.2 * ct * ct, -0.1 + math.sin(a) * sp * ct * 0.8) if ct > 0 else (0, 0, -50)
            key_obj(o, fr, loc=loc, rot=(rs * ct, rs * ct * 0.7, 0))
    animate(dur, 2, objs)
    return dur

# ======================================================================
SHOTS = dict(A=shot_A, C=shot_C, E=shot_E, F=shot_F, G=shot_G, H=shot_H, I=shot_I, J=shot_J, M=shot_M)
sc = reset(10)
dur = SHOTS[SHOT]()
sc.frame_end = f(dur) - 1 if f(dur) > 1 else 1
linearize()
render_setup(SAMPLES, PCT, f'out/shots/{SHOT}')
if STILL >= 0:
    sc.frame_set(f(STILL)); sc.render.filepath = os.path.join(ROOT, 'out', 'stills', f'{SHOT}_{STILL:.2f}.jpg'); bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
