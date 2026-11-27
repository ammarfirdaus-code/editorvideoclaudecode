# Ammarcreava.my: video promo komersial (3 tema)

Tiga video 9:16 (1080×1920, 30fps) untuk TikTok, Reels dan Shorts, dibina dengan HTML + GSAP dan dirender frame demi frame.

| Folder | Tema | Fokus | Durasi |
|---|---|---|---|
| `a/` | Neon Kinetik | Ketiga-tiga produk (ebook, servis video, coaching) | ~28s |
| `b/` | Masalah → Penyelesaian | Ebook untuk pemula | ~28s |
| `c/` | Editorial Premium | Coaching dan latihan organisasi | ~34s |

## Audio (percuma, tiada lesen pihak ketiga)
- **Suara latar:** `facebook/mms-tts-zlm` (Meta MMS, model TTS Bahasa Melayu sumber terbuka) yang dijalankan secara lokal. Frasa dijana satu-satu, jadi masa setiap kapsyen dan babak adalah tepat.
- **Muzik:** disintesis secara prosedur oleh `build_music.py` (bebas royalti).

## Jana semula
Keperluan: torch (CPU), transformers dan scipy untuk TTS; ffmpeg; Playwright/Chromium.

```bash
python3 build_vo.py a:1.1 b:1.05 c:0.95   # vo.wav + timeline.json setiap tema
python3 build_music.py a 28.5 b 28 c 33.5  # music.wav setiap tema
node render.js a                           # -> a/ammarcreava-promo-a.mp4
node render.js a --stills 2,8,15           # semak frame pantas
```

Teks kapsyen ada dalam `*/phrases.json` (`text` dipaparkan, `tts` disebut). Untuk tukar suara kepada ElevenLabs atau rakaman sendiri, ganti `vo.wav` dan kemas kini masa `start`/`end` dalam `timeline.json`.

Aset (logo, kulit ebook, logo klien, thumbnail video) diambil dari laman ammarcreava.my sendiri.
