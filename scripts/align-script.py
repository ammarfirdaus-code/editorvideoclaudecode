"""Word timings for a voice-over whose script is known.

Whisper's word timings are good but it mishears Malay and English brand
names, so the words themselves come from the script and only the times
come from Whisper. The two word lists are matched with difflib; script
words with no match get times interpolated from their neighbours.

Usage: python3 scripts/align-script.py audio.mp3 script.txt out.json
"""
import difflib
import json
import re
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def main(audio, script_path, out_path):
    text = open(script_path, encoding="utf-8").read()
    text = re.sub(r"\[[^\]]*\]", " ", text)  # drop ElevenLabs tags like [pause]
    script_words = text.split()

    model = WhisperModel("small", device="cpu", compute_type="int8")
    # Decode with the ffmpeg binary rather than PyAV, whose versions drift
    # out of step with faster-whisper.
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-f", "s16le",
                          "-ac", "1", "-ar", "16000", "-"],
                         check=True, capture_output=True).stdout
    samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(samples, language="ms", word_timestamps=True)
    heard = [w for s in segments for w in s.words]

    a = [norm(w) for w in script_words]
    b = [norm(w.word) for w in heard]
    times = [None] * len(script_words)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k].start, heard[j1 + k].end)
        elif tag == "replace":
            # Spread the unmatched script words across the heard span.
            s, e = heard[j1].start, heard[j2 - 1].end
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)

    # Fill any remaining gaps (script words Whisper skipped entirely).
    for i, t in enumerate(times):
        if t is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), prev + 0.3)
            times[i] = (prev, max(prev + 0.05, nxt))

    words = [{"word": w, "start": round(s, 3), "end": round(e, 3)}
             for w, (s, e) in zip(script_words, times)]
    json.dump({"words": words, "whisper": " ".join(w.word.strip() for w in heard)},
              open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    matched = sum(1 for op in sm.get_opcodes() if op[0] == "equal" for _ in range(op[2] - op[1]))
    print(f"{len(words)} script words, {matched} matched exactly")


if __name__ == "__main__":
    main(*sys.argv[1:4])
