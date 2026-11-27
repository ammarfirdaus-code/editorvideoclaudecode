# Promo ebook: Buat Video Dokumentari Menggunakan Claude

30-second 16:9 promo video for the ebook at
https://ammarcreavacreative.bcl.my/form/video-dokumentari-claude

Concept follows a reference ebook promo (warm desk scene, floating ebook and
props, "learn" button click, highlighted prompt, flying sticky notes, creator
brand, feature list, file-folder reveal, app UI, kinetic words, end card with
CTA). All visuals here are original HTML/CSS; ebook cover and documentary
frames come from the landing page assets.

## Files

- `index.html` – the composition (GSAP timeline, 30 s, 1920×1080)
- `render.js` – seeks the timeline frame by frame with Playwright
- `assets/` – ebook cover, documentary frames, logo
- `fonts/` – Nunito and Special Elite, served locally
- `audio/sfx.wav` – synthesized whoosh/click/pop track timed to the scenes

## Render

```bash
NODE_PATH=$(npm root -g) node render.js out/frames 30
ffmpeg -y -framerate 30 -i out/frames/f%05d.jpg -i audio/sfx.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest out/promo.mp4
```

To add music, mix it under the SFX:

```bash
ffmpeg -y -i out/promo.mp4 -i music.mp3 -filter_complex \
  "[1:a]volume=0.5,afade=t=out:st=28:d=2[m];[0:a][m]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -shortest out/promo-music.mp4
```

Scene timing (seconds): desk 0–3.2 · "Belajar Prompt" 3.2–6 · "Mula" button 6–9 ·
prompt + highlighter 9–12 · ebook spread 12–15.4 · brand + features 15.4–19.2 ·
skill folder 19.2–21.2 · 5-phase workflow 21.2–23.85 · kinetic words 23.85–25.6 ·
end card 25.6–30.
