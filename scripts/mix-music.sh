#!/usr/bin/env bash
# Mixes background music under a talking-head video. Music loops to fit, ducks while
# the voice is speaking, and fades out over the last second. Video is not re-encoded.
# Usage: bash scripts/mix-music.sh video.mp4 music.mp3 out.mp4 [music-volume, default 0.35]
set -euo pipefail

VIDEO="${1:?usage: mix-music.sh <video> <music> <out> [volume]}"
MUSIC="${2:?usage: mix-music.sh <video> <music> <out> [volume]}"
OUT="${3:?usage: mix-music.sh <video> <music> <out> [volume]}"
VOLUME="${4:-0.35}"

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")"
FADE_START="$(awk -v d="$DURATION" 'BEGIN { s = d - 1; if (s < 0) s = 0; printf "%.3f", s }')"

ffmpeg -y -i "$VIDEO" -stream_loop -1 -i "$MUSIC" -filter_complex \
  "[0:a]asplit=2[vo][sc];\
[1:a]volume=${VOLUME},afade=t=in:d=1[m];\
[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];\
[vo][duck]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=${FADE_START}:d=1[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac "$OUT"
