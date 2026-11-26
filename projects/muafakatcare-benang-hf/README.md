# Benang Muafakat (HyperFrames)

Iklan motion graphic 30 saat untuk kempen Foodbank Bulanan Muafakat Care (muafakatcare.my), dibina
dengan HyperFrames. Format 1080×1920 (9:16) untuk Reels, TikTok dan Shorts. Teks dan muzik sahaja.

Versi ini menggantikan `../muafakatcare-benang/` (versi skrip Playwright sendiri). Bahasa visual
disamakan dengan video rujukan "IKEA, Together [Motion Graphics]": logo dibina daripada batang, tangan
dan manik pada tali, bilik dengan lampu sorot dan jari gergasi, watak besar, peralihan kiub 3D, syot
mengekori troli, zum ke pintu, syot dari atas, kad dipegang tangan, dan penutup logo.

## Struktur

| Fail | Babak | Masa |
|---|---|---|
| `compositions/pembuka.html` | Soalan pembuka, logo dibina daripada batang, tangan dan manik | 0.00–3.95 |
| `compositions/stor.html` | Stor: jari gergasi mengisi rak, barang masuk kotak, reben | 3.90–9.90 |
| `compositions/sukarelawan.html` | Dua sukarelawan memegang pek, keluar dengan putaran kiub | 9.35–13.25 |
| `compositions/perjalanan.html` | Syot mengekori troli melalui kampung, zum ke pintu | 12.40–19.95 |
| `compositions/pintu.html` | Serahan kepada mak cik di pintu | 19.55–22.90 |
| `compositions/hidangan.html` | Hidangan dari atas, kemudian jadi kad Papan Impak | 22.35–27.75 |
| `compositions/penutup.html` | Logo sebenar, jari menekan, Infak Foodbank, muafakatcare.my | 27.40–30.00 |

`index.html` memasang babak-babak ini, ditambah vignette dan bijian filem (blok registry `vignette` dan
`grain-overlay`, diubah supaya ulangan terhad) serta trek muzik `assets/music.wav`.

Dalam setiap fail babak, masa ditulis dalam saat mutlak video melalui `A(t)`, jadi mudah dipadankan
dengan jadual di atas.

## Bina dan render

Muzik tidak disimpan dalam git (`*.wav` diabaikan). Jana semula dahulu:

```bash
python3 music.py assets/music.wav
```

```bash
npx hyperframes check
```

```bash
npx hyperframes render -q delivery -f 30 -o renders/muafakatcare-foodbank-hyperframes-30s-9x16.mp4
```

Pratonton dan suntingan: `npx hyperframes preview`, atau buka projek ini dalam aplikasi desktop HyperFrames.

## Nota semakan

`hyperframes check` lulus. Amaran yang diterima: hujung logo MUAFAKAT di pembuka dan baris kedua kapsyen
pintu menyentuh tepi kanan zon selamat TikTok/Shorts, dan `grain-overlay` mempunyai div bersarang.
Semua fakta dari laman web Muafakat Care; tiada angka impak, dan penerima dilukis sebagai watak.
