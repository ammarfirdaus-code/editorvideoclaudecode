#!/usr/bin/env python3
"""Turns the Malaysia states GeoJSON into SVG paths for Peninsular Malaysia (map.js).
Source: codeforamerica/click_that_hood, public/data/malaysia.geojson."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODES = {"Perlis": "PLS", "Kedah": "KED", "Penang": "PNG", "Perak": "PRK", "Kelantan": "KEL", "Terengganu": "TRG",
         "Pahang": "PHG", "Selangor": "SEL", "Negeri Sembilan": "NSN", "Melaka": "MLK", "Johor": "JHR",
         "Federal Territory of Kuala Lumpur": "KUL", "Federal Territory of Putrajaya": "PJY"}
NAMES = {"PLS": "Perlis", "KED": "Kedah", "PNG": "P. Pinang", "PRK": "Perak", "KEL": "Kelantan", "TRG": "Terengganu",
         "PHG": "Pahang", "SEL": "Selangor", "NSN": "N. Sembilan", "MLK": "Melaka", "JHR": "Johor", "KUL": "", "PJY": ""}
LON0, LON1, LAT0, LAT1 = 99.55, 104.6, 1.15, 6.8
W = 1000.0
K = W / (LON1 - LON0)
H = (LAT1 - LAT0) * K
d = json.load(open(os.path.join(ROOT, "assets/map/malaysia-states.geojson")))
out = {}
for f in d["features"]:
    code = CODES.get(f["properties"]["name"])
    if not code:
        continue
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    path, best, cx, cy = [], 0, 0, 0
    for poly in polys:
        for ring in poly:
            pts = [((x - LON0) * K, (LAT1 - y) * K) for x, y in ring]
            path.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z")
            a = sx = sy = 0.0
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                c = x0 * y1 - x1 * y0
                a += c; sx += (x0 + x1) * c; sy += (y0 + y1) * c
            if abs(a) > best:
                best, cx, cy = abs(a), sx / (3 * a), sy / (3 * a)
    out[code] = dict(d=" ".join(path), cx=round(cx, 1), cy=round(cy, 1), name=NAMES[code])
with open(os.path.join(ROOT, "map.js"), "w") as fo:
    fo.write("window.MYMAP = " + json.dumps(dict(w=W, h=round(H, 1), states=out), ensure_ascii=False) + ";\n")
print(len(out), "states", W, round(H, 1))
