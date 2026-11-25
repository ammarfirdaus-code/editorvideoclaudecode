#!/usr/bin/env python3
"""Makes paper-collage assets: black-and-white 'sticker' cutouts (white outline) of people,
and black-and-white prints of the other photos. Writes assets/photos/cut/ and adds fields to slots.json.
Usage: python3 build/make_cutouts.py"""
import json, os
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = os.path.join(ROOT, "assets/photos")
OUT = os.path.join(PH, "cut")
os.makedirs(OUT, exist_ok=True)
# slot -> optional crop box (fractions l, t, r, b) applied before background removal
PEOPLE = {
    "fuad": None, "abbas": None, "burhanuddin2": None, "burhanuddin_p": None, "zulkifli": None, "zulkifli2": None,
    "kelantan1959": None, "asri": (0.0, 0.0, 1.0, 0.9), "yusofrawa": None, "fadzil": (0.17, 0.0, 0.87, 1.0), "nikaziz": None,
    "hadi_p": None, "samsuri": None,
}
slots = json.load(open(os.path.join(PH, "slots.json")))
SESS = {"isnet": new_session("isnet-general-use"), "human": new_session("u2net_human_seg")}
HUMAN = {"asri", "kelantan1959", "zulkifli", "burhanuddin2", "burhanuddin_p", "yusofrawa"}

def tone(im):
    g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=1)
    return ImageEnhance.Contrast(g).enhance(1.12)

for key, sl in slots.items():
    src = Image.open(os.path.join(PH, sl["file"])).convert("RGB")
    if key in PEOPLE:
        box = PEOPLE[key]
        if box:
            w, h = src.size
            src = src.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
        s = (700 if key in HUMAN else 900) / max(src.size)
        src = src.resize((max(1, round(src.width * s)), max(1, round(src.height * s))), Image.LANCZOS)
        cut = remove(src, session=SESS["human" if key in HUMAN else "isnet"], post_process_mask=key not in HUMAN)
        a = cut.split()[3].point(lambda v: 255 if v > 110 else 0).filter(ImageFilter.GaussianBlur(1.2))
        pad = 28
        W, H = src.width + pad * 2, src.height + pad * 2
        alpha = Image.new("L", (W, H), 0); alpha.paste(a, (pad, pad))
        grey = Image.new("L", (W, H), 255); grey.paste(tone(src), (pad, pad))
        ring = alpha.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(1.5))
        ring = ring.point(lambda v: 255 if v > 90 else 0).filter(ImageFilter.GaussianBlur(1.0))
        out = Image.new("RGBA", (W, H), (255, 255, 255, 0))
        out.paste(Image.new("RGBA", (W, H), (250, 249, 245, 255)), (0, 0), ring)
        person = Image.merge("RGBA", (grey, grey, grey, alpha))
        out.alpha_composite(person)
        bb = out.getbbox()
        out = out.crop((bb[0], bb[1], bb[2], H - pad + 0)) if bb else out   # flat bottom edge like a bust cutout
        name = f"cut/{key}.png"
        out.save(os.path.join(PH, name))
        cov = sum(1 for v in alpha.getdata() if v > 128) / (W * H)
        sl.update(cut=name, cw=out.width, ch=out.height)
        print(f"{key:14s} cutout {out.size} coverage {cov:.2f}")
    g = tone(src if key not in PEOPLE else Image.open(os.path.join(PH, sl["file"])).convert("RGB"))
    s = min(1.0, 1600 / max(g.size))
    g = g.resize((round(g.width * s), round(g.height * s)), Image.LANCZOS)
    name = f"cut/bw-{key}.jpg"
    g.save(os.path.join(PH, name), quality=90)
    sl.update(bw=name, bww=g.width, bwh=g.height)
json.dump(slots, open(os.path.join(PH, "slots.json"), "w"), ensure_ascii=False, indent=1)
