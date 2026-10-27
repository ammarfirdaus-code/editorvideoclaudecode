#!/usr/bin/env python3
"""Lapisan animasi HyperFrames (HTML + GSAP) untuk kad rating dan CTA.

Dipanggil oleh render.py bila config ada "overlay_engine": "hyperframes".
render.py hasilkan dulu video asas (klip + grade + caption + audio), kemudian
skrip ni bina projek HyperFrames yang letak video asas sebagai latar dan
tambah kad rating + CTA beranimasi, lalu render MP4 akhir.
"""
import html
import json
import shutil
import subprocess
from pathlib import Path

STAR = ("M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z")


def esc(t):
    out = html.escape(t)
    return out.replace("{y}", '<span class="y">').replace("{/y}", "</span>").replace("\n", "<br>")


def star_svg(fill_frac, sid):
    """fill_frac 0..1 -> bintang emas penuh/separuh di atas bintang kelabu."""
    w = 24 * fill_frac
    return (f'<svg class="star" id="{sid}" viewBox="0 0 24 24">'
            f'<path d="{STAR}" fill="#3a3a3a" stroke="#000" stroke-width="1"/>'
            f'<clipPath id="c{sid}"><rect x="0" y="0" width="{w:.2f}" height="24"/></clipPath>'
            f'<path d="{STAR}" fill="#FFC400" stroke="#7a5200" stroke-width="1" clip-path="url(#c{sid})"/>'
            f'</svg>')


CSS = """
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:#000; }
#root { position:relative; width:1080px; height:1920px; font-family:'Poppins', sans-serif; font-weight:700; }
.clip { position:absolute; inset:0; }
#base { position:absolute; inset:0; width:1080px; height:1920px; object-fit:cover; }
.layer { position:absolute; inset:0; pointer-events:none; }
.y { color:#FFD500; }
/* kad rating */
.card { position:absolute; left:90px; right:90px; top:1080px; padding:46px 40px 40px;
        background:rgba(14,14,14,.86); border-radius:42px; border:4px solid #FFD500;
        box-shadow:0 24px 60px rgba(0,0,0,.45); text-align:center; color:#fff; opacity:0; }
.badgerow { position:absolute; top:-34px; left:0; right:0; display:flex; justify-content:center; }
.badge {
         background:#FFD500; color:#111; font-size:34px; padding:10px 30px; border-radius:40px;
         white-space:nowrap; letter-spacing:1px; }
.name { font-size:68px; line-height:1.1; margin-top:12px; }
.stars { display:flex; justify-content:center; gap:18px; margin-top:34px; }
.star { width:112px; height:112px; }
.score { font-size:84px; margin-top:22px; color:#FFD500; }
/* CTA */
.q { position:absolute; left:60px; right:60px; top:430px; text-align:center; color:#fff;
     font-size:96px; line-height:1.15; text-shadow:0 6px 0 #000, 0 0 30px rgba(0,0,0,.6);
     -webkit-text-stroke:3px #000; opacity:0; }
.row { position:absolute; left:0; right:0; display:flex; justify-content:center; }
.pill { background:#FFD500; color:#111; font-size:72px; padding:22px 54px; border-radius:60px;
        white-space:nowrap; box-shadow:0 14px 40px rgba(0,0,0,.4); }
.follow { display:flex; align-items:center; gap:22px; background:#E1306C; color:#fff;
          font-size:60px; padding:20px 46px; border-radius:60px; white-space:nowrap;
          box-shadow:0 14px 40px rgba(0,0,0,.4); }
.bell { width:70px; height:70px; transform-origin:50% 10%; }
"""

BELL = ('<svg class="bell" id="bell" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a1.6 1.6 0 0 0-1.6 1.6v.7'
        'A6.4 6.4 0 0 0 5.6 10.6v4.6L3.8 17v1.2h16.4V17l-1.8-1.8v-4.6a6.4 6.4 0 0 0-4.8-6.3v-.7A1.6 1.6 0 0 0 12 2z'
        'm0 20a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22z"/></svg>')


