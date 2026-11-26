"""Campuran bunyi iklan Benang Muafakat (35 s): lagu + kesan bunyi Epidemic Sound.

Sumber (folder Google Drive pengguna, dikongsi oleh pemilik lesen Epidemic Sound):
  assets/audio/lagu-bumper-car-ride.mp3   "Bumper Car Ride" - The Fly Guy Five
  assets/audio/sfx/*.mp3                   kesan bunyi Epidemic Sound (nama fail diringkaskan)

Struktur ikut video rujukan:
  0.00–3.35  lagu diredam & jauh (lowpass), kesan bunyi logo di depan
  3.45–3.93  senyap (jeda "tarik nafas"), satu pop
  3.95–13.2  lagu sederhana kuat di babak stor & sukarelawan
 12.70–13.20 jeda asal lagu jatuh semasa kiub jatuh
 13.38       lagu masuk semula kuat tepat bila kotak mendarat di troli (sejajar 37.53 s dalam lagu)
 19.5–22.6   lagu direndahkan sedikit di babak pintu
 29.6–30.0   lagu berhenti; babak QR hanya kesan bunyi
Setiap kesan bunyi diletak supaya titik puncaknya jatuh tepat pada aksi di skrin.
Guna: python3 sound.py [output.wav]
"""
import subprocess, sys, wave
import numpy as np

SR = 44100
DUR = 35.0
N = int(SR * DUR)
SONG = "assets/audio/lagu-bumper-car-ride.mp3"
SONG_OFFSET = 24.15          # masa video t ↔ masa lagu t + 24.15 (37.53 s lagu = 13.38 s video)
SFX = "assets/audio/sfx/"


def load(path, start=0.0, length=None, extra=()):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)]
    if length:
        cmd += ["-t", str(length)]
    cmd += ["-i", path, *extra, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)


def db(x):
    return 10 ** (x / 20)


# ---------------- Lagu dengan automasi gain dan redaman ----------------
song = load(SONG, SONG_OFFSET, DUR)
song_lp = load(SONG, SONG_OFFSET, DUR, extra=("-af", "lowpass=f=900,lowpass=f=900"))
song = np.pad(song, ((0, max(0, N - len(song))), (0, 0)))[:N]
song_lp = np.pad(song_lp, ((0, max(0, N - len(song_lp))), (0, 0)))[:N]
t = np.arange(N) / SR
# titik (masa, gain dB) dan (masa, campuran lowpass 0..1), diinterpolasi linear
G = [(0, -40), (.35, -11), (3.35, -11), (3.45, -70), (3.88, -70), (3.95, -6), (13.2, -6), (13.38, 0),
     (19.5, 0), (19.8, -3), (22.3, -3), (22.6, 0), (29.6, 0), (30.0, -80), (35, -80)]
L = [(0, 1), (3.35, 1), (3.88, 0), (35, 0)]
gain = db(np.interp(t, [p[0] for p in G], [p[1] for p in G]))
lp = np.interp(t, [p[0] for p in L], [p[1] for p in L])
mix = (song * (1 - lp)[:, None] + song_lp * lp[:, None]) * gain[:, None]

# ---------------- Kesan bunyi ----------------
_cache = {}


def cue(at, name, hit, gain_db=0.0, start=0.0, length=None, pitch=0.0, pan=0.0):
    """Letak kesan bunyi supaya titik `hit` (saat dalam potongan) jatuh pada masa video `at`."""
    key = (name, start, length)
    if key not in _cache:
        _cache[key] = load(SFX + name + ".mp3", start, length)
    s = _cache[key]
    if pitch:  # anjak pic dengan sampel semula (bunyi pendek, perubahan tempo tidak ketara)
        r = 2 ** (pitch / 12)
        idx = np.arange(0, len(s) - 1, r)
        s = np.stack([np.interp(idx, np.arange(len(s)), s[:, c]) for c in (0, 1)], 1)
        hit = hit / r
    f = min(len(s), int(.02 * SR))
    s = s.copy(); s[-f:] *= np.linspace(1, 0, f)[:, None]
    s *= db(gain_db) * np.array([1 - max(pan, 0), 1 + min(pan, 0)])
    i = int((at - hit) * SR)
    if i < 0:
        s = s[-i:]; i = 0
    j = min(N, i + len(s))
    mix[i:j] += s[: j - i]


POPS = [0.02, 0.15, 0.31, 0.52, 0.68, 0.84]

