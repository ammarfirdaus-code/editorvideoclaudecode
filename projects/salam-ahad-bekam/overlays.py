"""Overlay grafik jenama AL-FIRDAUS Spa Bekam untuk video 'Salam Ahad, Jom Berbekam'.
Ikut DESIGN-SpaBekamAlFirdaus_v2 (lulus Ammar 2026-10-01): palet biru, Poppins + Inter, logo rasmi.
Guna: python3 overlays.py <fonts_dir> <out_dir> <endcard_bg.png> <logo.png>"""
import sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FD, OUT, BG, LOGO = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
AQUA = (0x34, 0xC6, 0xE3); SEA = (0x0E, 0xA5, 0xCF); DEEP = (0x0A, 0x6E, 0xB7)
NAVY = (0x06, 0x3D, 0x66); PALE = (0xE6, 0xF6, 0xFD); WHITE = (255, 255, 255); GREEN = (0x10, 0xB9, 0x81)

FONTS = {'pop8': 'pkg_fontsource-poppins/files/poppins-latin-800-normal.woff',
         'pop6': 'pkg_fontsource-poppins/files/poppins-latin-600-normal.woff',
         'inter4': 'pkg_fontsource-inter/files/inter-latin-400-normal.woff',
         'inter5': 'pkg_fontsource-inter/files/inter-latin-500-normal.woff',
         'amiri': 'pkg_fontsource-amiri/files/amiri-arabic-700-normal.woff'}

def F(name, size):
    return ImageFont.truetype(os.path.join(FD, FONTS[name]), size)

LOGO_IM = Image.open(LOGO).convert('RGBA')

def logo(size):
    return LOGO_IM.resize((size, size), Image.LANCZOS)

def gradient(w, h, c1=AQUA, c2=DEEP, horizontal=True):
    """Gradien utama jenama #34C6E3 -> #0A6EB7."""
    g = Image.new('RGBA', (w, h)); px = g.load()
    for i in range(w if horizontal else h):
        t = i / max(1, (w if horizontal else h) - 1)
        c = tuple(int(a + (b - a) * t) for a, b in zip(c1, c2)) + (255,)
        if horizontal:
            for y in range(h): px[i, y] = c
        else:
            for x in range(w): px[x, i] = c
    return g

def rounded(img_w, img_h, r, fill_img):
    m = Image.new('L', (img_w, img_h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img_w - 1, img_h - 1), radius=r, fill=255)
    out = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    out.paste(fill_img, (0, 0), m)
    return out

