#!/usr/bin/env python3
"""Synthesises the sound-effect track (paper slaps, ticks, typewriter keys, whooshes, hits) from a cue list.
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

def bp(x, lo, hi):
    b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.lfilter(b, a, x)

def noise(n):
    return rng.standard_normal(n)

def slap():   # paper smacked onto a desk
    n = int(0.16 * SR); t = np.arange(n) / SR
    return bp(noise(n), 900, 6000) * env(n, 0.001, 0.022) * 0.9 + np.sin(2 * np.pi * 95 * t) * env(n, 0.002, 0.05) * 0.8

def tick():   # small sticker / tag
    n = int(0.07 * SR)
    return bp(noise(n), 1800, 7000) * env(n, 0.0005, 0.012) * 0.55

def key():    # typewriter key
    n = int(0.09 * SR); t = np.arange(n) / SR
    f = rng.uniform(1700, 2300)
    return (bp(noise(n), 2500, 9000) * env(n, 0.0003, 0.006) + np.sin(2 * np.pi * f * t) * env(n, 0.0005, 0.018) * 0.35
            + np.sin(2 * np.pi * 140 * t) * env(n, 0.001, 0.025) * 0.5) * rng.uniform(0.7, 1.0)

def whoosh():
    n = int(0.55 * SR); t = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); k = 8; seg = n // k
    for i in range(k):                      # band sweeps upward
        lo = 300 + 500 * i; s = bp(x, lo, lo * 2.2)
        w = np.zeros(n); a, b = i * seg, min(n, (i + 2) * seg); w[a:b] = np.hanning(b - a)
        out += s * w
    return out * np.sin(np.pi * t / t[-1]) ** 1.5 * 0.55

def hit():    # low impact for titles
    n = int(0.7 * SR); t = np.arange(n) / SR
    f = 70 * np.exp(-t * 6) + 42
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.2) * 1.0 + bp(noise(n), 400, 3000) * env(n, 0.001, 0.03) * 0.4

def thud():   # big number lands
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 110 * np.exp(-t * 9) + 55
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12) * 0.9 + bp(noise(n), 700, 4000) * env(n, 0.001, 0.02) * 0.35

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 420 + 700 * t / t[-1]
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.03) * 0.6

def drop():
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = 520 - 300 * t / t[-1]
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.05) * 0.5

def ding():
    n = int(0.9 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)) * env(n, 0.002, 0.25) * 0.35

def swish():  # pen drawing a line
    n = int(1.0 * SR); t = np.arange(n) / SR
    return bp(noise(n), 2500, 8000) * np.sin(np.pi * t / t[-1]) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * 0.16

def roll():   # run of small dots appearing
    n = int(1.3 * SR); out = np.zeros(n)
    for i in range(26):
        k = tick() * 0.5; a = int(i * 0.05 * SR); out[a:a + len(k)] += k[: n - a]
    return out

GEN = dict(slap=slap, tick=tick, key=key, whoosh=whoosh, hit=hit, thud=thud, pop=pop, drop=drop, ding=ding, swish=swish, roll=roll)
GAIN = dict(slap=0.5, tick=0.3, key=0.45, whoosh=0.5, hit=0.6, thud=0.55, pop=0.4, drop=0.4, ding=0.5, swish=0.6, roll=0.5)

d = json.load(open(sys.argv[1]))
n = int((d["duration"] + 1) * SR)
L = np.zeros(n); R = np.zeros(n)
last = {}
for kind, t in sorted(d["sfx"], key=lambda c: c[1]):
    if t < 0 or t - last.get(kind, -9) < 0.09:      # never machine-gun the same sound
        continue
    last[kind] = t
    x = GEN[kind]() * GAIN[kind]
    a = int(t * SR); x = x[: n - a]
    pan = rng.uniform(-0.25, 0.25) if kind in ("tick", "key", "pop", "slap") else 0
    L[a:a + len(x)] += x * (1 - max(0, pan)); R[a:a + len(x)] += x * (1 + min(0, pan))
st = np.stack([L, R], axis=1)
st = np.tanh(st * 1.1) * 0.8
wavfile.write(sys.argv[2], SR, (st * 32767).astype(np.int16))
print("sfx", len(d["sfx"]), "cues ->", sys.argv[2])
