#!/usr/bin/env bash
# Gabung 3 klip (slow-mo 0.5x) + overlay jenama + kad penutup + muzik.
# Guna: bash build.sh <dir_upload> <dir_overlay> <out.mp4> <work_dir>
set -euo pipefail
U=$1; OV=$2; OUT=$3; WK=$4; mkdir -p "$WK"
A=$U/004d1f5c-VID_20261025_161114.mp4; B=$U/e3d2d353-VID_20261025_161121.mp4; C=$U/5cbc545c-VID_20261025_161125.mp4
G="setpts=2*PTS,fps=30,scale=1080:1920:flags=lanczos,eq=contrast=1.06:saturation=1.12:brightness=0.01,format=yuv420p"
i=0; for f in "$A" "$B" "$C"; do
  ffmpeg -v error -y -i "$f" -an -vf "$G" -c:v libx264 -crf 16 -preset fast "$WK/s$i.mp4"; i=$((i+1)); done
ffmpeg -v error -y -framerate 30 -i "$OV/end/%04d.png" -vf format=yuv420p -c:v libx264 -crf 16 "$WK/s3.mp4"
d() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
D0=$(d $WK/s0.mp4); D1=$(d $WK/s1.mp4); D2=$(d $WK/s2.mp4); D3=$(d $WK/s3.mp4); X=0.4
O1=$(echo "$D0-$X" | bc -l); O2=$(echo "$O1+$D1-$X" | bc -l); O3=$(echo "$O2+$D2-$X" | bc -l); T=$(echo "$O3+$D3" | bc -l)
echo "B@$O1 C@$O2 END@$O3 total=$T"
fade_io() { echo "fade=t=in:st=$1:d=0.35:alpha=1,fade=t=out:st=$2:d=0.3:alpha=1"; }
ffmpeg -v error -y -i $WK/s0.mp4 -i $WK/s1.mp4 -i $WK/s2.mp4 -i $WK/s3.mp4 \
  -loop 1 -i $OV/brand.png -loop 1 -i $OV/hook.png -loop 1 -i $OV/usp.png -loop 1 -i $OV/sunnah.png -loop 1 -i $OV/manfaat.png \
  -filter_complex "
  [0][1]xfade=transition=slideleft:duration=$X:offset=$O1[v1];
  [v1][2]xfade=transition=smoothup:duration=$X:offset=$O2[v2];
  [v2][3]xfade=transition=fade:duration=$X:offset=$O3,trim=0:$T[v];
  [4]trim=0:$T,format=rgba,$(fade_io 0.1 $(echo "$O3-0.2"|bc -l))[o0];
  [5]trim=0:$T,format=rgba,$(fade_io 0.2 2.6)[o1];
  [6]trim=0:$T,format=rgba,$(fade_io 2.5 $(echo "$O1-0.2"|bc -l))[o2];
  [7]trim=0:$T,format=rgba,$(fade_io $(echo "$O1+0.4"|bc -l) $(echo "$O2-0.2"|bc -l))[o3];
  [8]trim=0:$T,format=rgba,$(fade_io $(echo "$O2+0.4"|bc -l) $(echo "$O3-0.2"|bc -l))[o4];
  [v][o0]overlay=shortest=1[a0];[a0][o1]overlay[a1];[a1][o2]overlay[a2];[a2][o3]overlay[a3];[a3][o4]overlay,format=yuv420p[out]" \
  -map "[out]" -c:v libx264 -crf 18 -preset medium -r 30 "$WK/video.mp4"
python3 "$(dirname "$0")/music.py" "$T" "$O1,$O2,$O3" "$WK/music.wav"
ffmpeg -v error -y -i "$WK/video.mp4" -i "$WK/music.wav" -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "$OUT"
echo done "$OUT"
