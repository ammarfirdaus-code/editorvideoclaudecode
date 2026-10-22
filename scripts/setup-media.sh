#!/usr/bin/env bash
# Optional: local voice (Kokoro TTS) and background music (MusicGen) for HyperFrames.
# Installs Python packages system-wide (HyperFrames doctor checks the system Python)
# and downloads the Kokoro model to ~/.cache/kokoro.
set -euo pipefail

KOKORO_DIR="${KOKORO_DIR:-$HOME/.cache/kokoro}"
RELEASE="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

pip3 install -q --break-system-packages kokoro-onnx soundfile
pip3 install -q --break-system-packages torch transformers scipy numpy

mkdir -p "$KOKORO_DIR"
for file in kokoro-v1.0.onnx voices-v1.0.bin; do
  if [ ! -s "$KOKORO_DIR/$file" ]; then
    curl -fL -o "$KOKORO_DIR/$file.part" "$RELEASE/$file"
    mv "$KOKORO_DIR/$file.part" "$KOKORO_DIR/$file"
  fi
done

# MusicGen weights (facebook/musicgen-small) are fetched by transformers on first use and cached.
echo "Done. Kokoro model: $KOKORO_DIR"
