#!/usr/bin/env python3
"""Writes SUMBER.md: every photo used in either format, with its on-screen credit and source page."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = os.path.join(ROOT, "assets/photos")
sl = json.load(open(os.path.join(PH, "slots.json")))
man = {m["file"]: m for m in json.load(open(os.path.join(PH, "manifest.json"))) + json.load(open(os.path.join(PH, "manifest-r2.json")))}
used = []
for kind in ("main", "reel"):
    d = json.loads(open(os.path.join(ROOT, f"data.{kind}.js")).read()[len("window.DATA = "):-2])
    keys = [s.get("photo") for s in d["scenes"]] + [p[0] for p in d["presidents"]] + ["asri", "burhanuddin_p", "fadzil", "nikaziz", "hadi_p"]
    for k in keys:
        if k and k in sl and k not in used:
            used.append(k)
L = ["# Sumber gambar dan rujukan", "", "Setiap gambar dalam video membawa kredit di skrin dan disenaraikan semula pada kad penutup.", "",
     "## Gambar yang digunakan", "", "| Fail | Subjek | Kredit di skrin | Halaman sumber | Catatan |", "|---|---|---|---|---|"]
for k in used:
    f = sl[k]["file"].replace("use/", ""); m = man[f]
    L.append(f"| `{f}` | {m['subject']} | {sl[k]['credit']} | {m.get('page_url') or ''} | {(m.get('notes') or '').replace('|', '/')} |")
L += ["", "Senarai penuh gambar yang dikumpul, termasuk yang tidak digunakan, ada dalam `assets/photos/manifest.json` dan `assets/photos/manifest-r2.json`.", "",
      "## Rujukan fakta", "",
      "- Wikipedia Bahasa Melayu: Parti Islam Se-Malaysia; Presiden Parti Islam Se-Malaysia",
      "- Mohd Fadli Ghani, Ensiklopedia Harian PAS (berita.pas.org.my)",
      "- Jurnal Sejarah, Universiti Malaya: Perkembangan Gerakan Islam PAS dan Perjuangan Dakwah di Kelantan, 1951–2000",
      "- Berita Harian, 22 Februari 2026: Ahmad Samsuri dilantik Pengerusi PN",
      "- Khairul Faizi Ahmad Kamil, Ogos 2026: PAS 75 Tahun: Muhasabah Perjuangan, Melakar Masa Hadapan",
      "- NST, September 2026: Pas at 75: Quiet celebration, louder political message", ""]
open(os.path.join(ROOT, "SUMBER.md"), "w").write("\n".join(L))
print(len(used), "photos listed")
