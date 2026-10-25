"""Overlay grafik jenama Spa Bekam Al Firdaus untuk video 'Salam Ahad, Jom Berbekam'.
Guna: python3 overlays.py <fonts_dir> <out_dir> <endcard_bg.png>"""
import sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

FD, OUT, BG = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
EMERALD = (22, 110, 84); DEEP = (12, 66, 50); CREAM = (250, 243, 226); GOLD = (214, 170, 84); BROWN = (92, 62, 38)

def F(name, size):
    p = {'pop8': 'pkg_fontsource-poppins/files/poppins-latin-800-normal.woff',
         'pop6': 'pkg_fontsource-poppins/files/poppins-latin-600-normal.woff',
         'pop5': 'pkg_fontsource-poppins/files/poppins-latin-500-normal.woff',
         'play8': 'pkg_fontsource-playfair-display/files/playfair-display-latin-800-normal.woff',
         'play7': 'pkg_fontsource-playfair-display/files/playfair-display-latin-700-normal.woff',
         'amiri': 'pkg_fontsource-amiri/files/amiri-arabic-700-normal.woff'}[name]
    return ImageFont.truetype(os.path.join(FD, p), size)

def runs_width(d, runs):
    return sum(d.textlength(t, font=f) for t, f, *_ in runs)

def draw_runs(d, x, y, runs, fill):
    """runs: [(text, font, dy)] - teks campur (cth Poppins + ﷺ Amiri) atas satu baseline."""
    for t, f, dy in runs:
        d.text((x, y + dy), t, font=f, fill=fill, anchor='ls')
        x += d.textlength(t, font=f)

def shadowed(img, blur=14, alpha=110, off=(0, 8)):
    a = img.split()[3]
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    sh.putalpha(a.point(lambda v: v * alpha // 255))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base = Image.new('RGBA', img.size, (0, 0, 0, 0))
    base.alpha_composite(sh, off)
    base.alpha_composite(img)
    return base

def logo(size):
    s = size * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((0, 0, s - 1, s - 1), fill=GOLD)
    m = s * 0.06; d.ellipse((m, m, s - m, s - m), fill=EMERALD)
    # bintang 8 bucu halus di belakang
    cx = cy = s / 2; r1, r2 = s * 0.40, s * 0.33
    pts = [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.pi * i / 8 - math.pi / 2),
            cy + (r1 if i % 2 == 0 else r2) * math.sin(math.pi * i / 8 - math.pi / 2)) for i in range(16)]
    d.polygon(pts, outline=GOLD + (120,), width=int(s * 0.012))
    # cawan bekam: kubah + tombol
    cw, ch = s * 0.36, s * 0.30; top = cy - ch * 0.35
    d.pieslice((cx - cw / 2, top, cx + cw / 2, top + ch * 1.4), 180, 360, fill=CREAM)
    d.rectangle((cx - cw / 2, top + ch * 0.7, cx + cw / 2, top + ch * 0.95), fill=CREAM)
    d.rounded_rectangle((cx - cw * 0.62, top + ch * 0.92, cx + cw * 0.62, top + ch * 1.08), radius=s * 0.02, fill=GOLD)
    d.rounded_rectangle((cx - s * 0.035, top - s * 0.08, cx + s * 0.035, top + s * 0.02), radius=s * 0.015, fill=GOLD)
    # titisan kecil
    d.ellipse((cx - s * 0.03, top + ch * 1.22, cx + s * 0.03, top + ch * 1.34), fill=(190, 60, 60))
    return im.resize((size, size), Image.LANCZOS)

def save(img, name):
    img.save(os.path.join(OUT, name))

