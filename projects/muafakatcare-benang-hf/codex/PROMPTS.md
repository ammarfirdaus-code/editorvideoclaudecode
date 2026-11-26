# Arahan untuk Codex: jana ilustrasi iklan Muafakat Care

Codex, jana setiap imej dalam senarai di bawah dan simpan ke `projects/muafakatcare-benang-hf/assets/ai/`
dengan nama fail tepat seperti yang ditulis. Selepas semua siap, commit dan push ke cawangan
`claude/vigilant-brown-xopv26` dengan mesej "Add AI illustrations for Benang Muafakat".

## Gaya (guna untuk SETIAP imej)

Rujukan rupa: `projects/muafakatcare-benang-hf/assets/gaya/sukarelawan-gaya.jpg`. Lampirkan imej ini sebagai
rujukan pada setiap penjanaan supaya watak dan gaya konsisten.

> Flat 2D vector illustration for an animated motion-graphics charity advert, modern editorial explainer
> style: simple geometric shapes, no outlines, smooth soft gradients, subtle soft shadows, gentle soft
> lighting. Simple friendly faces: small dark dot eyes, thin eyebrows, small smile, rosy cheeks.
> Correct anatomy, natural arms and hands with visible fingers holding objects properly. Palette:
> crimson red #C5162E, deep indigo #1E1A68, warm skin tones, cardboard brown #C89B6D, ribbon red
> #ED2B3A, soft ochre, sage green. Malaysian setting. No text, no letters, no logos, no watermark.

Watak tetap (mesti sama dalam semua imej):
- **Sukarelawan lelaki**: lelaki Melayu muda, kopiah/beanie biru muda, baju-T merah polos, seluar indigo.
- **Sukarelawan wanita**: wanita Melayu muda, tudung biru tua (navy), baju merah lengan panjang.
- **Mak cik penerima**: wanita Melayu warga emas, tudung ungu lembut, baju kurung ungu, wajah lembut tersenyum.

"Lutsinar" = latar belakang transparent (PNG dengan alpha), hanya objek itu sahaja, tiada bayang lantai.

## Senarai imej

| # | Nama fail | Saiz | Latar | Penerangan |
|---|---|---|---|---|
| 1 | `bg-stor.png` | 1024×1536 | Penuh | Side view of a small foodbank storeroom: warm ochre wall with a soft circular spotlight glow in the upper middle, an EMPTY wooden wall shelf in the middle, a wooden table below it, an arc floor lamp on the left, plain floor. Top third mostly empty wall. No people, no items on the shelf or table. |
| 2 | `item-beras.png` | 1024×1024 | Lutsinar | A white rice sack with a green label (no letters), front view. |
| 3 | `item-minyak.png` | 1024×1024 | Lutsinar | A yellow cooking-oil bottle, front view. |
| 4 | `item-gula.png` | 1024×1024 | Lutsinar | A pink sugar pack with red top, front view. |
| 5 | `item-tin.png` | 1024×1024 | Lutsinar | Two stacked tins of canned food, grey-blue labels, front view. |
| 6 | `kotak-buka.png` | 1024×1024 | Lutsinar | An open cardboard box, front view, flaps open upward. |
| 7 | `kotak-tutup.png` | 1024×1024 | Lutsinar | The same box closed, tied with a red ribbon and bow, front view. |
| 8 | `bg-kampung.png` | 1536×1024 | Penuh | Wide side-view panorama of a Malaysian kampung road in soft morning light: pastel peach sky, gentle hills, three traditional wooden Malay stilt houses (teal, ochre, dusty rose) and coconut palms spaced along the road, a grass strip and a pale grey road at the bottom quarter. On the far RIGHT end, an ochre stilt house with a blue front door and wooden stairs. No people. |
| 9 | `jalan-troli.png` | 1024×1536 | Lutsinar | Full-body side view, facing right: the male volunteer walking and pushing a two-wheel hand trolley stacked with three cardboard boxes tied with red ribbons, both hands gripping the trolley handle, mid-stride. |
| 10 | `bg-pintu.png` | 1024×1536 | Penuh | Front view of the outside wall of a wooden kampung house (ochre horizontal planks) with a wide open doorway in the centre, dark warm interior with soft lamplight, a blue door leaf swung open on the right. No people. |
| 11 | `makcik-sambut.png` | 1024×1536 | Lutsinar | The elderly mak cik, front view from the knees up, standing in a doorway, both arms reaching forward with open hands at chest height ready to receive a box, gentle grateful smile. |
| 12 | `sukarelawan-hulur.png` | 1024×1536 | Lutsinar | The male volunteer seen from BEHIND (back of head with blue beanie, red t-shirt), upper body only, his right arm extended forward handing over the closed red-ribbon cardboard box. |
| 13 | `pinggan-atas.png` | 1024×1024 | Lutsinar | Top-down view of a white plate of a simple home-cooked Malaysian meal: white rice, fried egg, green vegetables, a piece of chicken. |
| 14 | `tangan-tuding.png` | 1536×1024 | Lutsinar | A hand pointing LEFT with the index finger, other fingers curled, coming from the right edge in a deep indigo sleeve; palm facing down. |
| 15 | `tangan-pegang-kad.png` | 1024×1536 | Lutsinar | Two hands with deep indigo sleeves coming up from the bottom corners, holding the left and right edges of an EMPTY rectangle (leave the rectangle area fully transparent), thumbs in front. |

## Selepas siap

Pastikan semua 15 fail ada dalam `assets/ai/`, kemudian:

```bash
git add projects/muafakatcare-benang-hf/assets/ai
git commit -m "Add AI illustrations for Benang Muafakat"
git push origin claude/vigilant-brown-xopv26
```

Jika ada imej yang anatomi tangan atau jarinya pelik, jana semula imej itu sahaja sebelum push.
