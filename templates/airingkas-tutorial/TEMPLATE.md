# Tutorial airingkas (`airingkas-tutorial`)

Skill rujukan: `video-pembelajaran-airingkas` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, 30fps, 30–60s

## Enjin
00_CLAUDE_WORKSPACE/01_AMMARCREAVA/02_PRODUCTION/_ENJIN/video-pembelajaran-airingkas/ (baca BACA_SAYA.md)

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
- Tema Creava: latar gelap ungu/pink, logo AF + wordmark ammarcreava, kapsyen besar di atas, bar siri + @ammarcreava di kaki, pil CTA airingkas.my.
- Kapsyen Montserrat 800, 68–76px, flex-wrap. Highlight pink solid #FF8FC4 dengan bayang gelap (jangan teks gradien).
- Teks kelabu paling malap #D4CFEE. Teks UI sekurang-kurangnya 36px.

## Struktur
Mod biasa: hook 2 ayat (0–4s) → "jom saya tunjuk N langkah" → satu babak setiap langkah → bonus → CTA "Jom dapatkan lebih banyak tips di airingkas dot my".
Mod UI sebenar (20–30s, tiada suara/kapsyen): buka tip di airingkas.my → Salin → tampal dalam chat → jawapan keluar → Tanda Siap.

## Peraturan khas
- Satu video satu perkara. ~2.4 patah perkataan sesaat.
- UI airingkas mesti ikut kod sebenar repo airingkas, bukan agak-agak.
- Contoh yang ditunjuk mesti kerja Ammar sendiri.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