# Pembuka: setiap batang logo mendarat = satu pop menaik
for k in range(8):
    cue(.58 + k * .07, "pops-x6", .012, -8, start=POPS[k % 6], length=.13, pitch=k * 1.5, pan=-.35 + k * .1)
cue(1.05, "swish-cemeti", .06, -6, start=2.80, length=.45)          # tangan masuk
cue(1.70, "boing-lompat", .057, -12)                                 # manik melantun mendarat
cue(1.86, "ting-tinggi", .002, 2)                                    # manik disentuh
cue(2.88, "rewind-piring", .54, -9)                                  # logo dipampat
for k in range(4):
    cue(2.86 + k * .14, "klik-bubbly", .034, 2, pitch=k * 2)         # segmen loading
cue(3.62, "whoosh-data", .49, 0)                                     # tirai naik
cue(3.95, "gelembung-pop", .068, -5)                                 # pop selepas jeda senyap

# Stor
for at in (4.95, 6.25, 7.55):
    cue(at, "hentak-kayu", .07, -6); cue(at, "klik-bubbly", .034, -4)   # jari menekan
cue(5.15, "kilauan-magik", .452, 4)                                  # warna banjir
for at, st, p in ((5.02, .02, 0), (5.14, .54, 3), (6.32, 1.00, 2), (6.44, 1.51, 5)):
    cue(at, "pop-kartun", .03, -9, start=st, length=.3, pitch=p)     # barang muncul
cue(6.38, "whoosh-data", .49, -1)                                    # dinding baharu meluncur
for k, st in enumerate((.01, .72, 1.32, .01)):
    cue(7.98 + k * .07, "gelembung-pop2", .02, -11, start=st, length=.35, pitch=k * 2)  # barang masuk kotak
cue(8.26, "hentak-belon", .084, -5)                                  # kotak ditutup
cue(8.52, "loceng-kayu", .063, -6)                                   # reben
cue(9.62, "whoosh-sederhana", .885, 1)                               # zum ke kotak

# Sukarelawan → kiub → troli
cue(12.28, "riser-whoosh", 2.87, -6)                                 # kamera meluru ke kotak
cue(12.42, "boing-komik", .05, -7, start=1.60, length=1.2)           # kotak jadi kiub
cue(12.80, "whoosh-angkasa", 1.141, -7)                              # kiub berpusing
cue(13.12, "swish-cemeti", .06, -7, start=3.15, length=.45)          # kiub jatuh
cue(13.38, "hentak-belon", .084, -2); cue(13.38, "hentak-kayu", .07, -4)  # mendarat di troli

# Perjalanan → pintu → hidangan
cue(19.62, "whoosh-zum", .792, -5)                                   # zum ke pintu
cue(21.12, "loceng-positif", .239, -9)                               # hati
cue(22.98, "swish-cemeti", .06, -7, start=1.62, length=.45)          # pintu berpusing
cue(23.30, "ting-tinggi", .002, 4)                                   # jadi pinggan
cue(25.08, "selak-muka", .229, 0)                                    # mengecil jadi kad
cue(26.76, "selak-buku", .10, -6, start=.25, length=.7)              # kad berpusing
cue(27.36, "whoosh-sederhana", .885, -7)                             # muka logo membesar

# Penutup
cue(28.56, "hentak-kayu", .07, -6); cue(28.56, "klik-bubbly", .034, -2)  # jari menekan logo
cue(28.64, "pop-kartun", .03, -10, start=.02, length=.3, pitch=4)    # butang muncul
cue(29.84, "rewind-piring", .54, -9)                                 # logo dipampat jadi batang
cue(30.02, "whoosh-data", .49, -2)                                   # batang memenuhi skrin

# QR
cue(31.10, "hentak-belon", .084, -1)                                 # kad mendarat pada tali
cue(31.18, "kaching", .369, 0)                                      # infak
cue(33.20, "loceng-basikal", .007, 7)                                # manik berdenyut

# ---------------- Kekuatan akhir: ~-16 LUFS, puncak bawah -1 dBTP ----------------
mix /= max(1e-9, np.max(np.abs(mix)))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
out = sys.argv[1] if len(sys.argv) > 1 else "assets/music.wav"
tmp = out + ".tmp.wav"
with wave.open(tmp, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
# ukur kekuatan sebenar (EBU R128), kemudian laraskan gain tepat ke -16 LUFS
meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float([l for l in meas.splitlines() if l.strip().startswith("I:")][-1].split()[1])
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"volume={-16 - I:.2f}dB", "-ar", str(SR), out], check=True)
subprocess.run(["rm", "-f", tmp])
print("siap:", out)
