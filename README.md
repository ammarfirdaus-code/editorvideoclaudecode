# editorvideoclaudecode

Tools for editing talking-head videos with HyperFrames, FFmpeg, GSAP and local Whisper transcription.

## Tools and why they're needed

| Tool | Why |
|---|---|
| **Node.js 22+** | Runs the HyperFrames CLI and its render engine. |
| **FFmpeg + ffprobe** | Decodes and encodes video, reads clip durations, writes the final MP4. |
| **whisper-cli (whisper.cpp)** | Local, offline speech-to-text. Produces the transcript and word timings used for captions. |
| **Whisper `ggml-small.bin`** | Multilingual "small" model. Supports Bahasa Melayu. The `.en` models are English-only and are not used. |
| **HyperFrames** | Turns HTML compositions into video. Edits are plain HTML files you can diff and commit. |
| **GSAP** | Animation library used inside HyperFrames for caption timing, zooms and transitions. Guidance ships in the `hyperframes` skill (`references/motion.md`). |
| **Chrome Headless Shell** | HyperFrames renders frames by capturing a headless browser page. |

Not needed here: Docker, yt-dlp, OpenCV.

## Setup

Ubuntu/Debian (apt). On Mac or Windows, install the same tools with brew or winget/choco.

```bash
bash scripts/setup.sh
```

The script installs FFmpeg and build tools, builds `whisper-cli` into `/usr/local/bin`, downloads the Whisper model to `~/.cache/whisper/ggml-small.bin`, then runs the HyperFrames skills, browser and doctor steps. It is safe to re-run.

Check the result with:

```bash
npx hyperframes doctor
whisper-cli -m ~/.cache/whisper/ggml-small.bin -l ms -f some-audio.wav
```

Optional: `ggml-medium.bin` (~1.5 GB) is more accurate for Malay than `small`.

### Optional: voice and music

```bash
bash scripts/setup-media.sh
```

Installs Kokoro TTS (English voices only; it has no Malay voice) and MusicGen for background music. MusicGen weights are downloaded on first use. Large install: PyTorch is several GB.

### GSAP without a CDN

`npx hyperframes init` creates projects that load GSAP from `cdn.jsdelivr.net`. Some sandboxes block that host, and renders then fail. Copy GSAP into the project instead:

```bash
bash scripts/vendor-gsap.sh path/to/project
```

Then change the script tag in `index.html` to `<script src="vendor/gsap.min.js"></script>`.

## VoiceStudio (submodule)

[debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) is included as a git submodule at `vendor/voicestudio`, pinned to `28bf2c7`. It provides voice cloning, voice design, dubbing and transcription.

```bash
git submodule update --init --recursive
```

VoiceStudio is licensed under AGPL-3.0 and has its own license notice. This repo's own files are not covered by it.

## Verified

- `hyperframes doctor`: whisper-cpp, TTS (Kokoro) and BGM (MusicGen) detected. Docker is installed but not running, which is not needed for local renders.
- `hyperframes render` of a fresh project with vendored GSAP: 1920×1080, H.264, 10 s.
- whisper-cli with `ggml-small.bin -l ms` on Malay speech: the first sentence transcribed exactly. English terms in synthetic speech were misheard. Test with a real recording before relying on it.
- Kokoro and MusicGen each generated a test clip.

## Transcribe a video

```bash
ffmpeg -i talking-head.mp4 -ar 16000 -ac 1 audio.wav
whisper-cli -m ~/.cache/whisper/ggml-small.bin -l ms -ojf -of transcript audio.wav
```

`-l ms` sets Malay. Use `-l auto` if the clip mixes languages.
