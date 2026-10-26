# ZUS Signature review (TikTok / Reels, 9:16)

## Gaya yang ditiru

Format **"try it and rate it 1–10"** Keith Lee, pengulas makanan paling popular di TikTok (13–16 juta pengikut):

- Hook dalam 2 saat pertama, kemudian terus sebut nama kedai.
- Ayat tetap sebelum rasa: *"Jom try, dan rate. Satu sampai sepuluh."*
- Fokus pada makanan. Tiada filter, tiada muzik yang berat. Komen jujur dan pendek.
- Markah besar di skrin sebaik saja markah disebut.
- Tutup dengan soalan untuk penonton (*"nak aku review menu mana lepas ni?"*). Pengulas Malaysia seperti Jason Chen guna cara ini untuk naikkan komen.

Ditambah gaya TikTok Malaysia: caption tebal 3 perkataan sebaris, perkataan yang sedang disebut berwarna kuning, dan kad fakta yang muncul atas video.

## Fakta ZUS Signature yang digunakan

- Konsep premium ZUS. Kedai pertama di Taman Paramount, PJ, April 2025. Tema hitam-putih, bukan biru. Tagline *"Necessity, meets luxury"*.
- Hanya guna **single origin espresso** (Brazil, Ethiopia), bukan blend.
- Mesin **Victoria Arduino Eagle One**, mesin yang dipakai dalam World Latte Art Championship.
- Menu khas Signature: Zeriously Matcha Latte, Yuzu Thunder. CEO Latte dan Spanish Latte juga ada.
- Harga Spanish Latte sekitar RM11.90. Sumber berbeza-beza, jadi semak dalam app.

Sumber: The Star (8 Apr 2025), Marketing-Interactive, Vulcan Post, CoffeeTalk, menu rasmi zuscoffee.com.

## Voice over

ElevenLabs, suara **Ammar Firdaus** (`eleven_v4`). Ada dua take:
`audio/vo-take1.mp3` (51.0s, yang digunakan) dan `audio/vo-take2.mp3` (51.4s).
Skrip penuh ada dalam `script.txt`. Untuk menukar take, ubah `voiceover` dan `words` dalam `edit.json`, kemudian jalankan semula langkah penjajaran di bawah.

**Semak sebelum post:** rasa Spanish Latte (*"manis lembut… sikit rasa buah"*) dan markah **8.5/10** ialah draf. Saya belum tengok footage, jadi saya tak tahu air apa yang sebenarnya diminum. Kalau berbeza, tukar ayat dalam `script.txt` dan generate VO semula.

## Struktur edit (`edit.json`)

| VO (s) | Beat | Klip (tekaan ikut masa rakaman) |
|---|---|---|
| 0.0–5.6 | Hook: "ZUS hitam putih ni…" | 174425 (17:44, sampai) |
| 5.6–11.9 | ZUS Signature + tagline, kad nama | 174433 |
| 11.9–18.2 | Single origin espresso, kad fakta | 175204 (17:52, kaunter) |
| 18.2–23.5 | Mesin Victoria Arduino, punch-in | 175219 |
| 23.5–26.9 | "Jom try dan rate" | 180100 (18:01) |
| 26.9–36.0 | Spanish Latte, hirup, close-up | 180116 |
| 36.0–41.8 | Harga + markah **8.5/10** besar | 180126 |
| 41.8–51.0 | Tips + CTA | 180100 (dari saat ke-4) |

Klip dipilih berdasarkan masa rakaman dalam nama fail sahaja. Selepas tengok footage, betulkan `clip` dan `in` (saat mula dalam klip) bagi setiap beat.

## Render

```bash
pip install faster-whisper            # sekali sahaja
# Letak 7 klip dari Drive folder "Zus signature" ke projects/zus-signature/footage/
python3 -I scripts/align-script.py projects/zus-signature/audio/vo-take1.mp3 \
  projects/zus-signature/script.txt projects/zus-signature/audio/vo-take1.words.json   # hanya jika skrip/VO berubah
python3 -I scripts/render-review.py projects/zus-signature/edit.json renders/zus-signature.mp4
```

Hasil render: 1080×1920, 30 fps, H.264. VO dinormalkan ke -14 LUFS dan bunyi asal klip dikekalkan pada -24 dB sebagai ambience.
