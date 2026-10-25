"""Muzik latar sintetik lembut (pad Am-F-C-G + arpeggio) dengan whoosh pada peralihan.
Guna: python3 music.py <tempoh> <masa_peralihan,..> <out.wav>"""
import sys, wave
import numpy as np
uniform_filter1d = lambda x, k: np.convolve(x, np.ones(k) / k, "same")
SR = 44100; T = float(sys.argv[1]); cuts = [float(x) for x in sys.argv[2].split(',')]
n = int(SR * T); t = np.arange(n) / SR; mix = np.zeros(n)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
bar = 2.0
for k in range(int(T / bar) + 1):
    s, e = int(k * bar * SR), min(n, int((k + 1) * bar * SR + SR * 0.5))
    if s >= n: break
    tt = t[s:e] - t[s]; env = np.minimum(1, tt / 0.5) * np.exp(-tt * 0.5)
    for m in chords[k % 4]:
        for det in (-0.08, 0.08):
            mix[s:e] += 0.05 * env * np.sin(2 * np.pi * hz(m + det) * tt)
    for j, m in enumerate(chords[k % 4] * 2):
        a = s + int(j * bar / 6 * SR)
        if a >= n: break
        b = min(n, a + int(SR * 0.9)); u = t[a:b] - t[a]
        mix[a:b] += 0.035 * np.exp(-u * 4) * np.sin(2 * np.pi * hz(m + 12) * u)
rng = np.random.default_rng(1)
for c in cuts:
    a = max(0, int((c - 0.25) * SR)); b = min(n, a + int(SR * 0.6)); u = np.linspace(0, 1, b - a)
    noise = uniform_filter1d(rng.standard_normal(b - a), 6)
    mix[a:b] += 0.25 * noise * np.sin(np.pi * u) ** 2
fade = np.minimum(1, np.minimum(t / 0.4, (T - t) / 1.2))
mix = mix * fade; mix = mix / np.abs(mix).max() * 0.6
st = np.stack([mix, np.roll(mix, 300)], 1)
with wave.open(sys.argv[3], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
