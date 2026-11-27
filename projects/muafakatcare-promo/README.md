# Muafakat Care: video promo eBook percuma + infak online

Video 9:16 (1080×1920, 30fps, 33s) untuk TikTok/Reels/Shorts. Gaya 3D terapung, latar cerah (rujukan: iklan Krismas Apple), dalam jenama Muafakat Care: merah `#C5162E`, biru tua `#2B2F7A`, font Poppins + Inter.

| Babak | Masa | Isi |
|---|---|---|
| 1 Hook | 0–3.5s | Jubin huruf 3D bercantum: "Nak buat kebaikan?" |
| 2 eBook | 3.5–9.2s | 3 kulit eBook terapung, "10 eBook PERCUMA", muat turun tanpa daftar |
| 3 Carian | 9.2–12.6s | Bar carian 3D: "Ke mana nak salurkan infak?" + cadangan program |
| 4 Program | 12.6–20s | Foodbank (RM50), Wakaf Katil (RM50), Sedekah Subuh (RM1), Kecemasan |
| 5 Ketelusan | 20–24.7s | Kolaj foto agihan, Papan Impak, no. pendaftaran PPM |
| 6 Beg infak | 24.7–28s | Foto jatuh ke dalam beg berlogo |
| 7 CTA | 28–33s | Logo, muafakatcare.my, Jom Infak / eBook Percuma |

Semua aset (logo, kulit eBook, foto) dan fakta (harga, no. PPM) diambil dari muafakatcare.my.

## Jana semula
```bash
python3 build_music.py 33     # music.wav (prosedur, bebas royalti)
python3 build_vo.py           # VO Gemini TTS (Google AI Studio) -> vo.wav + timeline.json
python3 build_vo.py --no-vo   # tanpa suara (kapsyen ikut slot dalam script.json)
node render.js                # -> muafakatcare-promo.mp4 (9:16, campur VO jika vo.wav ada)
node render.js --land         # -> muafakatcare-promo-landscape.mp4 (16:9, 1920×1080)
node render.js --remix        # campur semula audio sahaja, tanpa render frame
node render.js --stills 3,10  # semak frame
```
Skrip VO, slot masa dan suara (`Sulafat`) ada dalam `script.json`. `build_vo.py` perlukan API key Google AI Studio (env `GEMINI_API_KEY`, atau network secret untuk `generativelanguage.googleapis.com` dengan header `x-goog-api-key`). Setiap frasa diletak pada slotnya; jika terlalu panjang ia dicepatkan (maks 1.15×).
