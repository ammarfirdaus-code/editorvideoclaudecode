"""Lagu + kesan bunyi untuk iklan Benang Muafakat (35 s), disintesis sendiri (tiada sampel, tiada lesen pihak ketiga).

Struktur ikut lagu video rujukan (dianalisis dengan spektrogram, bukan disalin):
  0.00–3.45  intro: petikan terang mengikut aksi (setiap batang logo = satu nota)
  3.45–3.95  JEDA senyap, satu "pop"
  3.95–13.38 bahagian ringan: petikan gitar kecil, glockenspiel pada barang muncul, wisel masuk di babak sukarelawan
 13.38–30.00 BAND PENUH masuk bila kotak mendarat di troli: dram, bass, strum, melodi wisel
 19.60–22.35 dram separuh (babak serahan di pintu)
 30.00–35.00 muzik berhenti; hanya bunyi kad QR dan loceng
Tempo 90 BPM, C major, I–V–vi–IV. Guna: python3 music.py [output.wav]
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 35.0
BEAT = 60 / 90
BAR = 4 * BEAT
N = int(SR * DUR)
rng = np.random.default_rng(11)
mix = np.zeros((N, 2))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    mix[i:i + len(sig), 0] += sig * (1 - max(pan, 0))
    mix[i:i + len(sig), 1] += sig * (1 + min(pan, 0))


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def pluck(m, sec=0.9, bright=1.0):
    """Petikan gitar kecil: harmonik bertindih, harmonik tinggi reput lebih cepat."""
    t = tt(sec); f = hz(m); s = np.zeros_like(t)
    for k in range(1, 9):
        s += (bright ** (k - 1)) / k * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + 2.2 * k))
    return s * np.minimum(t / 0.002, 1) * 0.6


def glock(m, sec=1.4):
    t = tt(sec); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + .15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return s * np.exp(-t * 2.6) * np.minimum(t / 0.001, 1) * .5


def whistle(m, sec):
    """Wisel: sinus dengan vibrato lembut dan sedikit bunyi nafas."""
    t = tt(sec); f = hz(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.6 * t) * np.minimum(t / .25, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    env = np.minimum(t / .035, 1) * np.minimum((sec - t) / .06, 1).clip(0, 1)
    breath = np.convolve(rng.standard_normal(len(t)), np.ones(6) / 6, "same") * .03
    return (np.sin(ph) + .08 * np.sin(2 * ph) + breath) * env * .5


def bass(m, sec=0.5):
    t = tt(sec); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t)
    return s * np.exp(-t * 3.2) * np.minimum(t / .004, 1) * .55


def kick():
    t = tt(.32); f = 120 * np.exp(-t / .035) + 46
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .11)


def clap():
    t = tt(.22); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0)
    env = np.exp(-t / .045) * (1 + .6 * (np.sin(2 * np.pi * 90 * t) > .7))
    return n * env * .35


def hat(sec=.05):
    t = tt(sec); n = np.diff(np.diff(rng.standard_normal(len(t)), prepend=0), prepend=0)
    return n * np.exp(-t / .012) * .12


def pad(ms, sec):
    t = tt(sec); s = sum(np.sin(2 * np.pi * hz(m) * t + i) for i, m in enumerate(ms)) / len(ms)
    return s * np.clip(np.minimum(t / .5, (sec - t) / .6), 0, 1)


def pop(f0=900, f1=280, sec=.16):
    t = tt(sec); f = f1 + (f0 - f1) * np.exp(-t / .025)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .05)


def tok(f=1500):  # ketukan jari
    t = tt(.07)
    return (np.sin(2 * np.pi * f * t) + .5 * np.diff(rng.standard_normal(len(t)), prepend=0)) * np.exp(-t / .012) * .6


def swish(sec=.5, up=True):
    t = tt(sec); n = rng.standard_normal(len(t))
    k = np.linspace(80, 6, len(t)).astype(int) if up else np.linspace(6, 80, len(t)).astype(int)
    out = np.zeros_like(n); cs = np.cumsum(np.insert(n, 0, 0))
    idx = np.arange(len(n)); lo = np.maximum(idx - k, 0)
    out = (cs[idx + 1] - cs[lo]) / np.maximum(idx + 1 - lo, 1)
    return out * np.sin(np.linspace(0, np.pi, len(t))) ** 2 * 3


def swoop(f0, f1, sec):  # wisel meluncur (lambung / jatuh)
    t = tt(sec); f = f0 * (f1 / f0) ** (t / sec)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(t))) * .4


def thump():
    t = tt(.3); f = 90 * np.exp(-t / .05) + 40
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.convolve(rng.standard_normal(len(t)), np.ones(30) / 30, "same")) * np.exp(-t / .09)


def crash(sec=2.0):
    t = tt(sec); n = np.diff(rng.standard_normal(len(t)), prepend=0)
    return n * np.exp(-t / .6) * .18


CH = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
RT = [36, 43, 45, 41]
MEL = [[(84, 1), (88, .5), (86, .5), (84, 1), (79, 1)],
       [(79, 1), (83, .5), (86, .5), (86, 1), (83, 1)],
       [(81, 1), (84, .5), (88, .5), (86, 1), (84, 1)],
       [(81, .5), (84, .5), (86, 1), (84, 2)]]

# ---------- Intro: setiap batang logo mendarat = satu nota menaik ----------
for i, m in enumerate([72, 74, 76, 79, 81, 84, 86, 88]):
    add(pluck(m, .7, 1.1), .55 + i * .07, .32, pan=-.4 + i * .1)
for k, (t, m) in enumerate([(1.36, 91), (1.52, 88), (1.62, 91), (1.68, 93)]):  # manik melantun
    add(glock(m, .5), t, .18 - k * .03)
add(swish(.6), 1.0, .07)                                      # tangan masuk
add(glock(96, .8), 1.85, .14)                                 # manik disentuh
add(pad((60, 67, 76), 2.2), 1.2, .05)                          # alas lembut intro
add(swoop(1400, 420, .3), 2.62, .5)                            # logo dipampat
for i in range(4):
    add(tok(900 + i * 220), 2.8 + i * .14, .35)                # segmen loading
add(swish(.45), 3.35, .12)                                     # jalur naik menutup skrin
# JEDA senyap 3.45–3.95
add(pop(1100, 380, .18), 3.93, .45)

# ---------- Bahagian ringan (3.95–13.38) ----------
t0 = 3.95; bar = 0
while t0 < 13.38 - .01:
    ch = CH[bar % 4]
    for k, idx in enumerate([0, 1, 2, 1, 0, 2, 1, 2]):
        tk = t0 + k * BEAT / 2
        if tk < 13.3:
            add(pluck(ch[idx] + 12, .8, .9), tk, .16, pan=(-.25 if k % 2 else .25))
    add(bass(RT[bar % 4] + 12, 1.2), t0, .22)
    if t0 >= 6.6:
        for b in range(4):
            if t0 + b * BEAT + BEAT / 2 < 13.3:
                add(hat(.04), t0 + b * BEAT + BEAT / 2, .5, pan=.35)
    if t0 >= 9.3:  # melodi wisel masuk di babak sukarelawan
        tm = t0
        for m, d in MEL[bar % 4]:
            if tm + d * BEAT <= 13.0:
                add(whistle(m, d * BEAT * .92), tm, .2)
            tm += d * BEAT
    bar += 1; t0 += BAR

# Kesan bunyi babak stor
for t in (4.85, 6.15, 7.45):
    add(tok(), t, .5)                                          # jari menekan
add(swish(.4), 4.95, .08)                                      # warna banjir
for t, m in ((4.95, 84), (5.07, 88)):
    add(glock(m), t, .2)                                       # barang muncul
add(swish(.35, False), 6.25, .1)                               # sisi tegak meluncur
for t, m in ((6.25, 86), (6.35, 89), (6.45, 93)):
    add(glock(m), t, .18)
for i in range(5):
    add(pop(700 - i * 60, 220, .12), 7.95 + i * .06, .28)      # barang masuk kotak
add(thump(), 8.2, .35)                                         # penutup kotak
add(swoop(500, 1500, .2), 8.45, .25)                           # reben diikat
add(glock(96, 1.2), 8.78, .2)                                  # riben
add(swish(.6), 9.1, .1)                                        # zum ke kotak

# ---------- Lambung kotak → kiub → mendarat (12.0–13.38) ----------
add(swoop(500, 1600, .35), 12.08, .4)                          # "hup!" kotak dilambung
add(swish(1.1), 12.3, .14)                                     # kiub berpusing di celah jalur
for i in range(6):
    add(tok(1800 + i * 120), 12.4 + i * .1, .12)               # kepak kiub
add(swoop(1500, 300, .36), 13.0, .38)                          # jatuh
add(thump(), 13.38, .6); add(crash(1.6), 13.38, .9)            # mendarat = band penuh masuk

# ---------- Band penuh (13.38–30.0) ----------
t0 = 13.38; bar = 0
END = 29.86
while t0 < END - .01:
    ch = CH[bar % 4]; calm = 19.6 <= t0 < 22.3
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= END:
            break
        if not calm or b in (0,):
            if b in (0, 2):
                add(kick(), tb, .55)
            if b in (1, 3) and not calm:
                add(clap(), tb, .5, pan=.1)
        for h in (0, .5):
            if tb + h * BEAT < END:
                add(hat(), tb + h * BEAT, .7 if h else .45, pan=.4)
        # strum gitar kecil pada setiap ketukan
        for j, m in enumerate(ch + (ch[0] + 12,)):
            add(pluck(m + 12, .45, .95), tb + j * .012, .11, pan=-.2)
        for h, mm in ((0, 0), (.5, 12 if b % 2 else 0)):
            if tb + h * BEAT < END:
                add(bass(RT[bar % 4] + mm, .32), tb + h * BEAT, .3)
    tm = t0
    for m, d in MEL[bar % 4]:
        if tm + d * BEAT <= END:
            add(whistle(m, d * BEAT * .92), tm, .27)
        tm += d * BEAT
    if bar % 2 == 0:
        add(glock(CH[bar % 4][2] + 24, 1.0), t0, .1)
    bar += 1; t0 += BAR

# Kesan bunyi bahagian penuh
add(swish(.7), 19.15, .12)                                     # zum ke pintu
add(glock(91), 21.1, .14)                                      # hati di pintu
add(swish(.4, False), 22.4, .1)                                # pintu menjadi pinggan
add(pop(1600, 1300, .1), 22.95, .3)                            # pinggan "ting"
add(swish(.5), 24.8, .1)                                       # mengecil jadi kad
add(swoop(700, 1400, .25), 26.72, .25)                         # kad berpusing
add(tok(1400), 28.48, .55)                                     # jari menekan logo
add(swoop(1400, 500, .28), 29.55, .35)                         # logo dipampat
add(swish(.3), 29.84, .14)

# Pukulan penutup lagu, kemudian berhenti
add(kick(), 29.86, .7); add(crash(2.4), 29.86, 1.0)
for j, m in enumerate((48, 60, 64, 67, 72)):
    add(pluck(m, 2.0, 1.0), 29.86 + j * .015, .2)

# ---------- QR: hampir senyap ----------
add(thump(), 30.95, .35)                                       # kad mendarat pada tali
add(glock(84, 1.6), 31.0, .2); add(glock(91, 1.6), 31.15, .15)
add(pad((60, 64, 67, 72), 3.8), 31.0, .035)
add(glock(96, .8), 33.2, .12)                                  # manik berdenyut

fade = np.ones(N); fn = int(.8 * SR); fade[-fn:] = np.linspace(1, 0, fn)
mix *= fade[:, None]
# Kekuatan ~-16 LUFS seperti rujukan: naikkan gain, kemudian pengehad lembut (tanh), puncak sebenar bawah -1 dBTP
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.9) / np.tanh(1.9) * 10 ** (-2.6 / 20)
out = sys.argv[1] if len(sys.argv) > 1 else "assets/music.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("siap:", out)
