# Semakan: Benang Muafakat · Wakaf Katil Hospital v1

Iklan 35 s, 1080×1920, untuk kempen Wakaf Katil Hospital Muafakat Care.

## Keputusan kreatif

- Tatabahasa visual video rujukan "IKEA, Together" (dikaji bingkai demi bingkai): objek membawa penonton dari
  babak ke babak. Logo menjadi segmen loading, warna membanjir dari jari, kotak menjadi kiub lalu jatuh ke troli,
  zum ke pintu biru kemudian iris terbuka dari pintu itu, ambang pintu menjadi pinggan, kad berpusing mendedahkan
  logo, logo memampat menjadi batang yang memenuhi skrin, dan kad QR jatuh tergantung pada tali.
- Ilustrasi dijana dengan Codex CLI (log masuk ChatGPT) mengikut `codex/PROMPTS.md`.
- Bunyi: lagu "Bumper Car Ride" dan 28 kesan bunyi Epidemic Sound, dicampur oleh `sound.py`. Jeda asal lagu
  diletak semasa kiub jatuh supaya muzik masuk semula tepat bila kotak mendarat (13.38 s).
- Motion craft HyperFrames: motion blur semasa render (`data-motion-blur="on"`); gegaran kamera pegang tangan
  (blok registry `camera-shake`, profil handheld-normal-mild ×0.55) pada syot mengekori; hentakan bergetar
  tiga bingkai pada kotak ditutup, kotak mendarat dan kad QR mendarat; kemasukan tajuk berbeza setiap babak
  (hempasan + gegaran, kabur per perkataan, kelabu-ke-dakwat per perkataan, kabur satu baris); keluar tajuk
  kabur per perkataan, lebih pendek daripada kemasukan.

## Yang diukur, yang hanya dilihat, yang tidak diperiksa

- Diukur: `hyperframes check` lulus tanpa ralat. Kekuatan bunyi -16 LUFS. Paras setiap bahagian bunyi dalam
  video akhir disahkan (jeda senyap, lonjakan selepas mendarat, babak QR). QR dalam bingkai akhir dinyahkod dan
  sama dengan QR DuitNow rasmi di laman web.
- Dilihat: `snapshot --review` (setiap babak, setiap potongan, lebar telefon) dan gambar pegun di setiap peralihan.
- Tidak diperiksa: bunyi tidak didengar, hanya dianalisis (spektrogram, paras, masa puncak).

## Syot paling lemah

Syot mengekori (13.4–19.9 s): penolak troli ialah imej pegun, jadi langkahnya hanya lantunan dan goyang. Dengan
lebih masa, Codex boleh menjana 3–4 pose berjalan untuk diselang-seli pada setiap langkah.

## Amaran yang disimpan dengan sengaja

- `outside_safe_zone`: hujung logo MUAFAKAT di pembuka dan satu baris kapsyen pintu menyentuh tepi kanan zon
  selamat TikTok/Shorts. Tiada teks yang terpotong.
- `nested_structure_needs_subcomposition` pada `grain-overlay` (blok registry, satu div tekstur).
- `escaped_container` pada tiang papan tanda Bakri · Muar (tiang sengaja keluar di bawah papan).
