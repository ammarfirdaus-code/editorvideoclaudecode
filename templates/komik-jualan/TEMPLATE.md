# Cerita komik soft sell (`komik-jualan`)

Skill rujukan: `video-cerita-komik-jualan` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, ±60s termasuk thumbnail 0.5s

## Enjin
02_Projects/2026-11-18 Ebook AI Duit & Urus Wang/04 Video/sumber/ (video01-scenes.html + render-video.py)

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Semua watak dan latar dilukis SVG dalam kod: watak Malaysia (Ali bersongkok, isteri bertudung berbaju kurung, kawan berbilang kaum), rumah teres, kedai mamak.
- Teks komik: .cap .box .big .huge .bubble .burst.

## Struktur
Thumbnail tersembunyi → hook masalah → cerita ringkas → titik jatuh → watak lain cetus perubahan → momen sedar → sebut produk sekali di hujung ("LINK DI BIO") + logo Ammarcreava.

## Peraturan khas
- JANGAN jana gambar. Hanya gambar sedia ada (cover, logo).
- Soft sell: jangan dedah isi ebook, tiada harga, tiada janji pendapatan.
- Copywriting TikTok + Threads gaya Ammar.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
