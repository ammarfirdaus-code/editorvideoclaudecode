#!/usr/bin/env bash
# Sets up the talking-head editing toolchain on Ubuntu/Debian:
# Node 22+, FFmpeg, whisper-cli + Whisper "small" multilingual model, HyperFrames + GSAP skills.
set -euo pipefail

WHISPER_MODEL_DIR="${WHISPER_MODEL_DIR:-$HOME/.cache/whisper}"
WHISPER_MODEL="$WHISPER_MODEL_DIR/ggml-small.bin"
WHISPER_SDIST_URL="https://files.pythonhosted.org/packages/9f/35/610787a277e177e6b7983277a35a2969c0876b46c0d889bc6a0c4b4ac4a7/pywhispercpp-1.5.1.tar.gz"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

# 1. Node.js 22+ (HyperFrames requires it)
node_major="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/' || echo 0)"
if [ "${node_major:-0}" -lt 22 ]; then
  echo "Node.js 22+ is required (found: ${node_major:-none}). Install it first, e.g. via nvm." >&2
  exit 1
fi

# 2. FFmpeg, ffprobe, and build tools for whisper.cpp
$SUDO apt-get update -qq
$SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg cmake build-essential curl ca-certificates

# 3. whisper-cli, built from the whisper.cpp source vendored in the PyPI pywhispercpp sdist
if ! command -v whisper-cli >/dev/null 2>&1; then
  curl -fsSL -o "$WORK/pywhispercpp.tar.gz" "$WHISPER_SDIST_URL"
  tar xzf "$WORK/pywhispercpp.tar.gz" -C "$WORK"
  cmake -S "$WORK/pywhispercpp-1.5.1/whisper.cpp" -B "$WORK/build" \
    -DCMAKE_BUILD_TYPE=Release -DWHISPER_BUILD_EXAMPLES=ON -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF
  cmake --build "$WORK/build" -j"$(nproc)" --target whisper-cli
  $SUDO install -m 755 "$WORK/build/bin/whisper-cli" /usr/local/bin/whisper-cli
fi
whisper-cli -h >/dev/null 2>&1 || true

# 4. Whisper "small" multilingual model (NOT the English-only *.en model)
mkdir -p "$WHISPER_MODEL_DIR"
if [ ! -s "$WHISPER_MODEL" ]; then
  curl -fL -o "$WHISPER_MODEL.part" \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
  mv "$WHISPER_MODEL.part" "$WHISPER_MODEL"
fi

# 5. HyperFrames + GSAP skills, headless render browser, diagnostics
npx -y hyperframes skills
npx -y hyperframes browser ensure
npx -y hyperframes doctor

echo "Done. Whisper model: $WHISPER_MODEL"
