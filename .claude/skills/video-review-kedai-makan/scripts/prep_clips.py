#!/usr/bin/env python3
"""Sediakan klip mentah: buang duplicate, stabilize, colour grade, tukar ke 1080x1920 (9:16).

Guna:
    python prep_clips.py <folder_klip> <folder_output>

- Fail bernama "xxx (1).mp4" dianggap duplicate dan dilangkau.
- Klip yang dah siap diproses tidak diproses semula (boleh sambung jika terputus).
- Audio asal klip dibuang (suara + muzik dimasukkan semasa render).
"""
import subprocess
import sys
from pathlib import Path

GRADE = (
    "eq=contrast=1.08:saturation=1.2:brightness=0.015:gamma=0.97,"
    "colorbalance=rs=0.035:bs=-0.035:rm=0.02:bm=-0.02:rh=0.01:bh=-0.01,"
    "unsharp=5:5:0.45:5:5:0,vignette=angle=PI/7"
)
EXTS = {".mp4", ".mov", ".m4v", ".mkv"}


def run(cmd):
    subprocess.run(cmd, check=True)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    trf_dir = out / "_trf"
    trf_dir.mkdir(exist_ok=True)
    clips = sorted(p for p in src.iterdir() if p.suffix.lower() in EXTS and "(1)" not in p.stem)
    for p in clips:
        dst = out / f"{p.stem}.mp4"
        if dst.exists() and dst.stat().st_size > 1000:
            print("ada", dst.name)
            continue
        tmp = out / f"{p.stem}.tmp.mp4"
        trf = trf_dir / f"{p.stem}.trf"
        trf_s = trf.as_posix().replace(":", r"\:")  # Windows "C:" perlu escape dalam filter
        base = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-vf",
             f"{base},vidstabdetect=shakiness=6:accuracy=12:result={trf_s}", "-f", "null", "-"])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-an", "-vf",
             f"{base},vidstabtransform=input={trf_s}:smoothing=20:zoom=6:optzoom=0:interpol=bicubic,"
             f"{GRADE},format=yuv420p",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", str(tmp)])
        tmp.replace(dst)
        print("siap", dst.name)


if __name__ == "__main__":
    main()
