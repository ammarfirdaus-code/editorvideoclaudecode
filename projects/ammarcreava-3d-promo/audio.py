# Synthesises music bed + SFX matched to the timeline in main.js. Output: renders/audio.wav
import numpy as np, wave
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 18.0; N = int(SR * DUR)
rng = np.random.default_rng(4)
t_all = np.arange(N) / SR
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR); sig = sig[: max(0, N - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414; buf[i:i + len(sig), 1] += sig * gain * r * 1.414

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def f(note): return 440 * 2 ** ((note - 69) / 12)
def bell(note, dur=1.6, d=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; fr = f(note)
    s = np.sin(2*np.pi*fr*t) + .35*np.sin(2*np.pi*fr*2.0*t)*np.exp(-t/.15) + .2*np.sin(2*np.pi*fr*3.01*t)*np.exp(-t/.08)
    return s * env(n, .002, d)
def pad(notes, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for nt in notes:
        for det in (-0.08, 0.0, 0.08):
            fr = f(nt + det); s += np.sin(2*np.pi*fr*t + np.sin(2*np.pi*0.3*t)) * .5 + .15*np.sin(2*np.pi*2*fr*t)
    a = np.minimum(1, t / .5) * np.minimum(1, (dur - t) / .6)
    return s * a / len(notes)
def noise(n): return rng.standard_normal(n)
def lp(x, fc): return sosfilt(butter(2, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc): return sosfilt(butter(2, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

# ---------- music: 120 bpm, I–vi–IV–V in C, bar = 2 s ----------
BPM = 120; beat = 60 / BPM
chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 69]]
for b in range(9):
    c = chords[b % 4]
    add(music, b * 2, pad([n - 12 for n in c], 2.15), .16 if b < 2 else .2)
    # bass
    n = int(2 * SR); tt = np.arange(n) / SR; bass = np.sin(2*np.pi*f(c[0]-24)*tt) * env(n, .01, .9)
    if b >= 1: add(music, b * 2, bass, .32)
# bell arpeggios (sparkly, festive) from 0.9
arp = [0, 2, 1, 3, 2, 1, 3, 2]
for i in range(int((16.6 - 0.9) / (beat / 2))):
    tt = 0.9 + i * beat / 2; c = chords[int(tt // 2) % 4]
    add(music, tt, bell(c[arp[i % 8]] + 12, 1.2, .35), .10 if tt < 3.4 else .13, pan=(-.4 if i % 2 else .4))
# drums from 3.4: soft kick on beats, shaker 8ths, clap on 2 & 4
def kick():
    n = int(.35 * SR); tt = np.arange(n) / SR; fr = 50 + 90 * np.exp(-tt / .03)
    return np.sin(2*np.pi*np.cumsum(fr)/SR) * env(n, .001, .12)
def shaker(): n = int(.08 * SR); return hp(noise(n), 6000) * env(n, .002, .02)
def clap(): n = int(.25 * SR); return bp(noise(n), 900, 3500) * env(n, .001, .07)
k = 3.4
while k < 16.3:
    bi = round((k - 3.4) / beat)
    add(music, k, kick(), .55)
    if bi % 2 == 1: add(music, k, clap(), .18)
    add(music, k, shaker(), .06, .3); add(music, k + beat / 2, shaker(), .09, -.3)
    k += beat
# break at Kami (12.2-13.9 lighter) handled by gain automation below; final chord
add(music, 16.75, pad([48, 60, 64, 67, 72, 76], 1.25), .3)
for i, nt in enumerate([72, 76, 79, 84, 88]):
    add(music, 16.75 + i * .06, bell(nt, 1.25, .6), .12, pan=(i - 2) * .25)
# gain automation: dip under Kami line, fade out at end
g = np.ones(N)
g *= np.interp(t_all, [0, 12.1, 12.3, 13.9, 14.3, 17.4, 18], [1, 1, .55, .55, 1, 1, 0])
music *= g[:, None]

# ---------- SFX ----------
def tick(): n = int(.03 * SR); return bp(noise(n), 2500, 7000) * env(n, .0005, .006)
def pop(pitch=1.0):
    n = int(.12 * SR); tt = np.arange(n) / SR; fr = (500 + 900 * np.exp(-tt / .015)) * pitch
    return np.sin(2*np.pi*np.cumsum(fr)/SR) * env(n, .001, .03)
def whoosh(dur=.7, lo=300, hi=3000):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = noise(n); out = np.zeros(n); seg = 2048
    for j in range(0, n, seg):
        x = j / n; fc = lo + (hi - lo) * np.sin(np.pi * x)
        out[j:j+seg] = bp(s[j:j+seg], fc * .6, fc * 1.4)
    return out * np.sin(np.pi * tt / dur) ** 2
def thud():
    n = int(.4 * SR); tt = np.arange(n) / SR; fr = 40 + 70 * np.exp(-tt / .04)
    return np.sin(2*np.pi*np.cumsum(fr)/SR) * env(n, .001, .15) + lp(noise(n), 400) * env(n, .001, .05) * .5
def shimmer(dur=1.2):
    out = np.zeros(int(dur * SR))
    for i in range(14):
        b = bell(84 + rng.integers(0, 12), dur, .25); st = int(i * .05 * SR); out[st:] += b[: len(out) - st] * .3
    return out

for i in range(len('Hai AI...')): add(sfx, .9 + i / 11, tick(), .35, rng.uniform(-.2, .2))
for i in range(len('Idea video untuk bisnes saya...')): add(sfx, 4.0 + i / 16, tick(), .25, rng.uniform(-.2, .2))
for i in range(14): add(sfx, 1.0 + rng.uniform(0, .5), pop(rng.uniform(.8, 1.5)), .18, rng.uniform(-.8, .8))
for tt, d, gn in [(3.15, .6, .5), (6.95, .65, .5), (11.95, .55, .4), (14.95, .55, .4), (16.3, .8, .45)]:
    add(sfx, tt, whoosh(d), gn)
for tt in (8.95, 10.25, 11.45): add(sfx, tt, pop(1.2), .4)
add(sfx, 12.5, whoosh(.5, 600, 4000), .35, .5)
add(sfx, 13.3, pop(1.6), .45)
add(sfx, 14.7, thud(), .8)
add(sfx, 16.8, shimmer(1.2), .35)

mixd = music * .7 + sfx * .9
mixd = np.tanh(mixd * 1.2) / 1.2
mixd /= np.max(np.abs(mixd)) / 0.89
pcm = (mixd * 32767).astype('<i2')
with wave.open('renders/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
