# AI Ringkas: video motion graphic 60s (9:16)

Promo video for airingkas.my. 1080x1920, 30fps, 60 s, Malay voiceover.

Media files (VO, music, SFX, MP4) are not in git (see the repo `.gitignore`).
The VO and music were generated in ElevenLabs flow "AI Ringkas - Video Motion Graphic 60s".

## Rebuild
```bash
npm i
python3 src/vo_fit.py assets/vo_raw.mp3 assets/vo_final.wav 1.05   # caps pauses, writes marks.json
node src/render.js still 7.5 15.6 47.0                               # check frames in out/
for p in 0 1 2 3; do node src/render.js video $((p*450)) $((p*450+450)) $p & done; wait
node src/render.js events && python3 src/sfx.py                      # SFX from data-fx
```
Then concat `out/part*.mp4` and mix VO + music (0.40, sidechain duck) + SFX (0.55) to -14 LUFS.

Animation timings in `index.html` (`data-in`) follow `marks.json` / `words.json`.
