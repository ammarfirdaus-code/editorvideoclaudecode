# Video emosi infak (`video-emosi`)

Skill rujukan: `content-video-emosi` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, 30–40s

## Enjin
Ikut skill content-video-emosi (build_video_emosi.py + config.json).

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Teks hook 2 baris dengan highlight kuning, teks keluar dengan bunyi, muzik sedih, logo asal dikaburkan, kad penutup QR.

## Struktur
Hook "BAYANGKAN / INI ANAK ANDA..." → 4–5 babak cerita → "Cuma jangan lupakan mereka" → CTA "JOM BANTU MEREKA" → QR.

## Peraturan khas
- Jangan reka angka atau dakwaan. Tujuan dana mesti sepadan dengan klip.
- Klip TikTok orang lain: maklumkan risiko hak cipta dan iklan ditolak.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
