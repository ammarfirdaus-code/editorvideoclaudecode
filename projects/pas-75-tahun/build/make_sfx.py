#!/usr/bin/env python3
"""Synthesises a quiet, soft sound-effect track from the scene engine's cue list.

Palette (deliberately gentle, no sharp clicks): a soft low thump when a picture lands, a mellow
pluck for map/number changes, a muffled whoosh for chapter cards, quiet typewriter keys on the
opening date. Small tag pops, pen swishes and dot rolls are not voiced at all.
Usage: python3 build/make_sfx.py <cues.json> <out.wav>"""
import json, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(75)

def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)

def lp(x, hz):
    b, a = signal.butter(2, hz / (SR / 2), btype="low")
    return signal.lfilter(b, a, x)

def bp(x, lo, hi):
    b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.lfilter(b, a, x)

def thump():      # picture set down on paper: soft, low, no click
    n = int(0.28 * SR); t = np.arange(n) / SR
    f = 95 * np.exp(-t * 10) + 62
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.006, 0.07)
    paper = lp(rng.standard_normal(n), 900) * env(n, 0.004, 0.03) * 0.25
    return body + paper

def pluck(freq):  # mellow marimba-like note
    n = int(0.6 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 12)) * env(n, 0.004, 0.16)

def whoosh():     # muffled air movement
    n = int(0.8 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 250, 1400) * np.sin(np.pi * t / t[-1]) ** 2

def swell():      # soft low swell under titles
    n = int(1.1 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110 * t)) * env(n, 0.03, 0.32)

def key():        # distant typewriter key
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (lp(rng.standard_normal(n), 2600) * env(n, 0.001, 0.008) + np.sin(2 * np.pi * 150 * t) * env(n, 0.002, 0.02) * 0.6) * rng.uniform(0.7, 1.0)

NOTES = [392.0, 440.0, 523.25, 587.33, 659.25]      # G A C D E, pentatonic
state = dict(note=0)
def next_note(up=True):
    state["note"] = (state["note"] + (1 if up else -1)) % len(NOTES)
    return NOTES[state["note"]]

# cue kind -> (generator, gain, minimum gap to the previous sound of that voice in seconds)
VOICES = dict(
    slap=("thump", lambda: thump(), 0.32, 1.6),
    hit=("swell", lambda: swell(), 0.30, 1.0),
    thud=("swell", lambda: swell(), 0.30, 1.0),
    whoosh=("whoosh", lambda: whoosh(), 0.22, 1.0),
    pop=("pluck", lambda: pluck(next_note(True)), 0.22, 0.35),
    drop=("pluck", lambda: pluck(next_note(False) / 2), 0.22, 0.35),
    ding=("pluck", lambda: pluck(783.99), 0.22, 0.35),
    key=("key", lambda: key(), 0.16, 0.1),
)

d = json.load(open(sys.argv[1]))
n = int((d["duration"] + 2) * SR)
out = np.zeros(n)
last = {}
used = 0
for kind, t in sorted(d["sfx"], key=lambda c: c[1]):
    if kind not in VOICES or t < 0:
        continue
    voice, gen, gain, gap = VOICES[kind]
    if t - last.get(voice, -99) < gap:
        continue
    last[voice] = t
    x = gen() * gain
    a = int(t * SR); x = x[: n - a]
    out[a:a + len(x)] += x
    used += 1
out = lp(out, 6000)
st = np.stack([out, out], axis=1) * 0.9
st = np.clip(st, -0.95, 0.95)
wavfile.write(sys.argv[2], SR, (st * 32767).astype(np.int16))
print("sfx", used, "of", len(d["sfx"]), "cues voiced ->", sys.argv[2])
