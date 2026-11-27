# Music bed + soft SFX for the 30 s cut. Output: renders/audio.wav
# Style: warm felt piano, plucked strings, glockenspiel, light percussion (uplifting documentary).
import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; DUR = 30.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# timeline warp (same keyframes as main.js): old 18 s event times -> new 30 s times
WN = [0, 5.5, 11.5, 20.5, 24.5, 27, 28.2, 30]; WO = [0, 3.4, 7.2, 12.2, 15.2, 16.75, 17.5, 18]
def nt(old): return float(np.interp(old, WO, WN))

def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414; buf[i:i + len(sig), 1] += sig * gain * r * 1.414
def f(n): return 440 * 2 ** ((n - 69) / 12)
def lp(x, fc): return sosfilt(butter(2, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc): return sosfilt(butter(2, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

def piano(note, dur=2.5, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; fr = f(note); s = np.zeros(n)
    for k, a in enumerate([1, .45, .22, .12, .06, .03], 1):
        s += a * np.sin(2 * np.pi * fr * k * (1 + .0004 * k * k) * t) * np.exp(-t * (1.1 + k * .55))
    hammer = lp(rng.standard_normal(n), 1800) * np.exp(-t / .006) * .05
    return lp(s + hammer, 2600 + 900 * vel) * np.minimum(1, t / .004) * vel   # felt: soft top end
def pluck(note, dur=1.6):
    p = int(SR / f(note)); n = int(dur * SR)
    buf = rng.uniform(-1, 1, p); out = np.empty(n); pos = 0
    while pos < n:
        out[pos:pos + p] = buf[: min(p, n - pos)]
        buf = .996 * .5 * (buf + np.roll(buf, -1)); pos += p
    return lp(out, 3500) * np.exp(-np.arange(n) / SR / .9)
def glock(note, dur=1.8):
    n = int(dur * SR); t = np.arange(n) / SR; fr = f(note)
    return (np.sin(2*np.pi*fr*t) + .25*np.sin(2*np.pi*fr*2.76*t)*np.exp(-t/.2) + .1*np.sin(2*np.pi*fr*5.4*t)*np.exp(-t/.08)) * np.exp(-t/.7) * np.minimum(1, t/.001)
def pad(notes, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        for det in (-.06, .06):
            fr = f(m + det); s += np.sin(2*np.pi*fr*t) + .3*np.sin(2*np.pi*2*fr*t)
    a = np.minimum(1, t / 1.2) * np.minimum(1, np.maximum(0, dur - t) / 1.2)
    return lp(s, 1400) * a / (2 * len(notes))
def kick():
    n = int(.4 * SR); t = np.arange(n) / SR; fr = 45 + 55 * np.exp(-t / .04)
    return np.sin(2*np.pi*np.cumsum(fr)/SR) * np.exp(-t / .18) * np.minimum(1, t / .003)
def shaker():
    n = int(.12 * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n), 5000) * np.minimum(1, t/.02) * np.exp(-t / .04)
def snap():
    n = int(.25 * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 1200, 4000) * np.exp(-t / .05)

# ---- arrangement: 95 bpm, D major, I–V–vi–IV ----
BPM = 95; beat = 60 / BPM; bar = 4 * beat
prog = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]]       # D A Bm G
bass = [38, 33, 35, 31]
END = nt(16.75)                                                       # resolve on the end card
b = 0
while b * bar < END - .05:
    t0 = b * bar; c = prog[b % 4]
    for i, k in enumerate([0, 1, 2, 1, 3, 2, 1, 2]):                  # felt piano broken chord
        tt = t0 + i * beat / 2
        if tt >= END: break
        note = c[k % 3] + (12 if k == 3 else 0)
        add(music, tt, piano(note, 2.2, .55 if i % 2 else .75), .22, pan=-.15 + .3 * (i % 2))
    add(music, t0, piano(bass[b % 4] + 12, 3.0, .8), .28)
    if b >= 1: add(music, t0, pad([n - 12 for n in c], bar + 1.2), .5)
    if t0 >= nt(3.4) - .2:                                            # plucked strings
        for i in (0, 3, 6):
            if t0 + i * beat / 2 < END: add(music, t0 + i * beat / 2, pluck(c[(i // 3) % 3] + 12), .16, pan=.35)
    if t0 >= nt(7.2) - .3 and not (nt(12.2) - .3 <= t0 < nt(15.2) - .6):   # glock + light percussion
        for i, m in enumerate([c[2] + 12, c[1] + 24, c[0] + 24, c[2] + 12]):
            if t0 + i * beat < END: add(music, t0 + i * beat, glock(m), .06, pan=-.3)
        for i in range(4):
            tt = t0 + i * beat
            if tt >= END: break
            add(music, tt, kick(), .32 if i % 2 == 0 else .2)
            add(music, tt + beat / 2, shaker(), .05, .3)
            if i % 2: add(music, tt, snap(), .06, -.2)
    b += 1
for i, n in enumerate([50, 57, 62, 66, 69, 74]): add(music, END + i * .03, piano(n, 3.3, .8), .2, pan=(i - 2.5) * .12)
add(music, END, pad([50, 57, 62, 66], 3.2), .55)
for i, n in enumerate([86, 90, 93, 98]): add(music, END + .15 + i * .09, glock(n, 2.5), .05, pan=(i - 1.5) * .3)
# room reverb
ir_t = np.arange(int(1.6 * SR)) / SR
ir = lp(rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .45), 5000); ir /= np.sqrt(np.sum(ir ** 2))
wet = np.stack([fftconvolve(music[:, ch], ir)[:N] for ch in range(2)], 1)
music += wet * .22
t_all = np.arange(N) / SR
music *= np.interp(t_all, [0, .4, nt(12.2) - .2, nt(12.2) + .3, nt(15.2) - .4, nt(15.2), 29.2, 30], [0, 1, 1, .72, .72, 1, 1, 0])[:, None]

# ---- soft SFX (no typing clicks, no pops) ----
def air(dur=1.0, lo=200, hi=1600):
    n = int(dur * SR); t = np.arange(n) / SR; s = rng.standard_normal(n); out = np.zeros(n); seg = 2400
    for j in range(0, n, seg):
        fc = lo + (hi - lo) * np.sin(np.pi * j / n) ** 1.5
        out[j:j + seg] = bp(s[j:j + seg], fc * .5, fc * 1.3)
    return out * np.sin(np.pi * t / dur) ** 2
def ting(note=93):
    n = int(1.4 * SR); t = np.arange(n) / SR; fr = f(note)
    return (np.sin(2*np.pi*fr*t) + .3*np.sin(2*np.pi*fr*2.01*t)*np.exp(-t/.3)) * np.exp(-t / .5) * np.minimum(1, t/.002)
def felt_thump():
    n = int(.5 * SR); t = np.arange(n) / SR; fr = 70 + 40 * np.exp(-t / .03)
    return np.sin(2*np.pi*np.cumsum(fr)/SR) * np.exp(-t / .09) + lp(rng.standard_normal(n), 300) * np.exp(-t / .03) * .3
def shimmer(dur=2.0):
    out = np.zeros(int(dur * SR))
    for i, nn in enumerate([86, 90, 93, 98, 102, 105]):
        g = ting(nn); st = int(i * .07 * SR); out[st:st + len(g)] += g[: len(out) - st] * .35
    return out

for old, d, g in [(3.4, 1.3, .2), (7.2, 1.4, .2), (12.2, 1.1, .14), (15.2, 1.1, .14)]:
    add(sfx, nt(old) - d * .55, air(d), g)                             # scene transitions
for old, note in [(9.0, 88), (10.3, 91), (11.5, 93)]:                  # info cards appear
    add(sfx, nt(old), ting(note), .08, .3)
add(sfx, nt(13.35), ting(95), .07)                                     # "+" in pill
add(sfx, nt(14.7), felt_thump(), .32)                                  # ebook lands
add(sfx, nt(16.4) - .5, air(1.0, 300, 2600), .1)                       # circle wipe
add(sfx, nt(16.75), shimmer(2.0), .13)                                 # end card

mix = music * .85 + sfx
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.max(np.abs(mix)) / .89
with wave.open('renders/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
