# PAS 75 Tahun: dokumentari ringkas

Video dokumentari sempena ulang tahun ke-75 PAS (24 November 1951 – 24 November 2026), dalam dua format:
16:9 (kira-kira 6 minit) dan Reels 9:16 (kira-kira 72 saat).

- `DRAF.md`: skrip dan struktur yang diluluskan.
- `SUMBER.md`: sumber setiap gambar dan rujukan fakta.
- `index.html`, `main.js`, `style.css`: enjin babak. `window.seek(t)` melukis bingkai pada saat `t`.
- `build/make_timeline.py`: masa babak dan sari kata, disauh pada perkataan narasi (Whisper).
- `build/make_slots.py`: padanan gambar kepada babak.
- `build/render_all.sh`, `build/render.js`: render bingkai dengan Chromium tanpa kepala dan FFmpeg.
- `build/mix.py`: campur narasi dan muzik, kemudian cantum pada video.

## Bina semula

```bash
python3 build/make_slots.py
python3 build/make_timeline.py
bash build/render_all.sh main /tmp/pas75 3
python3 build/mix.py main /tmp/pas75/main-video.mp4 muzik.mp3 out/dokumentari.mp4
```

Gambar arkib pihak ketiga (`assets/photos/*.jpg`) dan video akhir (`out/`) tidak disimpan dalam git.
Menukar muzik hanya perlukan langkah `mix.py`; video tidak perlu dirender semula.
