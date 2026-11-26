# Benang Muafakat · Vektor (HyperFrames)

Versi kedua iklan 35 saat kempen Foodbank Bulanan Muafakat Care. Babak, masa, peralihan, motion craft dan bunyi
sama dengan v9 (`../muafakatcare-benang-hf/`). Bezanya: setiap ilustrasi dilukis sendiri sebagai vektor SVG. Tiada
imej jana AI dan tiada imej rujukan. Aset raster yang tinggal hanyalah logo rasmi dan QR DuitNow rasmi.

## Lukisan

| Fail | Isi | Ganti imej v9 |
|---|---|---|
| `parts/vektor.mjs` | Stor: dinding, lampu, rak, meja; beras, gula, minyak, tin; kotak terbuka dan tertutup | `bg-stor`, `item-*`, `kotak-*` |
| `parts/vektor2.mjs` | Dua sukarelawan, penolak troli (kaki bergerak), mak cik, sukarelawan menghulur, hidangan, tangan memegang kad, tangan menuding | `sukarelawan-*`, `jalan-troli`, `makcik-sambut`, `pinggan-atas`, `tangan-*` |
| `parts/vektor3.mjs` | Latar kampung (rumah panggung, kelapa, jalan) dan pintu rumah (dalaman, lampu rotan, pintu biru, tangga) | `bg-kampung`, `bg-pintu` |

Setiap lukisan memakai `viewBox` sama saiz dengan imej asal dan id yang sama, jadi CSS dan animasi babak tidak berubah.
Satu tambahan: penolak troli kini melangkah (dua kaki berayun bertentangan, satu langkah setiap lantunan), sesuatu
yang tidak boleh dibuat dengan imej pegun di v9.

Semak satu lukisan sebelum memasukkannya ke babak:

```bash
node parts/vlab.mjs jalanTroli 609 820 .hyperframes/troli.png
```

## Bina dan render

Babak disunting dalam `src/`, kemudian `node build.mjs` menulis `compositions/`. Bunyi ialah campuran yang sama dengan
v9 (`python3 sound.py assets/music.wav`, perlukan fail Epidemic Sound yang tidak masuk git).

```bash
node build.mjs
```

```bash
npx hyperframes check
```

```bash
npx hyperframes render -q delivery -f 30 -o renders/muafakatcare-foodbank-vektor-v1-35s-9x16.mp4
```
