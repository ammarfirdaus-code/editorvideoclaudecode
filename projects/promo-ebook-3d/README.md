# Promo ebook 3D: Buat Video Dokumentari Menggunakan Claude

28-second 1280×720 promo video built in real 3D with Three.js, following the
shot structure of a reference ebook promo, with content changed to this ebook
(https://ammarcreavacreative.bcl.my/form/video-dokumentari-claude).

## Shots (seconds)

| Time | Shot |
|---|---|
| 0–3.05 | Overhead desk flatlay: open ebook, cover, pencil cup, floating "Belajar Prompt" pill, 3D cursor click |
| 3.05–5.5 | Warm room with window, desk, easel, chair; cursor flies at camera |
| 5.5–8.0 | Push-in to easel, 3D "Mula" button pressed (turns orange, text glows) |
| 8.0–9.6 | Fast pull-back through the room |
| 9.6–12.6 | Pencil cup tumble, then highlighter over the first prompt |
| 12.6–15.0 | Overhead spread with "Bina babak" page, sticky note, ribbon, dive |
| 15.0–16.6 | Flying sticky notes (workflow steps) and orange spheres, white flash with ring |
| 16.6–20.1 | Sky with clouds, AMMARCREAVA title, book opens; lower-third with features |
| 20.1–21.6 | Halftone ring, `video-dokumentari` folder, .pdf and SKILL.md cards |
| 21.6–23.1 | Website-style UI: "Lebih dari template." |
| 23.1–24.6 | Kinetic words: jom!!!! · Bina · Dokumentari · sendiri |
| 24.6–28.2 | End card: 3D title, book, confetti, "Dapatkan · RM19" |

## Files

- `index.html` – canvas plus HTML overlays (lower-third, UI, kinetic text, grain, halftone)
- `main.js` – all 3D scenes and the per-shot timeline (`window.__render(t)`)
- `render.js` – local HTTP server + Playwright, screenshots each frame
- `vendor/three/` – three.js 0.160 and the example modules used
- `fonts/` – Nunito (woff2 for canvas/HTML, TTF for 3D extruded text)
- `audio/` – synthesized whoosh/click/pop (wav files are git-ignored; rebuild with ffmpeg)

## Render

```bash
NODE_PATH=$(npm root -g) node render.js out/frames 30
ffmpeg -y -framerate 30 -i out/frames/f%05d.jpg -i audio/sfx.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 17 -c:a aac -b:a 192k -shortest out/promo-3d.mp4
```

Args: `render.js <outDir> <fps> [times|-] [startFrame] [endFrame]`. Pass a comma list of
seconds for preview stills, or a frame range to split the render across processes.

Notes: Chromium runs WebGL through SwiftShader here (~1 s per frame). UnrealBloom washed
the whole image out under SwiftShader, so it is not used.
