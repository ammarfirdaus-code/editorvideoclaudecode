# Ammarcreava.my: video promo komersial (3 tema)

Tiga video 9:16 (1080×1920, 30fps) untuk TikTok, Reels dan Shorts, dibina dengan HTML + GSAP dan dirender frame demi frame.

| Folder | Tema | Fokus | Durasi |
|---|---|---|---|
| `a/` | Neon Kinetik | Ketiga-tiga produk (ebook, servis video, coaching) | ~27s |
| `b/` | Masalah → Penyelesaian | Ebook untuk pemula | ~31s |
| `c/` | Editorial Premium | Coaching dan latihan organisasi | ~34s |

## Audio (percuma, tiada lesen pihak ketiga)
- **Suara latar:** Google AI Studio, Gemini TTS (Gemini 3.8 Flash TTS, single-speaker), Bahasa Melayu loghat Malaysia.
  | Tema | Suara | Arahan gaya |
  |---|---|---|
  | A | Puck | Bahasa Melayu Malaysia, loghat Malaysia, gaya iklan TikTok, bertenaga, laju, yakin. |
  | B | Kore | Bahasa Melayu Malaysia, loghat Malaysia, mesra macam berbual, mula sedikit kecewa kemudian ceria. |
  | C | Charon | Bahasa Melayu Malaysia, loghat Malaysia, tenang, berwibawa, narator dokumentari korporat. |

  Skrip = semua frasa dalam `phrases.json` ikut urutan, guna medan `say` jika ada (sebutan: "Ammar Kriava", nombor dieja penuh), jika tiada guna `text`. A dan C diberi 0.3s senyap di depan.
- **Penyelarasan masa:** `align_vo.py` (faster-whisper `small`, cap masa perkataan) memadankan transkrip dengan skrip dan menulis `start`/`end` setiap frasa serta `duration` dalam `timeline.json`.
- **Muzik:** disintesis secara prosedur oleh `build_music.py` (bebas royalti), durasi = suara + ~2.5s.
- `build_vo.py` (Meta MMS `facebook/mms-tts-zlm`, lokal) masih ada sebagai pilihan luar talian.

## Jana semula
Keperluan: Python 3 + numpy + faster-whisper (dan scipy untuk muzik; ada fallback numpy jika `scipy.signal` disekat); ffmpeg; Playwright/Chromium.

```bash
# 1. Jana vo.wav setiap tema di AI Studio (jadual di atas), simpan sebagai {a,b,c}/vo.wav
python3 align_vo.py a b c                  # timeline.json ikut vo.wav
python3 build_music.py a 27.4 b 31.1 c 34.3  # music.wav setiap tema
node render.js a                           # -> a/ammarcreava-promo-a.mp4
node render.js a --stills 2,8,15           # semak frame pantas
```

Teks kapsyen ada dalam `*/phrases.json` (`text` dipaparkan, `say` disebut oleh Gemini, `tts` untuk MMS). Untuk tukar suara kepada rakaman sendiri, ganti `vo.wav` dan jalankan semula `align_vo.py`.

Aset (logo, kulit ebook, logo klien, thumbnail video) diambil dari laman ammarcreava.my sendiri.
