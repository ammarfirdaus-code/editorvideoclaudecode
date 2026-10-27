#!/usr/bin/env python3
"""Dapatkan masa setiap perkataan daripada fail suara (voiceover) guna whisper-cli tempatan.

Guna:
    python transcribe.py <suara.mp3|wav> <out_words.json> [--model ~/.cache/whisper/ggml-small.bin] [--lang ms]

Output words.json = senarai [mula, tamat, perkataan] dalam saat; dipakai oleh render.py
untuk potong klip ikut apa yang disebut dan untuk caption.

Semak hasilnya: Whisper kadang-kadang salah eja nama (cth. "Muo", nama menu).
Betulkan teks dalam words.json; masa tak perlu diubah.
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    audio, out = Path(a[0]), Path(a[1])
    model = a[a.index("--model") + 1] if "--model" in a else os.path.expanduser("~/.cache/whisper/ggml-small.bin")
    lang = a[a.index("--lang") + 1] if "--lang" in a else "ms"

    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "in.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio), "-ar", "16000", "-ac", "1",
                        "-c:a", "pcm_s16le", str(wav)], check=True)
        base = Path(td) / "out"
        # -ml 1 + -sow = satu segmen bagi setiap perkataan
        subprocess.run(["whisper-cli", "-m", model, "-l", lang, "-f", str(wav),
                        "-ml", "1", "-sow", "-oj", "-of", str(base)], check=True,
                       stdout=subprocess.DEVNULL)
        data = json.loads((base.with_suffix(".json")).read_text(encoding="utf-8"))

    words = []
    for seg in data.get("transcription", []):
        text = seg.get("text", "")
        t0 = seg["offsets"]["from"] / 1000.0
        t1 = seg["offsets"]["to"] / 1000.0
        w = text.strip()
        if not w:
            continue
        if words and not text.startswith(" "):
            # sambungan perkataan sebelum (token tanpa ruang di depan)
            words[-1][1] = round(t1, 3)
            words[-1][2] += w
        else:
            words.append([round(t0, 3), round(t1, 3), w])
    words = [w for w in words if not (w[2].startswith("[") and w[2].endswith("]"))]
    # satu perkataan satu baris supaya senang dibetulkan
    out.write_text("[\n" + ",\n".join(json.dumps(w, ensure_ascii=False) for w in words) + "\n]\n", encoding="utf-8")
    print(f"{len(words)} perkataan, tamat {words[-1][1]:.2f}s -> {out}" if words else "Tiada perkataan dikesan")


if __name__ == "__main__":
    main()
