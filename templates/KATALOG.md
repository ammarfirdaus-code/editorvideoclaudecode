# Katalog Template Video

Setiap template ada folder sendiri `templates/<id>/` dengan `TEMPLATE.md` (spec, struktur, peraturan) dan `enjin/` (kod render). Status enjin:

- **Dalam repo**: enjin dah ada dalam `templates/<id>/enjin/`.
- **Di Drive**: enjin masih dalam Drive Ammar. Salin ke `enjin/` bila guna kali pertama (lokasi dalam TEMPLATE.md).

## A. Motion graphic (semua visual dilukis dengan kod, tiada footage)

| ID | Nama | Nisbah | Durasi | Sesuai untuk | Suara | Enjin |
|---|---|---|---|---|---|---|
| `airingkas-tutorial` | Tutorial airingkas | 9:16 | 30–60s | Tip step by step airingkas.my; ada mod UI sebenar tanpa suara | ElevenLabs atau tiada | Di Drive |
| `kinetik-promo` | Promo kinetik explainer | 16:9 / 9:16 | ~60s | Promo brand, produk, SaaS, kelas | ElevenLabs | Belum ada (bina dari spec) |
| `edukasi-ai-landskap` | Edukasi AI pendek | 16:9 | 45–58s | Update AI terkini untuk YouTube/FB Ammarcreava | Suara AI | Di Drive |
| `motion-klien` | Iklan motion graphic klien | 9:16 | 15/30/60s | Servis video berbayar untuk klien (sekolah, madrasah, bisnes) | VO dari klien/AI Studio + Suno | Di Drive |
| `komik-jualan` | Cerita komik soft sell | 9:16 | ~60s | Jual ebook/produk digital melalui cerita watak Malaysia | ElevenLabs | Di Drive |
| `pop-art-audio` | Pop art dari audio | 9:16 | ikut audio | Isu semasa, politik, bila Ammar hantar audio naratif | Audio dari Ammar | Di Drive |
| `berita-3-tema` | Berita 3 tema | 9:16 | 60–75s | Berita/isu semasa bersuara Ammar: Realistik, Kartun Infografik, Kronologi Sinematik | Suara Ammar | Di Drive |
| `bekam-papercut` | Iklan papercut Spa Bekam | 9:16 | 30–37s | Iklan Spa Bekam Al Firdaus | edge-tts / suara Ammar | Di Drive |

## B. Talking head dan footage sebenar

| ID | Nama | Nisbah | Durasi | Sesuai untuk | Bahan perlu | Enjin |
|---|---|---|---|---|---|---|
| `talking-head-editorial` | Talking head editorial | 9:16 | 30–90s | Ceramah, ucapan, avatar Kiara: kapsyen per perkataan, slide, kad berita | Klip talking head | Di Drive |
| `talking-head-kuning` | Talking head kapsyen kuning | 9:16 | ~50s | Tips/edukasi dari muka sendiri: stack teks kuning, split B-roll, punch-in | Klip + B-roll | Guna enjin `talking-head-editorial` |
| `avatar-tutorial` | Tutorial avatar HeyGen Ammar | 9:16 | 30–45s | Tutorial 4 langkah dengan avatar Ammar + screenshot sebenar | Render HeyGen + screenshot | Di Drive |
| `review-kedai-makan` | Review kedai makan | 9:16 | 45–75s | Review kafe/restoran sekitar Muar | Klip mentah + rating | Di Drive |
| `reel-post-rasmi` | Reel update AI (post rasmi) | 9:16 | ikut video asal | Kongsi semula video rasmi syarikat AI dengan kad post X + headline | Video rasmi + teks post | Di Drive |

## C. Iklan kebajikan dan kutipan (Muafakat Care dan kempen derma)

| ID | Nama | Nisbah | Durasi | Sesuai untuk | Bahan perlu | Enjin |
|---|---|---|---|---|---|---|
| `ads-testimoni` | Iklan testimoni | 9:16 | ~30s | Testimoni penerima/waris jadi iklan infak | Klip testimoni + QR + akaun | Di Drive |
| `video-emosi` | Video emosi infak | 9:16 | 30–40s | Beberapa klip jadi iklan sedih dengan CTA infak | 3–6 klip + QR | Di Drive |
| `iklan-kuliah` | Iklan dari klip kuliah | 9:16 | 30–45s | Klip ceramah jadi iklan sedekah (gaya Papercut, Tipografi Tebal, Scrapbook) | Klip kuliah + QR/link | Di Drive |

## Bukan template kod

- **Seedance / Axcel Studio** (skill `seedance-video-axcel`): video realistik dijana AI, bukan dirender dari kod. Cadangkan bila Ammar perlukan shot realistik orang, produk atau suasana yang tak boleh dilukis.
- **Google Flow** (skill `google-flow-iklan-produk`): iklan produk realistik dengan Veo.
