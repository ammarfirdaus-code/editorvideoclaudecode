#!/usr/bin/env python3
"""Builds data.js (scene, caption and audio timing) for the PAS 75 documentary.

Reads Whisper word timings of each narration clip, anchors scene changes to
spoken words, and aligns the on-screen caption text to the audio.

Usage: python3 build/make_timeline.py [main|reel]
"""
import difflib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "assets/audio/vo")
FPS = 30
CARD = 2.6        # chapter title card, seconds
GAP = 0.7         # silence after a chapter's narration
LEAD = 0.25       # scene change leads its anchor word slightly


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def dur(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(out)


def find(words, anchor, after=0.0):
    """Start time of the first word matching `anchor` at or after `after`."""
    n = 1
    if "#" in anchor:
        anchor, n = anchor.split("#")
        n = int(n)
    a = norm(anchor)
    for s, _e, w in words:
        if s >= after - 0.01 and norm(w) == a:
            n -= 1
            if n == 0:
                return s
    raise SystemExit(f"anchor not found: {anchor!r} after {after:.2f}")


def captions(text, words, maxlen):
    """Align caption text to word timings; return [[start, end, line], ...]."""
    toks = text.split()
    a = [norm(t) for t in toks]
    b = [norm(w[2]) for w in words]
    times = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (words[blk.b + k][0], words[blk.b + k][1])
    total = words[-1][1]
    # interpolate tokens Whisper spelled differently
    i = 0
    while i < len(toks):
        if times[i] is None:
            j = i
            while j < len(toks) and times[j] is None:
                j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0
            t1 = times[j][0] if j < len(toks) else total
            step = (t1 - t0) / (j - i)
            for k in range(i, j):
                times[k] = (t0 + step * (k - i), t0 + step * (k - i + 1))
            i = j
        else:
            i += 1
    lines, cur = [], []
    for idx, tok in enumerate(toks):
        cur.append(idx)
        length = len(" ".join(toks[k] for k in cur))
        end_sentence = tok[-1] in ".:" and tok not in ("Dr.",)
        soft = tok[-1] == "," and length > maxlen * 0.55
        nxt = len(toks[idx + 1]) + 1 if idx + 1 < len(toks) else 0
        if end_sentence or soft or length + nxt > maxlen:
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    out = []
    for ln in lines:
        out.append([times[ln[0]][0], times[ln[-1]][1], " ".join(toks[k] for k in ln)])
    for k in range(len(out) - 1):        # hold a line until the next one unless there is a real pause
        if out[k + 1][0] - out[k][1] < 0.9:
            out[k][1] = out[k + 1][0]
    out[-1][1] += 0.4
    return out


# ---------------------------------------------------------------- main film
# scene: (anchor, props). anchor None = start of the chapter's narration.
# anchors are matched in order, each searched after the previous one.
MAIN = [
    dict(id="ch0", era=None, title=None,
         text="24 November 1951. Di sebuah bangunan kelab di Bagan, Butterworth, para ulama dari seluruh Tanah Melayu berhimpun. Negara belum merdeka. Tetapi di dewan itu, lahir satu cita-cita, yang kelak bertahan tiga suku abad.",
         scenes=[
             (None, dict(type="date", text="24 November 1951", sub="Bagan, Butterworth", year=1951)),
             ("bangunan", dict(type="words", big="Bagan, Butterworth", sub="Seberang Perai, Pulau Pinang", year=1951)),
             ("para", dict(type="photo", photo="founding", caption="Para ulama Tanah Melayu", sub="Gambar arkib pemimpin awal PAS, 1950-an", year=1951)),
             ("lahir", dict(type="title", year=1951)),
         ]),
    dict(id="ch1", era="1951 – 1956", title="Lahirnya Sebuah Cita-cita",
         text="Persidangan ulama itu melahirkan Persatuan Islam Se-Malaya, ringkasnya PAS, dengan Tuan Haji Ahmad Fuad Hassan sebagai Yang Dipertua pertama. Dua tahun kemudian, Dr. Haji Abbas Alias mengambil alih. Pada pilihan raya pertama Tanah Melayu tahun 1955, PAS hanya menang satu kerusi: Krian, melalui Tuan Guru Haji Ahmad Tuan Hussein. Satu kerusi. Tetapi itulah satu-satunya suara pembangkang dalam Majlis Perundangan Persekutuan.",
         scenes=[
             (None, dict(type="words", big="Persatuan Islam Se-Malaya", sub="PAS · ditubuhkan 24 November 1951", photo="founding2", year=1951)),
             ("dengan", dict(type="photo", photo="fuad", caption="Haji Ahmad Fuad Hassan", sub="Yang Dipertua pertama · 1951–1953<br>(dibulatkan, Kongres PAS 1953)", year=1951)),
             ("Dua", dict(type="photo", photo="abbas", caption="Dr. Haji Abbas Alias", sub="Yang Dipertua Agung · 1953–1956", year=1953)),
             ("pilihan", dict(type="seats", photo="election1955", total=52, won=1, label="Pilihan Raya Persekutuan 1955", sub="52 kerusi dipertandingkan", year=1955)),
             ("Satu", dict(type="stat", big="1", label="kerusi · Krian, Perak", sub="Tuan Guru Haji Ahmad Tuan Hussein", year=1955)),
             ("Tetapi", dict(type="words", big="Suara pembangkang tunggal", sub="Majlis Perundangan Persekutuan, 1955", year=1955)),
         ]),
    dict(id="ch2", era="1956 – 1961", title="Fajar di Pantai Timur",
         text="Hujung 1956, Dr. Burhanuddin al-Helmy memimpin PAS, bergandingan dengan Profesor Zulkifli Muhammad. Tiga tahun kemudian, PAS mengejutkan negara. Kelantan ditawan dengan 28 daripada 30 kerusi. Terengganu, dengan 13 daripada 24. Kerajaan Terengganu tumbang pada 1961. Tetapi Kelantan kekal, menjadi kubu yang membentuk jati diri parti.",
         scenes=[
             (None, dict(type="photo", photo="burhanuddin", caption="Dr. Burhanuddin al-Helmy", sub="Yang Dipertua Agung · 1956–1969", year=1956)),
             ("bergandingan", dict(type="photo", photo="zulkifli", caption="Prof. Zulkifli Muhammad", sub="Timbalan Yang Dipertua Agung · 1956–1964", year=1956)),
             ("Tiga", dict(type="tiles", label="Pilihan Raya 1959", year=1959, steps=[
                 ("Kelantan", dict(on=["KEL"], stat="28 / 30", statsub="kerusi DUN Kelantan")),
                 ("Terengganu", dict(on=["KEL", "TRG"], stat="13 / 24", statsub="kerusi DUN Terengganu")),
                 ("tumbang", dict(on=["KEL"], stat="1961", statsub="Kerajaan Terengganu tumbang", year=1961)),
             ])),
             ("kekal", dict(type="photo", photo="kelantan1959", caption="Dato' Haji Ishak Lotfi Omar", sub="Menteri Besar Kelantan · 1959–1964", year=1961)),
         ]),
    dict(id="ch3", era="1964 – 1978", title="Tahun-tahun Ujian",
         text="Dekad seterusnya penuh ujian. Zulkifli Muhammad terkorban dalam kemalangan pada 1964. Dr. Burhanuddin ditahan di bawah ISA pada 1965, dan meninggal dunia pada 1969. Di bawah Dato' Mohd Asri Muda, PAS menukar nama kepada Parti Islam Se-Malaysia, menyertai kerajaan campuran, lalu menjadi antara pengasas Barisan Nasional. Tetapi krisis Kelantan 1977 mengakhiri segalanya. Darurat diisytiharkan, PAS keluar daripada Barisan Nasional, dan pada 1978, Kelantan terlepas selepas sembilan belas tahun.",
         scenes=[
             (None, dict(type="photo", photo="zulkifli2", caption="1964", sub="Zulkifli Muhammad terkorban dalam kemalangan", year=1964)),
             ("Burhanuddin", dict(type="photo", photo="burhanuddin2", caption="1965 – 1969", sub="Dr. Burhanuddin ditahan di bawah ISA, meninggal dunia 1969", year=1965)),
             ("bawah#2", dict(type="photo", photo="asri", caption="Dato' Mohd Asri Muda", sub="Yang Dipertua Agung · 1969–1982", year=1969)),
             ("menyertai", dict(type="words", big="Parti Islam Se-Malaysia", sub="Kerajaan Campuran 1973 · Barisan Nasional 1974", photo="bn1974", year=1973)),
             ("krisis", dict(type="tiles", label="Krisis Kelantan", year=1977, init=dict(on=["KEL"], stat="1977", statsub="Darurat diisytiharkan di Kelantan"), steps=[
                 ("keluar", dict(on=["KEL"], stat="1977", statsub="PAS keluar daripada Barisan Nasional")),
                 ("terlepas", dict(on=[], stat="19 tahun", statsub="Kelantan terlepas, 1959–1978", year=1978)),
             ])),
         ]),
    dict(id="ch4", era="1982 – 1989", title="Kepimpinan Ulama",
         text="Tahun 1982, lembaran baharu dibuka. Tuan Guru Haji Yusof Rawa mengambil alih, dan lahirlah gagasan Kepimpinan Ulama, yang diperkukuh dengan penubuhan Majlis Syura Ulama pada 1987. Jalannya tidak mudah. Peristiwa Memali 1985 meninggalkan luka yang dalam. Pilihan raya 1986 pula hanya memberi satu kerusi Parlimen. Namun benih yang ditanam, mula berakar.",
         scenes=[
             (None, dict(type="photo", photo="yusofrawa", caption="Haji Yusof Rawa", sub="Yang Dipertua Agung · 1982–1989", year=1982)),
             ("lahirlah", dict(type="words", big="Kepimpinan Ulama", sub="Majlis Syura Ulama ditubuhkan, 1987", photo="muktamar80s", year=1987)),
             ("Jalannya", dict(type="photo", photo="memali", caption="Memali, Baling", sub="19 November 1985", year=1985)),
             ("Pilihan", dict(type="stat", big="1", label="kerusi Parlimen", sub="Pilihan Raya Umum 1986", year=1986)),
             ("Namun", dict(type="photo", photo="crowd_old", caption="Perhimpunan di Kota Bharu", sub="Gambar arkib, 1970-an", year=1986)),
         ]),
    dict(id="ch5", era="1989 – 2002", title="Kebangkitan",
         text="1989, Dato' Haji Fadzil Noor menerajui parti. Setahun kemudian, bersama Angkatan Perpaduan Ummah, kesemua 39 kerusi di Kelantan disapu bersih. Tuan Guru Dato' Nik Abdul Aziz Nik Mat menjadi Menteri Besar, dan kekal selama 23 tahun. Pada 1999, di tengah gelombang Reformasi, PAS menang 27 kerusi Parlimen, menawan semula Terengganu, dan Fadzil Noor menjadi Ketua Pembangkang. Beliau pergi buat selama-lamanya pada Jun 2002.",
         scenes=[
             (None, dict(type="photo", photo="fadzil", caption="Dato' Haji Fadzil Noor", sub="Presiden · 1989–2002<br>(kiri, bersama Tuan Guru Nik Abdul Aziz)", year=1989)),
             ("Setahun", dict(type="tiles", label="Pilihan Raya Umum 1990", year=1990, init=dict(on=["KEL"], stat="39 / 39", statsub="kerusi DUN Kelantan · Angkatan Perpaduan Ummah"), steps=[])),
             ("Tuan", dict(type="photo", photo="nikaziz", caption="Tuan Guru Dato' Nik Abdul Aziz Nik Mat", sub="Menteri Besar Kelantan · 1990–2013", year=1990)),
             ("Pada", dict(type="photo", photo="reformasi", caption="1999", sub="Di tengah gelombang Reformasi", year=1999)),
             ("menang", dict(type="tiles", label="Pilihan Raya Umum 1999", year=1999, init=dict(on=["KEL"], stat="27", statsub="kerusi Parlimen"), steps=[
                 ("menawan", dict(on=["KEL", "TRG"], stat="27", statsub="kerusi Parlimen · Terengganu ditawan semula")),
             ])),
             ("Beliau", dict(type="photo", photo="fadzil2", caption="Dato' Haji Fadzil Noor", sub="1937 – 2002", year=2002)),
         ]),
    dict(id="ch6", era="2002 – 2018", title="Pasang dan Surut",
         text="Tuan Guru Haji Abdul Hadi Awang mengambil alih kepimpinan. 2004: tinggal tujuh kerusi, Terengganu terlepas. 2008: bangkit bersama Pakatan Rakyat. 23 kerusi, Kedah ditawan, dan Perak dipimpin seorang Menteri Besar daripada PAS. 2015, tahun yang berat. Tok Guru Nik Aziz kembali ke rahmatullah, Pakatan Rakyat berakhir, dan parti berpecah. Ramai meramalkan PAS akan tenggelam. Pada 2018, bertanding dengan haluan sendiri, PAS mengekalkan Kelantan, dan merampas semula Terengganu.",
         scenes=[
             (None, dict(type="photo", photo="hadi", caption="Tuan Guru Haji Abdul Hadi Awang", sub="Presiden · 2002–kini", year=2002)),
             ("2004", dict(type="chart", label="Kerusi Parlimen PAS", upto=2004, year=2004, steps=[
                 ("2008", dict(upto=2008, year=2008)),
             ])),
             ("Kedah", dict(type="tiles", label="Pilihan Raya Umum 2008", year=2008, init=dict(on=["KEL", "KED"], stat="23", statsub="kerusi Parlimen · Kedah ditawan"), steps=[
                 ("Perak", dict(on=["KEL", "KED", "PRK"], stat="23", statsub="Menteri Besar Perak daripada PAS")),
             ])),
             ("2015", dict(type="photo", photo="nikaziz_funeral", caption="12 Februari 2015", sub="Tok Guru Nik Aziz kembali ke rahmatullah", year=2015)),
             ("Ramai", dict(type="chart", label="Kerusi Parlimen PAS", upto=2013, year=2015, steps=[])),
             ("Pada", dict(type="tiles", label="Pilihan Raya Umum 2018", year=2018, init=dict(on=["KEL"], stat="18", statsub="kerusi Parlimen · Kelantan dikekalkan"), steps=[
                 ("merampas", dict(on=["KEL", "TRG"], stat="18", statsub="kerusi Parlimen · Terengganu dirampas semula")),
             ])),
         ]),
    dict(id="ch7", era="2019 – 2023", title="Gelombang Hijau",
         text="2019, Muafakat Nasional dimeterai bersama UMNO. 2020, bersama Perikatan Nasional, PAS kembali ke kerajaan Persekutuan, buat pertama kali sejak 1977. Dan pada Pilihan Raya Umum ke-15, tahun 2022: 43 kerusi. Buat pertama kali dalam sejarah, PAS menjadi parti tunggal terbesar di Dewan Rakyat. Setahun kemudian, Terengganu disapu bersih, 32 kosong, manakala Kelantan dan Kedah dimenangi dengan majoriti besar.",
         scenes=[
             (None, dict(type="photo", photo="mn2019", caption="Muafakat Nasional", sub="14 September 2019", year=2019)),
             ("2020", dict(type="photo", photo="pn2020", caption="Perikatan Nasional", sub="Kembali ke kerajaan Persekutuan, 2020", year=2020)),
             ("Dan", dict(type="chart", label="Kerusi Parlimen PAS", upto=2018, year=2022, steps=[
                 ("43", dict(upto=2022, year=2022)),
             ])),
             ("Buat", dict(type="photo", photo="ge15", caption="Parti tunggal terbesar", sub="Dewan Rakyat, 2022", year=2022)),
             ("Setahun", dict(type="tiles", label="Pilihan Raya Negeri 2023", year=2023, init=dict(on=["TRG"], stat="32 – 0", statsub="Terengganu disapu bersih"), steps=[
                 ("manakala", dict(on=["TRG", "KEL", "KED"], stat="2023", statsub="Kelantan dan Kedah dimenangi dengan majoriti besar")),
             ])),
         ]),
    dict(id="ch8", era="2026", title="75 Tahun, Menuju Seabad",
         text="Hari ini, tujuh puluh lima tahun kemudian. Februari 2026, Naib Presiden PAS, Dato' Seri Dr. Ahmad Samsuri Mokhtar, dilantik sebagai Pengerusi Perikatan Nasional. September, Muktamar ke-72 berlangsung di Pusat Tarbiyah Islamiyah Kelantan. Daripada satu kerusi pada 1955, kepada 43. Tujuh orang presiden. Menang dan kalah. Memerintah dan membangkang. Tujuh puluh lima tahun. Satu perjalanan yang belum selesai, menuju satu abad, pada 2051.",
         scenes=[
             (None, dict(type="photo", photo="crowd_modern", caption="Hari ini", sub="75 tahun kemudian", year=2026)),
             ("Februari", dict(type="photo", photo="samsuri", caption="Dato' Seri Dr. Ahmad Samsuri Mokhtar", sub="Pengerusi Perikatan Nasional · Februari 2026", year=2026)),
             ("September", dict(type="photo", photo="muktamar72", caption="Muktamar Tahunan PAS ke-72", sub="PUTIK, Pengkalan Chepa · September 2026", year=2026)),
             ("daripada", dict(type="stat", big="1 → 43", label="kerusi Parlimen", sub="1955 → 2022", year=2026)),
             ("orang", dict(type="presidents", year=2026)),
             ("Satu", dict(type="outro", year=2026)),
         ]),
]

REEL = [
    dict(id="reel", era=None, title=None,
         text="24 November 1951. Di Bagan, Butterworth, para ulama Tanah Melayu melahirkan PAS. Pilihan raya 1955: hanya satu kerusi. Empat tahun kemudian, Kelantan dan Terengganu ditawan. Kemudian, datang ujian. Pemimpin ditahan, darurat di Kelantan, dan pada 1986, tinggal satu kerusi Parlimen. Tetapi parti ini bangkit. 1990: Kelantan disapu bersih, di bawah Tok Guru Nik Aziz. 1999: 27 kerusi. Jatuh lagi pada 2004. Bangkit lagi pada 2008. Dan pada 2022: 43 kerusi. Parti tunggal terbesar di Dewan Rakyat. Tujuh orang presiden. Tujuh puluh lima tahun. Daripada satu kerusi, kepada empat puluh tiga. Satu perjalanan yang belum selesai.",
         scenes=[
             (None, dict(type="date", text="24 November 1951", sub="Bagan, Butterworth", year=1951)),
             ("Di", dict(type="photo", photo="founding", caption="Lahirnya PAS", sub="Gambar arkib pemimpin awal PAS, 1950-an", year=1951)),
             ("Pilihan", dict(type="stat", big="1", label="kerusi", sub="Pilihan Raya Persekutuan 1955", photo="election1955", year=1955)),
             ("Empat", dict(type="tiles", label="Pilihan Raya 1959", year=1959, init=dict(on=["KEL", "TRG"], stat="1959", statsub="Kelantan dan Terengganu ditawan"), steps=[])),
             ("datang", dict(type="photo", photo="burhanuddin2", caption="Tahun-tahun ujian", sub="Dr. Burhanuddin ditahan di bawah ISA, 1965", year=1965)),
             ("darurat", dict(type="photo", photo="asri", caption="1977", sub="Darurat Kelantan · PAS keluar daripada BN", year=1977)),
             ("dan", dict(type="stat", big="1", label="kerusi Parlimen", sub="Pilihan Raya Umum 1986", year=1986)),
             ("Tetapi", dict(type="photo", photo="fadzil", caption="Kebangkitan", sub="Dato' Haji Fadzil Noor · Presiden 1989–2002", year=1989)),
             ("1990", dict(type="photo", photo="nikaziz", caption="Tok Guru Nik Aziz", sub="Kelantan disapu bersih, 39 / 39 · 1990", year=1990)),
             ("1999", dict(type="chart", label="Kerusi Parlimen PAS", upto=1999, year=1999, steps=[
                 ("Jatuh", dict(upto=2004, year=2004)),
                 ("Bangkit", dict(upto=2008, year=2008)),
                 ("Dan", dict(upto=2022, year=2022)),
             ])),
             ("Parti", dict(type="photo", photo="ge15", caption="Parti tunggal terbesar", sub="Dewan Rakyat, 2022", year=2022)),
             ("Tujuh", dict(type="presidents", year=2026)),
             ("Daripada", dict(type="stat", big="1 → 43", label="kerusi Parlimen", sub="1955 → 2022", year=2026)),
             ("perjalanan", dict(type="outro", year=2026)),
         ]),
]

SEATS = [[1955, 1], [1959, 13], [1964, 9], [1969, 12], [1978, 5], [1982, 5], [1986, 1], [1990, 7],
         [1995, 7], [1999, 27], [2004, 7], [2008, 23], [2013, 21], [2018, 18], [2022, 43]]
SEAT_LABELS = [1955, 1959, 1986, 1999, 2004, 2008, 2018, 2022]

PRESIDENTS = [
    ["fuad_p", "Ahmad Fuad Hassan", "1951–1953"],
    ["abbas", "Abbas Alias", "1953–1956"],
    ["burhanuddin_p", "Burhanuddin al-Helmy", "1956–1969"],
    ["asri", "Mohd Asri Muda", "1969–1982"],
    ["yusofrawa", "Yusof Rawa", "1982–1989"],
    ["fadzil", "Fadzil Noor", "1989–2002"],
    ["hadi_p", "Abdul Hadi Awang", "2002–kini"],
]


def build(kind):
    chapters = MAIN if kind == "main" else REEL
    wfile = "words.json" if kind == "main" else "words_reel.json"
    allwords = json.load(open(os.path.join(VO, wfile)))
    maxlen = 46 if kind == "main" else 24
    t = 0.8
    scenes, caps, audio, cards = [], [], [], []
    for ci, ch in enumerate(chapters):
        key = ch["id"] if kind == "main" else "chR"
        clip = os.path.join(VO, (ch["id"] if kind == "main" else "reel") + ".mp3")
        words = allwords[key]
        d = dur(clip)
        if ch["title"]:
            cards.append(dict(start=t, end=t + CARD, era=ch["era"], title=ch["title"], no=ci))
            t += CARD
        vo0 = t
        audio.append(dict(file=os.path.relpath(clip, ROOT), start=round(vo0, 3), dur=round(d, 3)))
        prev = 0.0
        starts = []
        for anchor, props in ch["scenes"]:
            if anchor is None:
                st = 0.0
            else:
                st = find(words, anchor, prev + 0.3)
            prev = st
            starts.append(st)
            for step in props.get("steps", []):
                prev = find(words, step[0], prev + 0.2)
                step[1]["_at"] = prev
        for si, (anchor, props) in enumerate(ch["scenes"]):
            st = vo0 + max(0.0, starts[si] - LEAD) if si else vo0
            en = vo0 + starts[si + 1] - LEAD if si + 1 < len(starts) else vo0 + d + GAP
            p = dict(props)
            steps = []
            for _a, sp in p.pop("steps", []):
                sp = dict(sp)
                sp["at"] = round(vo0 + sp.pop("_at") - LEAD, 3)
                steps.append(sp)
            p.update(start=round(st, 3), end=round(en, 3), steps=steps, chapter=ci)
            scenes.append(p)
        for s, e, line in captions(ch["text"], words, maxlen):
            caps.append([round(vo0 + s, 3), round(vo0 + e, 3), line])
        t = vo0 + d + GAP
    # first scene of each chapter also sits under the chapter card
    for c in cards:
        for s in scenes:
            if s["chapter"] == c["no"]:
                s["start"] = round(c["start"], 3)
                break
    scenes[0]["start"] = 0.0
    # outro holds, then credits
    hold = 3.2 if kind == "main" else 2.4
    scenes[-1]["end"] = round(t + hold, 3)
    credits_len = 9.0 if kind == "main" else 5.0
    credits = dict(start=scenes[-1]["end"], end=round(scenes[-1]["end"] + credits_len, 3))
    total = credits["end"]
    photos = {}
    pfile = os.path.join(ROOT, "assets/photos/slots.json")
    if os.path.exists(pfile):
        photos = json.load(open(pfile))
    data = dict(kind=kind, fps=FPS, duration=round(total, 3), scenes=scenes, captions=caps, cards=cards,
                audio=audio, credits=credits, seats=SEATS, seatLabels=SEAT_LABELS,
                presidents=PRESIDENTS, photos=photos)
    out = os.path.join(ROOT, f"data.{kind}.js")
    with open(out, "w") as f:
        f.write("window.DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print(kind, "duration", total, "scenes", len(scenes), "captions", len(caps))


if __name__ == "__main__":
    for k in (sys.argv[1:] or ["main", "reel"]):
        build(k)
