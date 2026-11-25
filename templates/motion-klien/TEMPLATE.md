# Iklan motion graphic klien (`motion-klien`)

Skill rujukan: `video-motion-graphic-klien` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, 30fps, 15/30/60s

## Enjin
1. AMMARCREAVA CREATIVE/07_Templates/video-motion-graphic-engine/ (vo_fit.py, render.js, events.js, sfx.py, music_peak.py, mix.sh, template_smatt_index.html)

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Tema dan palet diambil dari poster/brosur klien.
- Tajuk ≥84px, badan ≥40px. Teks emas mesti ada drop-shadow. Peralihan chevron navy.

## Struktur
Fasa 1 brief 11 soalan → storyboard (Masa | Visual | Teks | VO) + prompt VO AI Studio (2 kotak) + prompt Suno → tunggu VO dan lagu dari klien → render dengan SFX setiap animasi → CTA.

## Peraturan khas
- ~2.2 patah perkataan sesaat. Tanda ketidakkonsistenan dalam bahan klien (nombor telefon, data lapuk).
- Institusi tahfiz/agama: beri pilihan lagu tanpa alat muzik.
- Simpan dalam folder projek klien.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
