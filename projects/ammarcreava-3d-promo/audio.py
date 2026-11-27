# Music bed + soft SFX for the 30 s cut. Output: renders/audio.wav
# Style: warm felt piano, plucked strings, glockenspiel, light percussion (uplifting documentary).
import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; DUR = 27.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# timeline warp (same keyframes as main.js): old 18 s event times -> new 30 s times
BEAT = 60 / 117.45; B0 = 0.07; BAR = 4 * BEAT
def bar(k): return B0 + k * BAR
WN = [0, bar(2), bar(4), bar(5), bar(6), bar(7), bar(8), bar(9.25), bar(9.5), bar(10.5), bar(10.5) + 1.1, 27]; WO = [0, 3.4, 7.2, 8.5, 9.8, 11.0, 12.2, 14.7, 15.2, 16.75, 17.5, 18]
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

# ---- music: "Inspired" by Kevin MacLeod (incompetech.com), CC BY 4.0 ----
# Bars 0-10 straight from the top of the track, then a beat-matched crossfade into the
# track's ending so its final hit lands on bar 12 (the button click on the end card).
import subprocess
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'assets/music/Inspired.mp3', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
song = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)
XF = bar(10); HIT_SRC = 272.07; B_SRC = HIT_SRC - (bar(12) - XF)        # 267.98 s, also on the beat grid
fade = int(.12 * SR); iX = int(XF * SR)
music[:iX + fade] = song[:iX + fade]
tail = song[int(B_SRC * SR): int(B_SRC * SR) + (N - iX)]
ramp = np.linspace(0, 1, fade)[:, None]
music[iX:iX + fade] = music[iX:iX + fade] * (1 - ramp) + tail[:fade] * ramp
music[iX + fade:iX + len(tail)] = tail[fade:]
t_all = np.arange(N) / SR
music *= np.interp(t_all, [0, .05, 26.3, 27], [0, 1, 1, 0])[:, None]
music *= .62
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

for old, d, g in [(3.4, .9, .16), (7.2, 1.0, .16), (12.2, .8, .12), (15.2, .8, .12)]:
    add(sfx, nt(old) - d * .55, air(d), g)                             # scene transitions
for old, note in [(9.0, 88), (10.3, 91), (11.5, 93)]:                  # info cards appear
    add(sfx, nt(old), ting(note), .08, .3)
add(sfx, nt(13.35), ting(95), .07)                                     # "+" in pill
add(sfx, nt(14.7), felt_thump(), .32)                                  # ebook lands
add(sfx, nt(16.4) - .5, air(1.0, 300, 2600), .1)                       # circle wipe
add(sfx, nt(16.75), shimmer(2.0), .1)                                 # end card

# 0:02 key tiles burst out of the phone: soft wooden marimba plinks (pentatonic D), quiet
def marimba(note):
    n = int(.6 * SR); t = np.arange(n) / SR; fr = f(note)
    return (np.sin(2*np.pi*fr*t) + .3*np.sin(2*np.pi*fr*4*t)*np.exp(-t/.03)) * np.exp(-t / .16) * np.minimum(1, t / .002)
penta = [74, 76, 78, 81, 83, 86, 88, 90]
for i in range(16):
    tt = nt(1.0) + i * .085 + rng.uniform(0, .03)
    add(sfx, tt, marimba(penta[i % 8] + (0 if i < 8 else 12)), .05, rng.uniform(-.7, .7))
add(sfx, nt(1.0) - .15, air(1.1, 300, 2200), .07)
# 0:06 typing in the prompt bar: soft laptop keys
def key():
    n = int(.05 * SR); t = np.arange(n) / SR
    click = bp(rng.standard_normal(n), 1800, 6000) * np.exp(-t / .004)
    thock = np.sin(2 * np.pi * rng.uniform(170, 230) * t) * np.exp(-t / .012) * .6
    return click * .7 + thock
q = 'Buat video dokumentari...'
for i, ch in enumerate(q):
    tt = nt(4.0 + i / 16)
    if ch != ' ': add(sfx, tt + rng.uniform(-.012, .012), key(), .12 * rng.uniform(.75, 1.1), rng.uniform(-.15, .15))
    else: add(sfx, tt, key() * 1.2, .13)                                # space bar slightly heavier
# 0:30 button click
def mouse_click():
    n = int(.06 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2500, 8000) * np.exp(-t / .003) + np.sin(2*np.pi*900*t) * np.exp(-t / .006) * .3
add(sfx, bar(12) - .02, mouse_click(), .3)

mix = music + sfx
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.max(np.abs(mix)) / .89
with wave.open('renders/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
