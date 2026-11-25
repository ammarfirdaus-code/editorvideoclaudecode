# Studio Video Ammarcreava

Repo ni tempat kerja video Ammar dengan Claude Code. Balas dalam BM santai.

## Peraturan nombor satu: cadang template dulu

Sebelum mula apa-apa video baru, JANGAN terus tulis skrip atau kod.

1. Baca `templates/KATALOG.md`.
2. Kenal pasti dari permintaan Ammar: bahan apa yang ada (klip, audio, teks, tiada apa-apa), untuk siapa (Ammarcreava, airingkas, Muafakat Care, Spa Bekam, PAS, klien), platform dan nisbah (9:16 atau 16:9), dan tujuan (edukasi, iklan, jualan, berita, kutipan).
3. Ikut `templates/PILIH-TEMPLATE.md` dan cadangkan **satu template utama + satu alternatif**. Untuk setiap satu, beri sebab (1 ayat), anggaran durasi, dan apa bahan yang masih perlu.
4. Tanya Ammar pilih yang mana (AskUserQuestion kalau ada). Kalau Ammar dah sebut nama template atau gaya, terus guna yang tu.
5. Lepas Ammar pilih, buat folder projek: `bash scripts/projek-baru.sh <id-template> "<Tajuk>"`, kemudian ikut `templates/<id-template>/TEMPLATE.md` dari atas sampai bawah.

## Tempat simpan

| Apa | Di mana | Masuk git? |
|---|---|---|
| Spec dan enjin template (HTML, py, js, sh) | `templates/<id>/` | Ya |
| Kerja satu video (skrip, kod babak, config) | `projek/YYYY-MM-DD_Tajuk/` | Tidak (folder kerja) |
| Footage, audio, gambar mentah | `projek/.../aset/` | Tidak |
| MP4 render | `projek/.../render/` | Tidak |
| MP4 yang dah lulus | Drive `02_Projects/<projek>/04_Siap`, YouTube (Unlisted) atau Cloudinary | Tidak |

- Nama folder dan fail: `YYYY-MM-DD_Tajuk`, tanpa v1/v2. Revisi tulis atas fail yang sama.
- Repo ni **public**. Jangan commit nombor akaun bank, QR, voice ID, muka penerima bantuan, footage klien, atau apa-apa yang peribadi.
- Bila tambah atau ubah template, kemas kini `templates/KATALOG.md` sekali.

## Peraturan umum semua video

- Tiada siaran tanpa lulus Ammar. Semua hasil = draf sampai Ammar kata okay.
- Jangan over-claim, jangan reka fakta, angka, harga atau testimoni.
- Jangan lukis semula logo jenama lain (Claude, ChatGPT dan lain-lain). Tulis nama sebagai teks.
- Gambar orang menerima bekam: jangan ambil dari internet; aurat mesti tertutup.
- Zon selamat 9:16: kandungan penting dalam y 250 hingga 1600.
- Semua animasi dari `seek(t)` yang deterministik. Tiada CSS animation atau `Date`.
- QA sebelum hantar: contact sheet 6 hingga 9 frame dari MP4 akhir, `ffprobe` ada audio, saiz bawah 30MB untuk hantar dalam chat.
- Caption media sosial ikut gaya Ammar: santai (la, kan, je), hook relatable, perenggan pendek, tiada bullet, emoji sikit, tutup dengan doa atau harapan, satu hashtag `#ammarfirdaus`, dalam blok markdown.

## Toolchain

Lihat `README.md` untuk setup (Node 22+, FFmpeg, whisper-cli, HyperFrames, GSAP).
