# Iklan testimoni (`ads-testimoni`)

Skill rujukan: `ads-testimoni` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, ~30s

## Enjin
Ikut skill ads-testimoni.

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Hook atas muka penutur: kotak gelap + kotak merah besar 2 baris. Sari kata, lower third nama panggilan, gambar bukti berlabel, end card QR.

## Struktur
Hook 1.4s → testimoni penuh bersari kata → gambar bukti berlabel → CTA "JOM INFAK" → end card QR + akaun.

## Peraturan khas
- Tanya dulu: perkataan tak jelas, kebenaran penutur dan pesakit, siapa dalam gambar sokongan, tabung mana.
- Testimoni tidak diselang gambar lain. Kaburkan muka pesakit terlantar dan kanak-kanak.
- QR dan nombor akaun jangan masuk git.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
