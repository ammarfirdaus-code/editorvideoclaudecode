---
name: video-review-kedai-makan
description: Edit klip mentah review kedai makan/kafe menjadi video TikTok/Reels 9:16 (stabilize, colour grade, zoom, potong ikut voiceover, caption, rating bintang, sound effect, muzik, CTA). Guna bila Ammar beri folder klip + fail suara dan minta video review diedit.
---

# Edit Video Review Kedai Makan / Kafe (gaya Ammar)

Skill ni untuk **editing sahaja**. Suara (voiceover) dan muzik dibekalkan oleh Ammar sebagai fail. Skill ni tidak jana suara, muzik atau skrip.

**Input:**
- Folder klip mentah.
- Fail suara (mp3/wav/m4a).
- Fail muzik latar (pilihan).

**Output:** satu MP4 1080x1920 dalam folder klip.

Skrip ada dalam `scripts/`, bunyi efek dalam `sfx/`, dan contoh config sebenar (review ZUS Signature Muar) dalam `templates/config.example.json`.

**Keperluan:** `ffmpeg` (libass + vidstab), `whisper-cli` + `~/.cache/whisper/ggml-small.bin` (pasang guna `scripts/setup.sh` di root repo), Python 3.10 ke atas, dan font **Poppins Bold** + **DejaVu Sans Bold**.

## Langkah

### 1. Kumpul input
- Pastikan ada: folder klip, fail suara, dan (kalau ada) fail muzik. Kalau suara atau muzik tak dibagi, tanya Ammar. Jangan jana sendiri.
- Senaraikan klip. Fail `xxx (1).mp4` ialah duplicate.
- Buat contact sheet (satu frame setiap klip) dan **tengok sendiri gambar tu**: luar kedai, dalam kedai, chiller, menu, makanan dan minuman.

### 2. Tanya Ammar (untuk teks di skrin, jangan teka)
Guna AskUserQuestion:
- Nama kedai dan **alamat penuh**. Jangan reka; kesilapan dulu: menulis "LEVEL ATAS".
- Nama menu yang muncul dalam video.
- **Rating setiap menu** (5 / 4.5 / 4 / 3.5), kalau suara ada bahagian rating.

"Muar" ditulis **"MUO"** dalam teks (ikut sebutan Ammar).

### 3. Masa setiap perkataan
```
python scripts/transcribe.py "<fail suara>" work/words.json
```
- Baca `work/words.json`. Betulkan ejaan yang Whisper salah (nama menu, "Muo"). Masa tak perlu diubah.
- Fail suara dan words.json ini jadi "peta" untuk semua potongan.

### 4. Sediakan klip
```
python scripts/prep_clips.py "<folder klip>" work/prepped
```
Langkah ni stabilize, colour grade (hangat, kontras, vignette) dan tukar ke 1080x1920. Klip yang dah siap tak diproses semula.

### 5. Tulis config.json
Salin `templates/config.example.json` ke folder kerja dan isi ikut masa dalam words.json:
- `voice`: fail suara asal. `music`: fail muzik (buang baris tu kalau tiada muzik).
- `scenes`: potong klip **ikut apa yang disebut**. Bila sebut chiller, tunjuk chiller. Bila sebut nama air, tunjuk air tu. Setiap babak 2 hingga 5 saat. `motion` ialah `in`, `out` atau `punch`; guna `punch` untuk bahagian rating. Klip ditulis sebagai `[nama, mula, panjang|null]`.
- `texts`: headline pembuka (nama kedai, DAH SAMPAI MUO!, nama jalan), kad info atau perbandingan, "NI YANG AKU TRY & RATING AKU", alamat penuh di penutup, dan CTA (KOMEN KAT BAWAH! / JANGAN LUPA FOLLOW). `{y}...{/y}` = kuning, `\n` = baris baru.
- `ratings`: `stars_at` = masa perkataan nombor bintang (cth. "lima").
- `subtitles.skip` = julat bahagian rating (caption bawah dimatikan di situ). `keywords` = perkataan yang ditonjolkan warna kuning.
- `sfx.boom_at` = [0, masa "rating"]; `sfx.bell_at` = masa perkataan **"follow"**.
- `duration` = tamat suara + ~0.7 saat.

### 6. Render dan semak
```
python scripts/render.py config.json
```
- Buka `work/semak.jpg` (12 frame) dan **tengok sendiri**. Semak teks tak bertindih, bintang betul, dan klip padan dengan apa yang disebut.
- Simpan output dalam folder klip, contoh `Review <Kedai> (Rating).mp4`.
- Bila Ammar minta pembetulan, ubah `config.json` dan render semula fail yang sama. Jangan buat v1/v2.

## Gaya yang Ammar dah setuju
- Bunyi transisi: **swish lembut gaya cinematic** (`sfx/swish.mp3`). Whoosh kartun dikira kelakar dan ditolak.
- Bintang: pop satu demi satu dengan bunyi `ding`, separuh bintang untuk .5, dan skor "4.5/5".
- **Loceng wajib** di hujung, tepat masa sebut "follow".
- Suara tidak dibersihkan dengan voice isolator, gate atau denoise kuat, sebab suara jadi tak sekata. render.py cuma buat highpass + loudnorm, dan muzik turun (ducking) bila bercakap.
- Motion halus (zoom dengan easing), tiada flash putih.
- Elak emoji dalam teks (font tak sokong, keluar kotak kosong).

## Fail
- `scripts/transcribe.py`: whisper-cli, hasilkan words.json.
- `scripts/prep_clips.py`: stabilize, grade dan saiz 9:16.
- `scripts/render.py`: babak, caption, bintang dan campuran audio. Hasilkan MP4 dan `semak.jpg`.
- `sfx/`: swish, ding, boom dan bell.
- `templates/config.example.json`: contoh penuh review ZUS Signature Muar.
