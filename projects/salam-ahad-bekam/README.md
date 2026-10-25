# Salam Ahad, Jom Berbekam (Spa Bekam Al Firdaus)

Reel 9:16, 15 s, dari 3 klip rakaman telefon (bekam kepala, bekam belakang x2).

- `overlays.py`: lencana jenama, kad teks dan kad penutup (logo, nombor telefon berdenyut). Font: `@fontsource/poppins`, `playfair-display`, `amiri` (npm pack).
- `music.py`: muzik latar sintetik + whoosh peralihan.
- `build.sh`: slow-mo 0.5x, gred warna, peralihan, overlay, gabung audio.

```bash
python3 overlays.py <fonts> <ov> <endcard_bg.png>
bash build.sh <dir_upload> <ov> out.mp4 <work>
```
