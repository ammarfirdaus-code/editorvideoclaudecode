#!/usr/bin/env python3
"""Builds a stand-in music bed from short generated clips: one mood per section, crossfaded.
Usage: python3 build/music_bed.py <main|reel> <clips dir> <out.wav>"""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kind, clips, out = sys.argv[1:4]
D = json.loads(open(os.path.join(ROOT, f"data.{kind}.js")).read()[len("window.DATA = "):-2])
T = D["duration"]
if kind == "main":
    c = {x["no"]: x["start"] for x in D["cards"]}
    sections = [(0, c[3], ["a0", "a1"]), (c[3], c[5], ["b0"]), (c[5], c[8], ["c0"]), (c[8], T, ["d0"])]
else:
    sections = [(0, 21, ["a0"]), (21, 28, ["b0"]), (28, 52, ["c0"]), (52, T, ["d0"])]
XF, CLIP = 4.0, 29.9
inputs, filt, labels = [], [], []
n = 0
for si, (t0, t1, names) in enumerate(sections):
    need = (t1 - t0) + XF
    k, cur, got = 0, None, 0.0
    while got < need:
        inputs += ["-i", os.path.join(clips, names[k % len(names)] + ".wav")]
        lab = f"[{n}:a]"
        if cur is None:
            cur, got = lab, CLIP
        else:
            filt.append(f"{cur}{lab}acrossfade=d={XF}:c1=tri:c2=tri[s{si}_{k}]")
            cur, got = f"[s{si}_{k}]", got + CLIP - XF
        n += 1; k += 1
    ms = int(max(0, t0 - XF / 2) * 1000)
    fi = "" if si == 0 else f"afade=t=in:d={XF},"
    filt.append(f"{cur}atrim=0:{need},{fi}afade=t=out:st={need - XF}:d={XF},adelay={ms}[m{si}]")
    labels.append(f"[m{si}]")
filt.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,atrim=0:{T}[o]")
subprocess.check_call(["ffmpeg", "-v", "error", "-y"] + inputs + ["-filter_complex", ";".join(filt), "-map", "[o]", "-ar", "48000", out])
print("wrote", out)
