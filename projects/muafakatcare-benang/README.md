# Benang Muafakat: iklan Foodbank Bulanan

Iklan motion graphic 30 saat untuk kempen Foodbank Bulanan Muafakat Care (muafakatcare.my).
Format 1080×1920 (9:16) untuk Reels dan TikTok. Teks dan muzik sahaja, tiada suara latar.

Bahasa visual disamakan dengan video rujukan "IKEA, Together [Motion Graphics]" (60 s, ditonton dari
fail asal): logo dibina daripada batang, tangan dengan manik pada tali, bilik pandangan sisi dengan lampu
sorot dan dinding bertukar warna, jari gergasi yang mengubah babak, watak besar, peralihan kiub 3D, syot
panjang mengekori troli, zum ke pintu, syot dari atas, babak mengecil jadi kad dipegang tangan, dan
penutup logo dengan tagline jarang. Warna, logo dan fakta ikut Muafakat Care.

## Babak

| Masa | Babak | Teks skrin |
|---|---|---|
| 0.0–3.9 | Logo MUAFAKAT dibina daripada batang, tangan dan manik, jalur warna menyapu | RM50 anda pergi ke mana? |
| 3.9–9.6 | Stor: jari gergasi mengisi rak, dinding bertukar warna, barang masuk kotak, reben | RM50 = 1 pek makanan asas |
| 9.6–12.4 | Dua sukarelawan memegang pek (watak besar) | Dibungkus oleh sukarelawan |
| 12.4–13.2 | Peralihan kiub 3D | |
| 13.2–19.9 | Syot mengekori troli melalui kampung, papan tanda Bakri · Muar | Dihantar terus ke rumah |
| 19.9–22.6 | Zum ke pintu, serahan kepada mak cik | Untuk asnaf, ibu tunggal, warga emas & keluarga B40 |
| 22.6–25.0 | Syot dari atas: hidangan di rumah penerima | Setiap bulan · Infak ikut kemampuan · RM10 pun diterima |
| 25.0–27.4 | Babak mengecil jadi kad Papan Impak dipegang tangan | Setiap agihan direkod · Berdaftar ROS PPM-002-10-13032020 |
| 27.4–30.0 | Logo sebenar, jari menekan, butang | Infak Foodbank · muafakatcare.my |

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
ffmpeg -y -i renders/video-tanpa-audio.mp4 -i renders/music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart renders/muafakatcare-foodbank-benang-v2-30s-9x16.mp4
```

Semak satu bingkai pegun tanpa render penuh: `node render.js --stills 5.5,16.2` (PNG dalam `renders/`).
Untuk menukar teks, ubah `<text>` dalam `index.html`; untuk menukar masa, ubah nombor kedudukan dalam timeline.
