# Salam Ahad, Jom Berbekam (Spa Bekam Al Firdaus)

Reel 9:16, 15 s, dari 3 klip rakaman telefon. Branding ikut DESIGN-SpaBekamAlFirdaus_v2 (Drive `_BRAND`): palet biru, Poppins + Inter, logo rasmi.

- `overlays.py`: lencana jenama, kad teks dan kad penutup (logo, nombor telefon berdenyut). Font: `@fontsource/poppins`, `inter`, `amiri` (npm pack).
- `music.py`: muzik latar sintetik + whoosh peralihan.
- `build.sh`: slow-mo 0.5x, gred warna, peralihan, overlay, gabung audio.

```bash
python3 overlays.py <fonts> <ov> <endcard_bg.png> <logo-spa-bekam-al-firdaus_lutsinar.png>
bash build.sh <dir_upload> <ov> out.mp4 <work>
```
