"""Muzik latar + kesan bunyi untuk iklan Benang Muafakat (30 s), disintesis sendiri.

Tiada sampel atau lesen pihak ketiga. Guna: python3 music.py [output.wav]
Rentak 100 BPM, progresi I-V-vi-IV dalam C major, marimba + bass + perkusi ringan.
Perkusi diperlahankan semasa babak serahan di pintu (19.6-22.6 s), babak emosi utama.
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 30.0
BPM = 100
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)

mix = np.zeros((N, 2))


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    mix[i:i + len(sig), 0] += sig * (1 - max(pan, 0))
    mix[i:i + len(sig), 1] += sig * (1 + min(pan, 0))


def env(n, attack=0.005, decay=0.35):
    t = np.arange(n) / SR
    a = np.minimum(t / attack, 1.0)
    return a * np.exp(-t / decay)


def marimba(midi, length=0.9):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.05)
    return s * env(n, 0.003, 0.28)


def pluck_bass(midi, length=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return s * env(n, 0.01, 0.45)


def pad(midis, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * hz(m) * t + i) for i, m in enumerate(midis)) / len(midis)
    a = np.minimum(t / 0.4, 1.0) * np.minimum((length - t) / 0.4, 1.0)
    return s * np.clip(a, 0, 1)


def kick():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 110 * np.exp(-t / 0.04) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)


def shaker(length=0.06):
    n = int(length * SR)
    s = rng.standard_normal(n)
    s = np.diff(s, prepend=0)  # tapis lulus tinggi ringkas
    return s * env(n, 0.002, 0.018)


def chime(midi):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.3)
    return s * env(n, 0.002, 0.6)


def plop(f0=900, f1=280, length=0.18):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.06)


def whoosh(length=0.6):
    n = int(length * SR)
    s = rng.standard_normal(n)
    k = 60
    s = np.convolve(s, np.ones(k) / k, mode="same")  # tapis lulus rendah
    w = np.sin(np.linspace(0, np.pi, n)) ** 2
    return s * w * 3


# Progresi I-V-vi-IV (C, G, Am, F), satu bar (4 ketukan) setiap kord
CHORDS = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
ROOTS = [36, 43, 45, 41]
BAR = 4 * BEAT
ARP = [0, 1, 2, 1, 0, 2, 1, 2]  # corak arpeggio not kuaver
CALM = (19.6, 22.6)
END = 28.4

bar = 0
t0 = 0.0
while t0 < END:
    ch = CHORDS[bar % 4]
    calm = CALM[0] <= t0 < CALM[1]
    add(pad(ch, BAR + 0.3), t0, 0.07)
    add(pluck_bass(ROOTS[bar % 4]), t0, 0.32)
    add(pluck_bass(ROOTS[bar % 4]), t0 + 2 * BEAT, 0.22)
    for k, idx in enumerate(ARP):
        tk = t0 + k * BEAT / 2
        if tk >= END:
            break
        note = ch[idx] + (12 if k in (3, 6) else 0)
        add(marimba(note), tk, 0.22 if not calm else 0.17, pan=(-0.3 if k % 2 else 0.3))
    if not calm:
        for b in range(4):
            if b in (0, 2):
                add(kick(), t0 + b * BEAT, 0.45)
            add(shaker(), t0 + b * BEAT + BEAT / 2, 0.08, pan=0.4)
    bar += 1
    t0 += BAR

# Kord penutup
add(pad((48, 60, 64, 67, 72), 1.9), END, 0.12)
add(pluck_bass(36, 1.6), END, 0.35)
for k, m in enumerate((72, 76, 79, 84)):
    add(marimba(m, 1.2), END + k * 0.08, 0.2)

# Kesan bunyi, diselaraskan dengan index.html
for i in range(8):
    add(plop(1100, 700, 0.06), 0.55 + i * 0.07, 0.18)  # batang logo mendarat
add(plop(), 1.6, 0.35)                       # manik jatuh
add(whoosh(0.5), 3.25, 0.12)                 # jalur warna menyapu
for t in (4.9, 6.2, 7.5):
    add(plop(1400, 600, 0.08), t, 0.4)       # jari menekan
for t in (4.95, 5.07, 6.25, 6.35, 6.45):
    add(plop(500, 180, 0.12), t, 0.3)        # barang muncul di rak
add(chime(84), 8.75, 0.18)                   # reben terikat
for t in (9.1, 12.4, 19.15, 22.35, 25.0, 27.15):
    add(whoosh(), t, 0.11)                   # peralihan babak
add(chime(79), 21.1, 0.15)                   # hati di pintu
add(plop(900, 500, 0.1), 23.05, 0.3)         # pinggan diletak
add(chime(88), 27.6, 0.18)                   # logo muncul
add(plop(1400, 600, 0.08), 28.48, 0.45)      # jari menekan logo

# Fade keluar 1 s terakhir dan normalkan ke puncak -1 dBFS
fade = np.ones(N)
fn = int(1.0 * SR)
fade[-fn:] = np.linspace(1, 0, fn)
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) / 10 ** (-1 / 20)

out = sys.argv[1] if len(sys.argv) > 1 else "renders/music.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("siap:", out)
