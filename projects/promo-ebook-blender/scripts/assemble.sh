#!/bin/bash
# Joins all rendered shots + 2D overlays into the final promo with music, SFX and logo watermark.
set -e
cd "$(dirname "$0")/.."
O=out/clips; mkdir -p $O
enc() { ffmpeg -v error -y "$@" -c:v libx264 -pix_fmt yuv420p -crf 16 -preset medium -r 30; }
up="scale=1280:720:flags=lanczos"
# purple grade for the 3D shots (2D overlays already use the brand gradient)
G="eq=saturation=2.1:contrast=1.12:gamma=0.9,colorbalance=rs=0.05:gs=-0.06:bs=0.16:rm=0.07:gm=-0.1:bm=0.2:rh=0.03:gh=-0.07:bh=0.1"
for s in A C E F G H J M; do enc -framerate 30 -i out/shots/$s/f%04d.jpg -vf "$up,$G" $O/$s.mp4; done
enc -framerate 30 -i out/mula/f%04d.jpg -vf "$up,$G" $O/D.mp4
# I: sky shot with the feature panel sliding in from 1.6 s
enc -framerate 30 -i out/shots/I/f%04d.jpg -framerate 30 -i out/overlay/panel/f%04d.png \
  -filter_complex "[0]$up,$G[b];[1]setpts=PTS+1.6/TB[p];[b][p]overlay=0:0:eof_action=pass" $O/I.mp4
enc -framerate 30 -i out/overlay/ui/f%04d.jpg $O/K.mp4
enc -framerate 30 -i out/overlay/kin/f%04d.jpg $O/L.mp4
: > $O/list.txt; for s in A C D E F G H I J K L M; do echo "file '$s.mp4'" >> $O/list.txt; done
ffmpeg -v error -y -f concat -safe 0 -i $O/list.txt -c copy $O/joined.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $O/joined.mp4)
FADE=$(python3 -c "print(max(0,$DUR-1.2))")
# watermark (hidden on the end card, which shows the logo in 3D), grain, music + sfx
ffmpeg -v error -y -i $O/joined.mp4 -loop 1 -i tex/logo_round.png -ss 30 -i audio/tech-explainer-groove.mp3 -i audio/sfx.wav -filter_complex \
 "[1]scale=64:64,format=rgba,colorchannelmixer=aa=0.9[lg];[0][lg]overlay=W-w-26:22:shortest=1:enable='lt(t,24.6)',noise=alls=5:allf=t[v];\
  [2]volume=0.8,afade=t=in:d=0.3,afade=t=out:st=$FADE:d=1.2[m];[3]volume=0.55[s];[m][s]amix=inputs=2:normalize=0:duration=first[a]" \
 -map "[v]" -map "[a]" -t $DUR -c:v libx264 -pix_fmt yuv420p -crf 17 -c:a aac -b:a 192k -movflags +faststart out/promo-ammarcreava-blender.mp4
echo "final: out/promo-ammarcreava-blender.mp4 ($DUR s)"