# 1. Lencana jenama (atas, kekal sepanjang klip)
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
f1, f2 = F('pop8', 34), F('pop5', 24)
tw = max(d.textlength('SPA BEKAM AL FIRDAUS', font=f1), d.textlength('Muar, Johor', font=f2))
bx, by, bh = 54, 96, 112
d.rounded_rectangle((bx, by, bx + bh + tw + 46, by + bh), radius=bh // 2, fill=DEEP + (225,), outline=GOLD, width=3)
im.alpha_composite(logo(bh - 16), (bx + 8, by + 8))
d.text((bx + bh + 14, by + 52), 'SPA BEKAM AL FIRDAUS', font=f1, fill=CREAM, anchor='ls')
d.text((bx + bh + 14, by + 86), 'Muar, Johor', font=f2, fill=GOLD, anchor='ls')
# handle bawah
fh = F('pop6', 32); t = '@spabekamalfirdaus'; hw = d.textlength(t, font=fh)
d.rounded_rectangle(((W - hw) / 2 - 26, H - 170, (W + hw) / 2 + 26, H - 110), radius=30, fill=(0, 0, 0, 120))
d.text((W / 2, H - 128), t, font=fh, fill=CREAM, anchor='ms')
save(shadowed(im), 'brand.png')

def card(lines, y, name, accent=None):
    """Kad teks tengah: lines = [(runs, fill)]; accent = teks pil emas di atas kad."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    widths = [runs_width(d, r) for r, _ in lines]
    heights = [max(f.size for _, f, _ in r) * 1.18 for r, _ in lines]
    cw = max(widths) + 110; chh = sum(heights) + 92
    x0 = (W - cw) / 2
    d.rounded_rectangle((x0, y, x0 + cw, y + chh), radius=36, fill=EMERALD + (238,), outline=GOLD, width=4)
    d.line((x0 + 50, y + chh - 22, x0 + cw - 50, y + chh - 22), fill=GOLD + (140,), width=2)
    cy = y + 35
    for (runs, fill), w, h in zip(lines, widths, heights):
        draw_runs(d, (W - w) / 2, cy + h * 0.80, runs, fill); cy += h
    if accent:
        fa = F('pop8', 34); aw = d.textlength(accent, font=fa)
        d.rounded_rectangle(((W - aw) / 2 - 30, y - 34, (W + aw) / 2 + 30, y + 26), radius=30, fill=GOLD)
        d.text((W / 2, y + 8), accent, font=fa, fill=DEEP, anchor='ms')
    save(shadowed(im), name)

# 2. Hook: Salam Ahad, Jom Berbekam!
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
fs, fj = F('play8', 132), F('pop8', 104)
d.text((W / 2, 470), 'Salam Ahad', font=fs, fill=CREAM, anchor='ms', stroke_width=6, stroke_fill=DEEP)
jw = d.textlength('JOM BERBEKAM!', font=fj)
d.rounded_rectangle(((W - jw) / 2 - 40, 520, (W + jw) / 2 + 40, 660), radius=28, fill=GOLD)
d.text((W / 2, 628), 'JOM BERBEKAM!', font=fj, fill=DEEP, anchor='ms')
# hiasan bintang kecil
for sx in ((W - jw) / 2 - 10, (W + jw) / 2 + 10):
    pass
save(shadowed(im, blur=18, alpha=150), 'hook.png')

P = F('pop8', 58); P2 = F('pop6', 44); AM = F('amiri', 62)
card([([('Bekam Kepala', P, 0)], CREAM), ([('TANPA cukur rambut', P, 0)], GOLD)], 1380, 'usp.png', accent='KEISTIMEWAAN KAMI')
card([([('Bekam Sunnah', P, 0)], CREAM), ([('Ikhtiar ikut Sunnah Nabi ', P2, 0), ('ﷺ', AM, 4)], GOLD)], 1380, 'sunnah.png')
card([([('Bantu lancarkan', P, 0)], CREAM), ([('peredaran darah', P, 0)], CREAM), ([('& redakan lenguh badan', P2, 0)], GOLD)], 1300, 'manfaat.png')

# 3. Kad penutup (bingkai demi bingkai, nombor telefon berdenyut)
FPS, DUR = 30, 3.6
bg = Image.open(BG).convert('RGB').resize((W, H)).filter(ImageFilter.GaussianBlur(22))
bg = Image.blend(bg, Image.new('RGB', (W, H), DEEP), 0.72).convert('RGBA')
pat = Image.new('RGBA', (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(pat)
for gy in range(-60, H + 120, 180):
    for gx in range(-60 + (90 if (gy // 180) % 2 else 0), W + 120, 180):
        r1, r2 = 46, 36
        pts = [(gx + (r1 if i % 2 == 0 else r2) * math.cos(math.pi * i / 8), gy + (r1 if i % 2 == 0 else r2) * math.sin(math.pi * i / 8)) for i in range(16)]
        pd.polygon(pts, outline=GOLD + (34,), width=2)
bg.alpha_composite(pat)
base = bg.copy(); d = ImageDraw.Draw(base)
base.alpha_composite(logo(260), ((W - 260) // 2, 330))
d.text((W / 2, 720), 'Spa Bekam', font=F('play8', 112), fill=CREAM, anchor='ms')
d.text((W / 2, 850), 'Al Firdaus', font=F('play8', 112), fill=GOLD, anchor='ms')
d.line((W / 2 - 200, 900, W / 2 + 200, 900), fill=GOLD, width=3)
d.text((W / 2, 965), 'Muar, Johor', font=F('pop5', 44), fill=CREAM, anchor='ms')
d.text((W / 2, 1130), 'Jom berbekam hari ini!', font=F('pop8', 64), fill=CREAM, anchor='ms')
d.text((W / 2, 1520), 'Bekam kepala tanpa cukur rambut  •  Bekam Sunnah', font=F('pop5', 32), fill=GOLD, anchor='ms')
d.text((W / 2, 1700), '@spabekamalfirdaus', font=F('pop6', 40), fill=CREAM, anchor='ms')
pill = Image.new('RGBA', (900, 210), (0, 0, 0, 0)); pdd = ImageDraw.Draw(pill)
pdd.rounded_rectangle((10, 10, 890, 200), radius=95, fill=GOLD)
pdd.text((450, 82), 'HUBUNGI / WHATSAPP', font=F('pop6', 36), fill=DEEP, anchor='ms')
pdd.text((450, 165), '013-691 2423', font=F('pop8', 80), fill=DEEP, anchor='ms')
pill = shadowed(pill.resize((900, 210)), blur=12, alpha=140)
os.makedirs(os.path.join(OUT, 'end'), exist_ok=True)
def eob(t):
    c1 = 1.70158; c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
for i in range(int(FPS * DUR)):
    t = i / FPS
    fr = base.copy()
    k = min(1, t / 0.5); s = 0.6 + 0.4 * eob(k) if k < 1 else 1 + 0.04 * math.sin((t - 0.5) * 2 * math.pi * 1.4)
    pw, ph = int(900 * s), int(210 * s)
    p = pill.resize((pw, ph), Image.LANCZOS)
    fr.alpha_composite(p, ((W - pw) // 2, 1300 - ph // 2))
    fr.convert('RGB').save(os.path.join(OUT, 'end', f'{i:04d}.png'))
print('ok')
