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

workflow(); screens(); pegboard(); grid_notes(); print('ok')
