#!/bin/bash
# Renders every Blender shot in order (fast settings). Logs to out/shots/<shot>.log
cd "$(dirname "$0")/.."
for s in ${@:-A C E F G H I J M}; do
  mkdir -p out/shots
  blender -b -P scripts/shots.py -- --shot $s --samples 8 --pct 75 > out/shots/$s.log 2>&1
  echo "done $s $(ls out/shots/$s | wc -l) frames"
done
