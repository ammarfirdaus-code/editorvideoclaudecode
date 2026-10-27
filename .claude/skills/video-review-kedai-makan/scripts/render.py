#!/usr/bin/env python3
"""Render video review 9:16 daripada config JSON (lihat templates/config.example.json).

Guna:
    python render.py <config.json>

Langkah:
 1. Potong & zoom setiap babak (klip dari prep_clips.py) ikut masa dalam config.
 2. Bina fail caption ASS: caption bawah ikut perkataan, teks besar/kad info, rating bintang.
 3. Gabung video + bakar caption.
 4. Campur audio: suara + muzik (ducking) + swish di setiap potongan + ding bintang + boom + loceng.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SFX = HERE.parent / "sfx"
FPS = 30
AF = "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"


def run(cmd):
    subprocess.run(cmd, check=True)


def dur(f):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]))


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


# ---------------------------------------------------------------- 1. babak video
def render_segments(cfg, work):
    seg_dir = work / "segments"
    seg_dir.mkdir(parents=True, exist_ok=True)
    prepped = Path(cfg["prepped_dir"])
    segs, cuts, start, i = [], [], 0.0, 0
    for sc in cfg["scenes"]:
        end = sc["end"]
        share = (end - start) / len(sc["clips"])
        for k, (name, off, ln) in enumerate(sc["clips"]):
            src = prepped / f"{name}.mp4"
            avail = ln if ln else dur(src) - off - 0.05
            speed = min(1.0, avail / share)
            take = min(share * speed, avail)
            mo = sc.get("motion", "in")
            if mo != "punch" and k % 2 == 1:
                mo = "out" if mo == "in" else "in"
            n = max(2, round(share * FPS))
            amp = 0.10 if mo == "punch" else 0.06
            ease = f"(1-pow(1-on/{n - 1},3))" if mo == "punch" else f"(0.5-0.5*cos(PI*on/{n - 1}))"
            z = f"1+{amp}*{ease}" if mo != "out" else f"1+{amp}-{amp}*{ease}"
            out = seg_dir / f"s{i:03d}.mp4"
            vf = (f"trim=start={off}:duration={take},setpts=(PTS-STARTPTS)/{speed},fps={FPS},"
                  f"scale=2160:3840:flags=lanczos,"
                  f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS},"
                  f"format=yuv420p")
            run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-t", f"{share:.3f}",
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", str(out)])
            segs.append(out)
            if i > 0:
                cuts.append(start + k * share)
            i += 1
            print(f"babak {i}: {name}", flush=True)
        start = end
    lst = work / "segments.txt"
    lst.write_text("".join(f"file '{s.resolve().as_posix()}'\n" for s in segs))
    return lst, cuts


# ---------------------------------------------------------------- 2. caption ASS
HDR = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Poppins,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,2,60,60,470,1
Style: big,Poppins,110,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,-1,0,1,9,4,5,50,50,0,1
Style: yellow,Poppins,88,&H00111111,&H00FFFFFF,&H0000D5FF,&H0000D5FF,-1,0,0,0,100,100,0,0,3,24,0,5,60,60,0,1
Style: dark,Poppins,66,&H00FFFFFF,&H00FFFFFF,&H00111111,&H00111111,-1,0,0,0,100,100,0,0,3,22,0,5,60,60,0,1
Style: blue,Poppins,66,&H00FFFFFF,&H00FFFFFF,&H00C8701E,&H00C8701E,-1,0,0,0,100,100,0,0,3,22,0,5,60,60,0,1
Style: small,Poppins,56,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,2,5,60,60,0,1
Style: Star,DejaVu Sans,120,&H0000C8FF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,3,5,0,0,0,1
Style: StarOff,DejaVu Sans,120,&H00505050,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,3,5,0,0,0,1
Style: Score,Poppins,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,3,5,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
POP = r"{\fscx60\fscy60\t(0,160,\fscx112\fscy112)\t(160,260,\fscx100\fscy100)}"
POP_CAP = r"{\fscx70\fscy70\t(0,140,\fscx108\fscy108)\t(140,220,\fscx100\fscy100)}"
YEL, WHT = r"{\c&H00D5FF&}", r"{\c&HFFFFFF&}"


def markup(t):
    return t.replace("{y}", YEL).replace("{/y}", WHT).replace("\n", r"\N")


def build_ass(cfg, words, work):
    ev = []

    def D(layer, a, b, style, text):
        ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{text}")

    sub = cfg.get("subtitles", {})
    skip = sub.get("skip", [])
    kws = sorted(sub.get("keywords", []), key=len, reverse=True)
    chunks, cur = [], []
    for w in words:
        if any(a <= w[0] < b for a, b in skip):
            if cur:
                chunks.append(cur)
                cur = []
            continue
        cur.append(w)
        last = w[2][-1]
        if len(cur) >= 3 or (last in ",.!?" and len(cur) >= 2) or last in ".!?":
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    for k, c in enumerate(chunks):
        st = c[0][0]
        nxt = chunks[k + 1][0][0] if k + 1 < len(chunks) else c[-1][1] + 0.6
        en = min(nxt, c[-1][1] + 0.5)
        for a, _ in skip:  # jangan masuk ke bahagian rating
            if st < a < en:
                en = a
        txt = " ".join(x[2] for x in c).upper().rstrip(",")
        for kw in kws:
            txt = txt.replace(kw.upper(), YEL + kw.upper() + WHT)
        D(0, st, en, "Cap", POP_CAP + txt)

    for t in cfg.get("texts", []):
        tags = rf"\pos(540,{t.get('y', 500)})"
        if t.get("size"):
            tags += rf"\fs{t['size']}"
        anim = POP if t.get("pop", True) else r"{\fad(150,0)}"
        D(3, t["start"], t["end"], t.get("style", "big"), "{" + tags + "}" + anim + markup(t["text"]))

    stars = []
    total = len(cfg.get("ratings", []))
    for i, r in enumerate(cfg.get("ratings", []), 1):
        a, b, sc, t0 = r["start"], r["end"], float(r["score"]), r["stars_at"]
        D(3, a, b, "yellow", r"{\pos(540,560)\fs80}" + POP + r["name"].upper())
        D(3, a, b, "small", r"{\pos(540,450)\fad(120,0)}" + f"{cfg.get('rating_label', 'RATING AKU')}  #{i}/{total}")
        xs = [300, 420, 540, 660, 780]
        for j, x in enumerate(xs):
            D(4, a, b, "StarOff", r"{\pos(%d,1250)}★" % x)
            val = sc - j
            if val <= 0:
                continue
            st = t0 + 0.12 * j
            clip = "" if val >= 1 else r"\clip(%d,1100,%d,1400)" % (x - 70, x)
            D(5, st, b, "Star", r"{\pos(%d,1250)%s\fscx40\fscy40\t(0,140,\fscx125\fscy125)\t(140,240,\fscx100\fscy100)}★" % (x, clip))
            stars.append(st)
        D(5, t0 + 0.7, b, "Score", r"{\pos(540,1410)}" + POP + f"{sc:g}/5")
    ass = work / "captions.ass"
    ass.write_text(HDR + "\n".join(ev) + "\n", encoding="utf-8")
    return ass, stars


# ---------------------------------------------------------------- 3 & 4. gabung + audio
def mix(cfg, video, cuts, stars, out):
    T = cfg["duration"]
    fx_cfg = cfg.get("sfx", {})
    inputs = ["-i", str(video), "-i", cfg["voice"]]
    fc = [f"[1:a]highpass=f=70,{AF},apad=whole_dur={T},loudnorm=I=-14:TP=-1.5:LRA=11:linear=true,{AF},asplit=2[vo][sc]"]
    idx = 2
    music = cfg.get("music")
    if music:
        inputs += ["-i", music, "-i", music]
        fc.append(f"[{idx}:a]{AF}[m1];[{idx + 1}:a]{AF}[m2];[m1][m2]acrossfade=d=3:c1=tri:c2=tri,"
                  f"atrim=0:{T},volume={cfg.get('music_volume', 0.30)},afade=t=in:st=0:d=0.4,"
                  f"afade=t=out:st={T - 1.6}:d=1.6[mu]")
        fc.append("[mu][sc]sidechaincompress=threshold=0.04:ratio=4:attack=40:release=600[duck]")
        idx += 2
    else:
        fc.append("[sc]anullsink")

    fx = []

    def place(file, times, vol, tag):
        nonlocal idx
        if not times:
            return
        inputs.extend(["-i", str(file)])
        fc.append(f"[{idx}:a]{AF},volume={vol},asplit={len(times)}" + "".join(f"[{tag}{i}]" for i in range(len(times))))
        for i, t in enumerate(times):
            d = int(max(0.0, t) * 1000)
            fc.append(f"[{tag}{i}]adelay={d}|{d}[{tag.upper()}{i}]")
            fx.append(f"[{tag.upper()}{i}]")
        idx += 1

    if fx_cfg.get("swish_on_cuts", True):
        place(SFX / "swish.mp3", [c - 0.3 for c in cuts], 0.55, "w")
    place(SFX / "ding.mp3", stars, 0.4, "d")
    place(SFX / "boom.mp3", fx_cfg.get("boom_at", []), 0.4, "b")
    bell = fx_cfg.get("bell_at")
    place(SFX / "bell.mp3", [bell] if bell is not None else [], 0.8, "l")

    parts = ["[vo]"] + (["[duck]"] if music else [])
    if fx:
        fc.append("".join(fx) + f"amix=inputs={len(fx)}:normalize=0:duration=longest,apad=whole_dur={T}[sfx]")
        parts.append("[sfx]")
    fc.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0:duration=first,alimiter=limit=0.95[a]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[a]",
         "-t", str(T), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    cfg_path = Path(sys.argv[1]).resolve()
    os.chdir(cfg_path.parent)
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    work = Path(cfg.get("work_dir", "work"))
    work.mkdir(parents=True, exist_ok=True)
    words = json.loads(Path(cfg["words"]).read_text(encoding="utf-8"))
    T = cfg["duration"]

    lst, cuts = render_segments(cfg, work)
    ass, stars = build_ass(cfg, words, work)
    fontsdir = cfg.get("fonts_dir")
    def esc(p):  # escape colon (cth. "C:") untuk filter ffmpeg
        return Path(p).as_posix().replace(":", r"\:")
    ass_f = f"ass={esc(ass)}" + (f":fontsdir={esc(fontsdir)}" if fontsdir else "")
    video = work / "video_tanpa_audio.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-vf", f"{ass_f},fade=out:st={T - 0.6}:d=0.6", "-t", str(T), "-an",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", str(video)])
    out = Path(cfg["output"])
    mix(cfg, video, cuts, stars, out)
    print("SIAP:", out.resolve(), f"({dur(out):.1f}s)")

    # semakan: contact sheet 12 frame
    sheet = work / "semak.jpg"
    n = 12
    sel = "+".join(f"eq(n\\,{int((T * (k + 0.5) / n) * FPS)})" for k in range(n))
    run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf",
         f"select='{sel}',scale=180:-1,tile=6x2", "-frames:v", "1", "-vsync", "vfr", str(sheet)])
    print("semak frame:", sheet.resolve())


if __name__ == "__main__":
    main()
