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

## Transcribe a video

```bash
ffmpeg -i talking-head.mp4 -ar 16000 -ac 1 audio.wav
whisper-cli -m ~/.cache/whisper/ggml-small.bin -l ms -ojf -of transcript audio.wav
```

`-l ms` sets Malay. Use `-l auto` if the clip mixes languages.
