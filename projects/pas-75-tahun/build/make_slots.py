#!/usr/bin/env python3
"""Maps scene photo slots to files in assets/photos, makes render-size and blurred copies, writes slots.json."""
import json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = os.path.join(ROOT, "assets/photos")
SLOTS = {
    "founding": ("pas-awal-majlis.jpg", {}),
    "founding2": ("kongres-pas-1952.jpg", {}),
    "fuad": ("r3-ahmad-fuad-hassan-potret.jpg", {}),
    "fuad1953": ("ahmad-fuad-kongres-1953.jpg", {}),
    "abbas": ("abbas-alias-1.jpg", {"pos": "50% 20%"}),
    "election1955": ("poster-pru-1955.jpg", {}),
    "burhanuddin": ("burhanuddin-nehru.jpg", {}),
    "burhanuddin2": ("r2-burhanuddin-3.jpg", {}),
    "burhanuddin_p": ("r4-burhanuddin-potret.jpg", {}),
    "zulkifli": ("zulkifli-muhammad-1.jpg", {}),
    "zulkifli2": ("zulkifli-muhammad-2.jpg", {}),
    "kelantan1959": ("ishak-lotfi-1.jpg", {}),
    "trg1959": ("terengganu-1959-kerajaan-pas.jpg", {}),
    "asri": ("asri-muda-1.jpg", {"pos": "50% 15%"}),
    "bn1974": ("asri-tun-razak.jpg", {}),
    "yusofrawa": ("r4-yusof-rawa-potret.jpg", {}),
    "memali": ("memali-1985-sekatan-polis.jpg", {"bw": True}),
    "crowd_old": ("kelantan-1970an-perhimpunan.jpg", {}),
    "fadzil": ("r2-fadzil-noor-1.jpg", {}),
    "fadzil2": ("r2-fadzil-noor-ceramah-2002.jpg", {}),
    "nikaziz": ("nik-aziz-2.jpg", {}),
    "hadi": ("hadi-awang-kuliah-dhuha.jpg", {}),
    "hadi_p": ("hadi-awang-2026.jpg", {"pos": "50% 15%"}),
    "nikaziz_funeral": ("nik-aziz-jenazah-1.jpg", {}),
    "mn2019": ("muafakat-nasional-2019-berpelukan.jpg", {}),
    "pn2020": ("hadi-muhyiddin-ziarah.jpg", {}),
    "ge15": ("r2-pru15-himpunan-pn-2022.jpg", {}),
    "crowd_modern": ("ceramah-pn-negeri-sembilan.jpg", {}),
    "samsuri": ("samsuri-1.jpg", {}),
    "muktamar72": ("muktamar-72-perwakilan.jpg", {}),
}
man = {m["file"]: m for m in json.load(open(os.path.join(PH, "manifest.json"))) + json.load(open(os.path.join(PH, "manifest-r2.json")))}
os.makedirs(os.path.join(PH, "use"), exist_ok=True)
old = {}
if os.path.exists(os.path.join(PH, "slots.json")):
    old = json.load(open(os.path.join(PH, "slots.json")))
out = {}
for key, (f, extra) in SLOTS.items():
    src = os.path.join(PH, f)
    use = "use/" + f
    blur = "use/blur-" + f
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale='min(2200,iw)':-2", "-q:v", "2", os.path.join(PH, use)])
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale=480:-2,gblur=sigma=14", "-q:v", "4", os.path.join(PH, blur)])
    wh = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", os.path.join(PH, use)]).decode().strip().split(",")
    credit = man[f]["credit"].split(" (")[0]
    out[key] = dict(file=use, blur=blur, w=int(wh[0]), h=int(wh[1]), credit=credit, source=man[f].get("page_url"), **extra)
    if old.get(key, {}).get("file") == use:      # keep cut-out / print fields made by make_cutouts.py
        for k in ("cut", "cw", "ch", "bw", "bww", "bwh"):
            if k in old[key]:
                out[key][k] = old[key][k]
json.dump(out, open(os.path.join(PH, "slots.json"), "w"), ensure_ascii=False, indent=1)
print(len(out), "slots")
