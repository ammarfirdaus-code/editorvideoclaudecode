# Promo ebook in Blender (test shot)

Blender 4.2 LTS rebuild of one shot from the reference ebook promo, rendered with
Cycles for real bounced light, soft shadows, depth of field, motion blur and glow.
This is the approach the reference video appears to use (its own UI lists
Blender, three.js, Remotion and HyperFrames).

## Shot: "Mula" button (2.5 s, 75 frames)

Warm room with a bright window, desk, easel holding the open ebook, plant, mug,
pencil cup, pegboard chair. The camera pushes in, a 3D "Mula" button pops up, a
3D cursor clicks it, the button turns orange and the text glows.

## Run

```bash
python3 scripts/make_textures.py                       # page/label textures (PIL)
blender -b -P scripts/shot_mula.py -- --still 62       # one test frame
blender -b -P scripts/shot_mula.py -- --samples 24     # all frames -> out/mula/
ffmpeg -framerate 30 -i out/mula/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 17 out/shot_mula.mp4
```

CPU only in this container: about 40–70 s per frame. On a PC with an Nvidia GPU,
set Cycles to GPU (Preferences > System) for a large speed-up.
