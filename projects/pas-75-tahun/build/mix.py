#!/usr/bin/env python3
"""Mixes narration + music and muxes them onto a rendered video.

Usage: python3 build/mix.py <main|reel> <video.mp4> <music file> <out.mp4>
The music file is looped/trimmed to the film length, ducked under the narration and faded out.
"""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kind, video, music, out = sys.argv[1:5]
D = json.loads(open(os.path.join(ROOT, f"data.{kind}.js")).read()[len("window.DATA = "):-2])
T = D["duration"]
cmd = ["ffmpeg", "-v", "error", "-y", "-i", video, "-stream_loop", "-1", "-i", music]
for a in D["audio"]:
    cmd += ["-i", os.path.join(ROOT, a["file"])]
f = []
vo = []
for i, a in enumerate(D["audio"]):
    ms = int(a["start"] * 1000)
    f.append(f"[{i+2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
    vo.append(f"[v{i}]")
f.append("".join(vo) + f"amix=inputs={len(vo)}:normalize=0,apad=whole_dur={T},atrim=0:{T},asplit=2[vo][key]")
f.append(f"[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{T},volume=0.55,afade=t=in:d=1.5,afade=t=out:st={T-3.5}:d=3.5[mu]")
f.append("[mu][key]sidechaincompress=threshold=0.02:ratio=7:attack=120:release=900[duck]")
f.append("[vo]volume=1.5[vo2];[vo2][duck]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]")
cmd += ["-filter_complex", ";".join(f), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-t", str(T), "-movflags", "+faststart", out]
subprocess.check_call(cmd)
print("wrote", out)
