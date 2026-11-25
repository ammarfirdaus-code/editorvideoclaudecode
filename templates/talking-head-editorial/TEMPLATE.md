# Talking head editorial (`talking-head-editorial`)

Skill rujukan: `video-talking-head-editorial` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, ikut klip

## Enjin
00_CLAUDE_WORKSPACE/07_AI-INFLUENCER-POLITIK/02_PRODUCTION/_ENJIN/ (SKILL_video-talking-head-editorial.md + th_engine.py)

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Kapsyen per perkataan dalam stack (maks 3 baris), slide tipografi, kad berita, muzik + SFX, end card.

## Struktur
transcribe → betulkan words.json → potong jeda > 0.5s → config.json (spk, slide, pip, news, stacks) → preview → render → audio.

## Peraturan khas
- Jangan bina enjin dari kosong. Ambil th_engine.py dari Drive.
- Projek Kiara: tiada label "Video ini dijana AI"; end card "Follow @kiara.ulas" + baris sumber.
- Tiada siaran tanpa lulus Ammar.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