def build(cfg, base_video: Path, out_path: Path, work: Path):
    T = float(cfg["duration"])
    proj = work / "hf"
    if proj.exists():
        shutil.rmtree(proj)
    proj.mkdir(parents=True)
    (proj / "assets").mkdir()
    shutil.copy(base_video, proj / "assets" / "base.mp4")

    gsap_src = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"
    vend = cfg.get("gsap_file")  # pilihan: laluan gsap.min.js tempatan (scripts/vendor-gsap.sh)
    if vend and Path(vend).exists():
        shutil.copy(vend, proj / "assets" / "gsap.min.js")
        gsap_src = "assets/gsap.min.js"

    body, js = [], []
    ratings = cfg.get("ratings", [])
    label = cfg.get("rating_label", "RATING AKU")
    for i, r in enumerate(ratings, 1):
        a, b, sc, t0 = float(r["start"]), float(r["end"]), float(r["score"]), float(r["stars_at"])
        stars = "".join(star_svg(max(0.0, min(1.0, sc - j)), f"s{i}_{j}") for j in range(5))
        body.append(
            f'<div class="layer clip" id="rating{i}" data-start="{a}" data-duration="{b - a:.3f}" data-track-kind="graphics">'
            f'<div class="card" id="card{i}"><div class="badgerow"><div class="badge">{esc(label)} #{i}/{len(ratings)}</div></div>'
            f'<div class="name">{esc(r["name"].upper())}</div><div class="stars">{stars}</div>'
            f'<div class="score" id="score{i}">{sc:g}/5</div></div></div>')
        js.append(f'tl.fromTo("#card{i}",{{y:260,opacity:0,rotation:-3}},{{y:0,opacity:1,rotation:0,duration:0.55,ease:"back.out(1.6)"}},{a});')
        for j in range(5):
            if sc - j <= 0:
                js.append(f'tl.fromTo("#s{i}_{j}",{{scale:0}},{{scale:1,duration:0.25,ease:"power2.out"}},{t0 + 0.12 * j:.3f});')
            else:
                js.append(f'tl.fromTo("#s{i}_{j}",{{scale:0,rotation:-140}},{{scale:1,rotation:0,duration:0.42,ease:"back.out(2.2)"}},{t0 + 0.12 * j:.3f});')
        js.append(f'tl.fromTo("#score{i}",{{scale:0}},{{scale:1,duration:0.4,ease:"elastic.out(1,0.5)"}},{t0 + 0.7:.3f});')
        js.append(f'tl.to("#card{i}",{{y:120,opacity:0,duration:0.25,ease:"power2.in"}},{b - 0.25:.3f});')

    cta = cfg.get("cta")
    if cta:
        a, b = float(cta["start"]), float(cta["end"])
        body.append(
            f'<div class="layer clip" id="cta" data-start="{a}" data-duration="{b - a:.3f}" data-track-kind="graphics">'
            f'<div class="q" id="ctaq">{esc(cta["question"])}</div>'
            f'<div class="row" style="top:1000px"><div class="pill" id="ctac">{esc(cta.get("comment", "KOMEN KAT BAWAH!"))}</div></div>'
            f'<div class="row" style="top:1180px"><div class="follow" id="ctaf">{BELL}<span>{esc(cta.get("follow", "JANGAN LUPA FOLLOW"))}</span></div></div>'
            f'</div>')
        js.append(f'tl.fromTo("#ctaq",{{y:-80,opacity:0}},{{y:0,opacity:1,duration:0.5,ease:"back.out(1.7)"}},{a});')
        ca = float(cta.get("comment_at", a + 1.5))
        fa = float(cta.get("follow_at", a + 3))
        js.append(f'tl.fromTo("#ctac",{{scale:0}},{{scale:1,duration:0.45,ease:"back.out(2.5)"}},{ca});')
        js.append(f'tl.to("#ctac",{{y:-14,duration:0.3,yoyo:true,repeat:3,ease:"sine.inOut"}},{ca + 0.5});')
        js.append(f'tl.fromTo("#ctaf",{{scale:0}},{{scale:1,duration:0.45,ease:"back.out(2.5)"}},{fa - 0.15});')
        js.append(f'tl.fromTo("#bell",{{rotation:0}},{{rotation:22,duration:0.09,yoyo:true,repeat:7,ease:"sine.inOut"}},{fa});')

    page = f"""<!doctype html>
<html lang="ms">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="{gsap_src}"></script>
<style>{CSS}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{T}" data-width="1080" data-height="1920">
<video id="base" class="clip" src="assets/base.mp4" data-start="0" data-duration="{T}" data-has-audio="true" playsinline></video>
{chr(10).join(body)}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
{chr(10).join(js)}
window.__timelines = window.__timelines || {{}};
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
    (proj / "index.html").write_text(page, encoding="utf-8")
    (proj / "meta.json").write_text(json.dumps({"id": "video-review", "name": "Video review"}), encoding="utf-8")
    npx = shutil.which("npx") or shutil.which("npx.cmd") or "npx"
    ver = cfg.get("hyperframes_version", "hyperframes@0.8.206")
    subprocess.run([npx, "-y", ver, "render", "-o", str(out_path.resolve()),
                    "--quality", cfg.get("hyperframes_quality", "looks")], cwd=proj, check=True)
