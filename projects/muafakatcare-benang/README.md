# Benang Muafakat: iklan Foodbank Bulanan

Iklan motion graphic 30 saat untuk kempen Foodbank Bulanan Muafakat Care (muafakatcare.my).
Format 1080×1920 (9:16) untuk Reels dan TikTok. Teks dan muzik sahaja, tiada suara latar.

Gaya diilhamkan daripada video motion graphic "IKEA, Together": latar warna pejal, watak vektor rata,
dan satu benang merah yang membawa mata dari babak ke babak. Warna dan logo ikut jenama Muafakat Care.

## Babak

| Masa | Babak | Teks skrin |
|---|---|---|
| 0.0–3.2 | Tangan dengan RM50, benang dan manik jatuh | RM50 anda pergi ke mana? |
| 3.2–6.2 | Telefon, butang Infak ditekan | Satu klik di muafakatcare.my |
| 6.2–10.0 | Barang masuk kotak, reben diikat | RM50 = 1 pek makanan asas |
| 10.0–14.0 | Van melalui kampung | Dihantar terus ke rumah · Bakri · Muar |
| 14.0–18.0 | Serahan di pintu rumah | Asnaf · Ibu tunggal · Warga emas · B40 |
| 18.0–22.0 | Kalendar berganti bulan, cip RM10/20/50 | Setiap bulan · Infak ikut kemampuan · RM10 pun diterima |
| 22.0–26.0 | Kad Papan Impak | Setiap agihan direkod · Berdaftar ROS PPM-002-10-13032020 |
| 26.0–30.0 | Benang jadi hati, logo sebenar | Infak Foodbank · muafakatcare.my |

Semua fakta diambil dari laman web Muafakat Care. Tiada angka impak kerana angka rasmi belum disahkan,
dan penerima dilukis sebagai watak, bukan gambar sebenar.

## Fail

- `index.html`: komposisi (SVG + GSAP). Satu timeline `window.tl`, berhenti (paused), 30 s.
- `render.js`: render bingkai demi bingkai melalui Chromium (Playwright) ke FFmpeg.
- `music.py`: muzik latar dan kesan bunyi disintesis dengan numpy, 100 BPM, diselaraskan dengan babak.
- `assets/logo.png`: logo dari repo `muafakatcare` (`public/img/logo.png`).
- `fonts/`, `vendor/gsap.min.js`: Poppins, Inter dan GSAP disalin ke dalam projek, tiada CDN.

## Render semula

```bash
npm install
```

```bash
python3 music.py renders/music.wav
```

```bash
node render.js 30 renders/video-tanpa-audio.mp4
```

```bash
ffmpeg -y -i renders/video-tanpa-audio.mp4 -i renders/music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart renders/muafakatcare-foodbank-benang-30s-9x16.mp4
```

Semak satu bingkai pegun tanpa render penuh: `node render.js --stills 5.5,16.2` (PNG dalam `renders/`).
Untuk menukar teks, ubah `<text>` dalam `index.html`; untuk menukar masa, ubah nombor kedudukan dalam timeline.