def grad_pill(w, h, r=None):
    return rounded(w, h, r if r is not None else h // 2, gradient(w, h))

def runs_width(d, runs):
    return sum(d.textlength(t, font=f) for t, f, _ in runs)

def draw_runs(d, x, y, runs, fill):
    """Teks campur (cth Poppins + ﷺ Amiri) atas satu baseline."""
    for t, f, dy in runs:
        d.text((x, y + dy), t, font=f, fill=fill, anchor='ls')
        x += d.textlength(t, font=f)

def shadowed(img, blur=14, alpha=90, off=(0, 8)):
    sh = Image.new('RGBA', img.size, NAVY + (0,))
    sh.putalpha(img.split()[3].point(lambda v: v * alpha // 255))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base = Image.new('RGBA', img.size, (0, 0, 0, 0))
    base.alpha_composite(sh, off)
    base.alpha_composite(img)
    return base

def save(img, name):
    img.save(os.path.join(OUT, name))

# 1. Lencana jenama (atas) + handle (bawah), kekal sepanjang klip
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
f1, f2 = F('pop8', 34), F('inter5', 24)
tw = max(d.textlength('AL-FIRDAUS', font=f1), d.textlength('Spa Bekam • Muar, Johor', font=f2))
bx, by, bh = 54, 96, 112
d.rounded_rectangle((bx, by, bx + bh + tw + 46, by + bh), radius=bh // 2, fill=WHITE + (235,))
im.alpha_composite(logo(bh - 12), (bx + 6, by + 6))
d.text((bx + bh + 12, by + 52), 'AL-FIRDAUS', font=f1, fill=NAVY, anchor='ls')
d.text((bx + bh + 12, by + 86), 'Spa Bekam • Muar, Johor', font=f2, fill=DEEP, anchor='ls')
fh = F('pop6', 32); t = '@spabekamalfirdaus'; hw = int(d.textlength(t, font=fh))
im.alpha_composite(grad_pill(hw + 56, 60), ((W - hw - 56) // 2, H - 172))
d.text((W / 2, H - 130), t, font=fh, fill=WHITE, anchor='ms')
save(shadowed(im), 'brand.png')

# 2. Hook: Salam Ahad, Jom Berbekam!
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
fs, fj = F('pop8', 120), F('pop8', 96)
d.text((W / 2, 470), 'Salam Ahad', font=fs, fill=WHITE, anchor='ms', stroke_width=7, stroke_fill=NAVY)
jw = int(d.textlength('JOM BERBEKAM!', font=fj))
im.alpha_composite(grad_pill(jw + 90, 140, 36), ((W - jw - 90) // 2, 515))
d.text((W / 2, 620), 'JOM BERBEKAM!', font=fj, fill=WHITE, anchor='ms')
save(shadowed(im, blur=18, alpha=140), 'hook.png')

def card(lines, y, name, accent=None):
    """Kad putih bersih: lines = [(runs, fill)]; accent = pil gradien biru di atas kad."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    widths = [runs_width(d, r) for r, _ in lines]
    heights = [max(f.size for _, f, _ in r) * 1.2 for r, _ in lines]
    cw = int(max(widths) + 110); ch = int(sum(heights) + 84)
    x0 = (W - cw) // 2
    d.rounded_rectangle((x0, y, x0 + cw, y + ch), radius=36, fill=WHITE + (242,))
    im.alpha_composite(rounded(cw, 12, 6, gradient(cw, 12)), (x0, y + ch - 12))
    cy = y + 38
    for (runs, fill), w, h in zip(lines, widths, heights):
        draw_runs(d, (W - w) / 2, cy + h * 0.80, runs, fill); cy += h
    if accent:
        fa = F('pop8', 32); aw = int(d.textlength(accent, font=fa))
        im.alpha_composite(grad_pill(aw + 60, 58), ((W - aw - 60) // 2, y - 30))
        d.text((W / 2, y + 10), accent, font=fa, fill=WHITE, anchor='ms')
    save(shadowed(im), name)

P = F('pop8', 58); P2 = F('pop6', 44); AM = F('amiri', 62)
card([([('Bekam Kepala', P, 0)], NAVY), ([('TANPA cukur rambut', P, 0)], SEA)], 1360, 'usp.png', accent='KEISTIMEWAAN KAMI')
card([([('Bekam Sunnah', P, 0)], NAVY), ([('Ikhtiar ikut Sunnah Nabi ', P2, 0), ('ﷺ', AM, 4)], DEEP)], 1360, 'sunnah.png')
card([([('Bantu lancarkan', P, 0)], NAVY), ([('peredaran darah', P, 0)], NAVY), ([('& rasa lebih segar', P2, 0)], SEA)], 1290, 'manfaat.png')

# 3. Kad penutup: latar biru pucat + riak air, butang CTA berdenyut
FPS, DUR = 30, 3.6
bg = Image.open(BG).convert('RGB').resize((W, H)).filter(ImageFilter.GaussianBlur(26))
bg = Image.blend(bg, Image.new('RGB', (W, H), PALE), 0.86).convert('RGBA')
rip = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rd = ImageDraw.Draw(rip)
for cx, cy, n in ((W * 0.15, 260, 5), (W * 0.9, 1650, 6), (W * 0.95, 420, 3)):
    for k in range(n):
        r = 60 + k * 70
        rd.ellipse((cx - r, cy - r * 0.55, cx + r, cy + r * 0.55), outline=AQUA + (70 - k * 10,), width=4)
bg.alpha_composite(rip)
top = gradient(W, 14); bg.alpha_composite(top, (0, 0)); bg.alpha_composite(top, (0, H - 14))
base = bg.copy(); d = ImageDraw.Draw(base)
base.alpha_composite(shadowed(logo(330), blur=16, alpha=80).resize((330, 330)), ((W - 330) // 2, 250))
d.text((W / 2, 690), 'AL-FIRDAUS', font=F('pop8', 104), fill=NAVY, anchor='ms')
d.text((W / 2, 770), 'SPA BEKAM', font=F('pop6', 52), fill=DEEP, anchor='ms')
d.text((W / 2, 850), 'Refresh. Heal. Revive.', font=F('inter5', 38), fill=SEA, anchor='ms')
d.text((W / 2, 1010), 'Jom berbekam hari ini!', font=F('pop8', 66), fill=NAVY, anchor='ms')
d.text((W / 2, 1480), 'Bekam kepala tanpa cukur rambut  •  Bekam Sunnah', font=F('inter5', 32), fill=DEEP, anchor='ms')
d.text((W / 2, 1600), 'Spa Bekam Al Firdaus • Muar, Johor', font=F('pop6', 40), fill=NAVY, anchor='ms')
d.text((W / 2, 1670), '@spabekamalfirdaus', font=F('inter5', 34), fill=SEA, anchor='ms')
pill = grad_pill(880, 200, 100); pd = ImageDraw.Draw(pill)
pd.text((440, 78), 'TEMPAH SEKARANG  •  WHATSAPP', font=F('pop6', 34), fill=WHITE, anchor='ms')
pd.text((440, 160), '013-691 2423', font=F('pop8', 80), fill=WHITE, anchor='ms')
pill = shadowed(pill, blur=14, alpha=110)
os.makedirs(os.path.join(OUT, 'end'), exist_ok=True)
def eob(t):
    c1 = 1.70158; c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
for i in range(int(FPS * DUR)):
    t = i / FPS
    fr = base.copy()
    k = min(1, t / 0.5); s = 0.6 + 0.4 * eob(k) if k < 1 else 1 + 0.04 * math.sin((t - 0.5) * 2 * math.pi * 1.4)
    pw, ph = int(pill.width * s), int(pill.height * s)
    fr.alpha_composite(pill.resize((pw, ph), Image.LANCZOS), ((W - pw) // 2, 1240 - ph // 2))
    fr.convert('RGB').save(os.path.join(OUT, 'end', f'{i:04d}.png'))
print('ok')
