#!/usr/bin/env bash
# Renders a format in parallel chunks and joins them. Usage: build/render_all.sh <main|reel> <workdir> [workers]
set -euo pipefail
cd "$(dirname "$0")/.."
KIND="$1"; WORK="$2"; N="${3:-3}"
mkdir -p "$WORK"
TOTAL=$(python3 -c "import json,sys;d=json.loads(open('data.$KIND.js').read()[len('window.DATA = '):-2]);print(round(d['duration']*d['fps']))")
STEP=$(( (TOTAL + N - 1) / N ))
: > "$WORK/$KIND.txt"
for i in $(seq 0 $((N-1))); do
  node build/render.js "$KIND" "$WORK/$KIND-$i.mp4" $((i*STEP)) $(((i+1)*STEP)) &
  echo "file '$WORK/$KIND-$i.mp4'" >> "$WORK/$KIND.txt"
done
wait
ffmpeg -v error -y -f concat -safe 0 -i "$WORK/$KIND.txt" -c copy "$WORK/$KIND-video.mp4"
echo "done $KIND"
