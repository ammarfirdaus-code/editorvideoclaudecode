"""Builds page/label textures for the Blender scene with PIL."""
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'tex')
F9 = lambda s: ImageFont.truetype(os.path.join(D, 'Nunito-900.ttf'), s)
F8 = lambda s: ImageFont.truetype(os.path.join(D, 'Nunito-800.ttf'), s)
OR = (124, 87, 249)

def cover_fit(img, w, h):
    r = max(w / img.width, h / img.height)
    im = img.resize((int(img.width * r) + 1, int(img.height * r) + 1), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))

def header(d, num, title):
    d.rounded_rectangle((70, 70, 144, 144), 14, fill=OR)
    d.text((107, 107), num, font=F9(42), fill='white', anchor='mm')
    d.text((165, 107), title, font=F9(58), fill=(43, 29, 22), anchor='lm')

def workflow():
    im = Image.new('RGB', (1024, 1448), (255, 250, 244)); d = ImageDraw.Draw(im)
    header(d, '1', 'Workflow 5 fasa')
    items = ['Sediakan Claude Code', 'Brief & draf skrip', 'Kumpul bahan', 'Bina video', 'Semak & render']
    cols = [OR, (172, 92, 228), (245, 95, 188), (103, 90, 250), (255, 200, 60)]
    for i, t in enumerate(items):
        y = 240 + i * 120
        d.ellipse((74, y - 36, 146, y + 36), fill=cols[i])
        d.text((110, y), str(i + 1), font=F9(40), fill='white', anchor='mm')
        d.text((170, y), t, font=F8(46), fill=(58, 42, 34), anchor='lm')
    im.paste(cover_fit(Image.open(os.path.join(D, 'f1.jpg')), 884, 470), (70, 870))
    im.save(os.path.join(D, 'page_workflow.png'))

def screens():
    im = Image.new('RGB', (1024, 1448), (255, 250, 244)); d = ImageDraw.Draw(im)
    header(d, '2', 'Persediaan')
    im.paste(cover_fit(Image.open(os.path.join(D, 'ss1.jpg')), 884, 400), (70, 200))
    d.rounded_rectangle((80, 250, 310, 310), 12, outline=OR, width=8)
    d.ellipse((300, 250, 360, 310), fill=OR); d.text((330, 280), '1', font=F9(34), fill='white', anchor='mm')
    for i in range(6):
        d.rounded_rectangle((70, 680 + i * 52, 954 - (i % 3) * 140, 702 + i * 52), 8, fill=(232, 217, 204))
    im.paste(cover_fit(Image.open(os.path.join(D, 'f3.jpg')), 884, 360), (70, 1010))
    im.save(os.path.join(D, 'page_screens.png'))

def pegboard():
    im = Image.new('RGB', (512, 512), (140, 98, 245)); d = ImageDraw.Draw(im)
    for y in range(24, 512, 44):
        for x in range(24, 512, 44):
            d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(60, 35, 120))
    im.save(os.path.join(D, 'pegboard.png'))

def grid_notes():
    im = Image.new('RGB', (512, 512), (236, 226, 250)); d = ImageDraw.Draw(im)
    cols = [OR, (245, 95, 188), (255, 210, 63), (172, 92, 228), (103, 90, 250)]
    for r in range(4):
        for c in range(4):
            d.rectangle((20 + c * 124, 20 + r * 124, 124 + c * 124, 124 + r * 124), fill=cols[(r * 4 + c) % 5])
    im.save(os.path.join(D, 'notes.png'))


def storyboard():
    im = Image.new('RGB', (1024, 1448), OR); d = ImageDraw.Draw(im)
    d.rounded_rectangle((60, 60, 170, 170), 18, fill='white'); d.text((115, 115), '3', font=F9(64), fill=OR, anchor='mm')
    d.text((200, 115), 'Bina babak', font=F9(76), fill='white', anchor='lm')
    d.ellipse((112, 290, 912, 1150), fill=(245, 240, 255))
    for (x, y, n) in ((190, 470, 'f2.jpg'), (530, 470, 'f4.jpg'), (360, 690, 'f1.jpg')):
        im.paste(cover_fit(Image.open(os.path.join(D, n)), 300, 170), (x, y))
    d.text((512, 1000), 'Peta  ·  Arkib  ·  Muzik', font=F9(48), fill=OR, anchor='mm')
    d.text((512, 1300), 'Sari kata selaras dengan suara', font=F8(40), fill='white', anchor='mm')
    im.save(os.path.join(D, 'page_storyboard.png'))

def prompt_page():
    im = Image.new('RGB', (2048, 1152), (255, 253, 250)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((120, 90, 560, 160), 35, fill=OR); d.text((340, 125), 'LANGKAH 1 · BRIEF', font=F9(38), fill='white', anchor='mm')
    d.text((120, 300), 'Tulis brief pertama', font=F9(110), fill=(108, 70, 220), anchor='ls')
    for i, l in enumerate(['Aku nak buat video dokumentari', 'ringkas tentang [topik], sempena', '[peristiwa]. Cari fakta, tulis DRAF.md']):
        d.text((120, 470 + i * 120), l, font=F8(64), fill=(150, 110, 210), anchor='ls')
    for i in range(3):
        d.rounded_rectangle((120, 860 + i * 60, 1520 - i * 260, 886 + i * 60), 10, fill=(236, 228, 248))
    im.save(os.path.join(D, 'page_prompt.png'))

def keyboard():
    im = Image.new('RGB', (1024, 512), (33, 26, 40)); d = ImageDraw.Draw(im)
    for r in range(5):
        for c in range(14):
            d.rounded_rectangle((20 + c * 71, 30 + r * 92, 82 + c * 71, 110 + r * 92), 8, fill=(58, 48, 70))
    im.save(os.path.join(D, 'keyboard.png'))

workflow(); screens(); pegboard(); grid_notes(); storyboard(); prompt_page(); keyboard(); print('ok')
