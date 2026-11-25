# Berita 3 tema (`berita-3-tema`)

Skill rujukan: `video-berita-3-tema` (arahan penuh langkah demi langkah ada dalam skill ni).

## Format
1080x1920, 30fps, 60–75s

## Enjin
00_CLAUDE_WORKSPACE/_SKILLS/video-berita-3-tema/enjin-video-berita-3-tema.zip (render.py, render_kartun.py, render_sinema.py, mix.sh)

Kalau `enjin/` dalam folder ni masih kosong, salin enjin dari lokasi di atas ke sini, commit, dan tukar status dalam `templates/KATALOG.md` kepada "Dalam repo". Jangan commit aset klien, QR atau footage.

## Rupa
| Tema | Rupa |
|---|---|
| Realistik | latar biru gelap, gambar jalur atas, kad tipografi, kapsyen Montserrat perkataan besar merah |
| Kartun Infografik | pastel, garis tebal, tiles nombor, cop BELUM DISAHKAN (0 kredit) |
| Kronologi Sinematik | gelap-oren, jam digital, peta laluan bercahaya, grain + vignette (0 kredit) |

## Struktur
Hook → apa jadi → kronologi → kesan → perkembangan + status pengesahan → penerangan → penghargaan → doa → CTA "Nak buat video macam ni? PM".

## Peraturan khas
- Sahkan fakta dengan WebSearch. Belum sah = "dikatakan" di suara dan skrin.
- Jangan guna gambar tokoh awam, mangsa cedera atau suspek. Gambar AI wajib label "Gambar hiasan (AI)".
- Tanya tema kalau Ammar tak sebut. Zon kapsyen y ~1560–1620.

## Semakan akhir
- Contact sheet 6–9 frame dari MP4 akhir, teks tak tutup muka, tiada teks terpotong.
- `ffprobe` ada audio, saiz bawah 30MB untuk hantar.
- MP4 lulus dipindah ke Drive `02_Projects/<projek>/04_Siap`.
