#!/usr/bin/env bash
# Sets up the 20-repo "motion studio" toolchain on Ubuntu/Debian (or WSL).
# Repo list: motion-studio/REPOS.md
#
# Usage:
#   bash scripts/setup-motion-studio.sh            # everything
#   bash scripts/setup-motion-studio.sh 2d 3d      # only some groups
#
# Groups:
#   2d     Remotion, Remotion Skills, Anime.js, Motion, Manim, Lottie
#   3d     Three.js, Three GPU Pathtracer, Jolt Physics, postprocessing, three.quarks, Tweakpane, MCP for Blender
#   audio  ComfyUI, CosyVoice, librosa, WhisperX
#   apps   OBS Studio, LosslessCut, FFmpeg
#
# Safe to re-run. Heavy repos (ComfyUI, CosyVoice) are cloned into $MOTION_HOME.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO="$ROOT/motion-studio"
MOTION_HOME="${MOTION_HOME:-$HOME/motion-studio}"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

SELECTED=("$@")
if [ ${#SELECTED[@]} -eq 0 ]; then SELECTED=(2d 3d audio apps); fi
want() { local g; for g in "${SELECTED[@]}"; do [ "$g" = "$1" ] && return 0; done; return 1; }

log() { printf '\n==> %s\n' "$*"; }

apt_install() {
  $SUDO apt-get update -qq
  $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$@"
}

ensure_uv() {
  if ! command -v uv >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
}

clone_or_pull() { # url dir [extra git args]
  local url="$1" dir="$2"; shift 2
  if [ -d "$dir/.git" ]; then
    git -C "$dir" pull --ff-only -q || echo "  (could not update $dir, keeping current copy)"
  else
    git clone --depth 1 -q "$@" "$url" "$dir"
  fi
}

node_major="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/' || echo 0)"
if [ "${node_major:-0}" -lt 22 ]; then
  echo "Node.js 22+ is required (found: ${node_major:-none}). Install it first, e.g. via nvm." >&2
  exit 1
fi

mkdir -p "$MOTION_HOME"

# ---------------------------------------------------------------- JS libraries
# 01 Remotion, 03 Anime.js, 04 Motion, 06 Lottie, 08 Three.js, 09 Pathtracer,
# 10 Jolt Physics (JoltPhysics.js build), 11 postprocessing, 12 three.quarks, 13 Tweakpane
if want 2d || want 3d; then
  log "Installing JS libraries into motion-studio/node_modules"
  npm install --prefix "$STUDIO" --no-audit --no-fund --silent
fi

# ---------------------------------------------------------------- 02 Remotion Skills
if want 2d; then
  log "Installing Remotion agent skills (remotion-dev/skills)"
  npx -y skills add remotion-dev/skills -a claude-code -s '*' -y \
    || clone_or_pull https://github.com/remotion-dev/skills.git "$MOTION_HOME/remotion-skills"
fi

# ---------------------------------------------------------------- Python tools
# 05 Manim, 16 librosa, 17 WhisperX
if want 2d || want audio; then
  log "Installing Manim / librosa / WhisperX into motion-studio/.venv"
  apt_install ffmpeg sox libcairo2-dev libpango1.0-dev pkg-config python3-dev build-essential
  ensure_uv
  [ -d "$STUDIO/.venv" ] || uv venv -q --python 3.11 "$STUDIO/.venv"
  if want audio; then
    uv pip install -q --python "$STUDIO/.venv/bin/python" -r "$STUDIO/requirements.txt"
  else
    uv pip install -q --python "$STUDIO/.venv/bin/python" "$(grep '^manim' "$STUDIO/requirements.txt" | cut -d' ' -f1)"
  fi
fi

# ---------------------------------------------------------------- 07 MCP for Blender
if want 3d; then
  log "MCP for Blender"
  ensure_uv
  if command -v blender >/dev/null 2>&1; then
    echo "  Blender found. Run this once and pick Claude in the menu:"
  else
    echo "  Blender is not installed here. Install Blender on the PC that will render, then run:"
  fi
  echo "    uvx mcp-for-blender setup"
  echo "  (It adds a 'blender' MCP entry to Claude and installs the Blender addon.)"
fi

# ---------------------------------------------------------------- 14 ComfyUI, 15 CosyVoice
if want audio; then
  log "ComfyUI -> $MOTION_HOME/ComfyUI"
  ensure_uv
  clone_or_pull https://github.com/Comfy-Org/ComfyUI.git "$MOTION_HOME/ComfyUI"
  [ -d "$MOTION_HOME/ComfyUI/.venv" ] || uv venv -q --python 3.12 "$MOTION_HOME/ComfyUI/.venv"
  uv pip install -q --python "$MOTION_HOME/ComfyUI/.venv/bin/python" -r "$MOTION_HOME/ComfyUI/requirements.txt"

  log "CosyVoice -> $MOTION_HOME/CosyVoice (models download on first use)"
  clone_or_pull https://github.com/QwenAudio/CosyVoice.git "$MOTION_HOME/CosyVoice" --recursive
  [ -d "$MOTION_HOME/CosyVoice/.venv" ] || uv venv -q --python 3.10 "$MOTION_HOME/CosyVoice/.venv"
  uv pip install -q --python "$MOTION_HOME/CosyVoice/.venv/bin/python" -r "$MOTION_HOME/CosyVoice/requirements.txt" \
    || echo "  CosyVoice requirements failed (often needs a CUDA GPU). See its README."
fi

# ---------------------------------------------------------------- 18 OBS, 19 LosslessCut, 20 FFmpeg
if want apps; then
  log "FFmpeg + OBS Studio"
  apt_install ffmpeg obs-studio || echo "  obs-studio not in this apt source; on Windows use: winget install OBSProject.OBSStudio"

  log "LosslessCut -> $MOTION_HOME/LosslessCut.AppImage"
  if [ ! -s "$MOTION_HOME/LosslessCut.AppImage" ]; then
    url="$(curl -fsSL https://api.github.com/repos/mifi/lossless-cut/releases/latest \
      | grep -o '"browser_download_url": *"[^"]*x86_64\.AppImage"' | head -1 | sed 's/.*"\(http[^"]*\)"/\1/')"
    if [ -n "$url" ]; then
      curl -fL -o "$MOTION_HOME/LosslessCut.AppImage" "$url" && chmod +x "$MOTION_HOME/LosslessCut.AppImage"
    else
      echo "  Could not find the AppImage. On Windows use: winget install mifi.losslesscut"
    fi
  fi
fi

log "Done. Check: ffmpeg -version | head -1; $STUDIO/.venv/bin/manim --version"
