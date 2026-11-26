# Benang Muafakat (HyperFrames)

Iklan motion graphic 35 saat untuk kempen Foodbank Bulanan Muafakat Care (muafakatcare.my), dibina
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
| `compositions/penutup.html` | Logo sebenar, jari menekan, Infak Foodbank, muafakatcare.my; keluar: mampat jadi batang | 27.40–30.20 |
| `compositions/qr.html` | QR DuitNow rasmi tergantung pada tali dari hujung jari, berayun dan tenang | 30.05–35.00 |

`index.html` memasang babak-babak ini, ditambah vignette dan bijian filem (blok registry `vignette` dan
`grain-overlay`, diubah supaya ulangan terhad) serta trek muzik `assets/music.wav`.

Dalam setiap fail babak, masa ditulis dalam saat mutlak video melalui `A(t)`, jadi mudah dipadankan
dengan jadual di atas.

## Lukisan dan binaan

Watak dan tangan dilukis sebagai SVG dalam koordinat piksel penuh (1080×1920) oleh `parts/parts.mjs`:
`volunteersPair`, `trolleyWalker`, `doorHandover`, `cardHands`, `pointingHand`, dengan pembantu
`hand`, `arm`, `face` dan `box`. Rupa watak berpandukan bingkai gaya `assets/gaya/sukarelawan-gaya.jpg`
(dijana sekali dengan Cloudinary).

Fail babak disunting dalam `src/`, bukan `compositions/`. `{{ P.namaFungsi(...) }}` dalam `src/*.html`
diganti dengan lukisan semasa binaan:

```bash
node build.mjs
```

Semak satu lukisan sebelum memasukkannya ke babak (PNG ke `.hyperframes/`):

```bash
node parts/lab.mjs volunteersPair "url(#blueBg)" .hyperframes/lab.png
```

## Ilustrasi (Codex)

Semua watak, barang dan latar dijana dengan Codex CLI (log masuk ChatGPT, ciri `image_generation`) mengikut
`codex/PROMPTS.md`, berpandukan bingkai gaya `assets/gaya/sukarelawan-gaya.jpg`. PNG asal disimpan di
`assets/ai/` (tidak masuk git); versi yang digunakan dalam video ialah WebP terpotong di `assets/img/`.
Tangan menuding diletak melalui `P.handImg(id, skala)` dalam `parts/parts.mjs` (hujung jari = titik asal).

Jana semula satu imej, contohnya:

```bash
codex exec -s workspace-write "Ikut codex/PROMPTS.md, jana #11 makcik-sambut.png ke assets/ai/" -i assets/gaya/sukarelawan-gaya.jpg
```

## Bunyi

`sound.py` mencampur lagu **"Bumper Car Ride" (The Fly Guy Five)** dengan 28 kesan bunyi, semuanya dari
Epidemic Sound (folder Google Drive yang dikongsi; pastikan lesen meliputi saluran yang menyiarkan iklan ini).
Lagu bermula dari 24.15 s supaya jeda asalnya (36.85–37.35 s) jatuh semasa kiub jatuh, dan muzik masuk semula
kuat pada 37.53 s, iaitu tepat bila kotak mendarat di troli (13.38 s video). Intro diredam, ada jeda senyap
3.45–3.93 s, lagu direndahkan di babak pintu dan berhenti pada 30 s sebelum babak QR. Setiap kesan bunyi
diletak dengan titik puncaknya pada aksi di skrin. Kekuatan akhir -16 LUFS.

## Bina dan render

Campuran bunyi tidak disimpan dalam git (`*.wav` diabaikan). Jana semula dahulu, kemudian bina babak:

```bash
python3 sound.py assets/music.wav
```

```bash
npx hyperframes check
```

```bash
npx hyperframes render -q delivery -f 30 -o renders/muafakatcare-foodbank-v5-35s-9x16.mp4
```

Pratonton dan suntingan: `npx hyperframes preview`, atau buka projek ini dalam aplikasi desktop HyperFrames.

## Nota semakan

`hyperframes check` lulus. Amaran yang diterima: hujung logo MUAFAKAT di pembuka dan baris kedua kapsyen
pintu menyentuh tepi kanan zon selamat TikTok/Shorts, dan `grain-overlay` mempunyai div bersarang.
QR DuitNow ialah imej rasmi dari repo muafakatcare (`public/img/duitnow-qr.jpg`, dipotong), bukan dilukis semula. Semua fakta dari laman web Muafakat Care; tiada angka impak, dan penerima dilukis sebagai watak.
