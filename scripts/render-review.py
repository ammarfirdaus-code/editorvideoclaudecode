"""Render a vertical review video from a shot list, a voice-over and word timings.

Each beat in edit.json takes one clip, crops it to fill the frame, plays it
for the beat's length with a slow punch-in, and the beats are joined in
order. The VO is laid over the top with the clips' own sound kept low as
ambience. Captions show 3 words at a time with the spoken word in yellow,
and text cards (place name, facts, the score) pop in on top.

Usage: python3 scripts/render-review.py projects/zus-signature/edit.json out.mp4
Paths inside edit.json are relative to the edit.json folder.
"""
import json
import os
import subprocess
import sys

FONT = "Inter Display Black"
YELLOW = "&H0000E5FF&"  # ASS colours are &HAABBGGRR
WHITE = "&H00FFFFFF&"


def probe(path, entry):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entry,
                          "-of", "default=nw=1:nk=1", path],
                         check=True, capture_output=True, text=True).stdout
    return out.split()[0]


def has_audio(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                          "-show_entries", "stream=index", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return bool(out.strip())


def ts(t):
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def write_ass(path, words, cards, w, h):
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {w}", f"PlayResY: {h}", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
        "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, "
        "Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Cap,{FONT},86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,2,80,80,520,1",
        f"Style: Card,{FONT},72,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB4000000,-1,0,0,0,100,100,0,0,3,24,0,8,80,80,260,1",
        f"Style: Big,{FONT},230,&H0000E5FF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,12,6,5,80,80,0,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    # Captions: groups of up to 3 words, broken early at sentence ends.
    groups, cur = [], []
    for wd in words:
        cur.append(wd)
        if len(cur) == 3 or wd["word"][-1] in ".?!:":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    for gi, g in enumerate(groups):
        g_end = groups[gi + 1][0]["start"] if gi + 1 < len(groups) else g[-1]["end"] + 0.4
        g_end = min(g_end, g[-1]["end"] + 0.6)  # don't hold a line through long pauses
        for k, wd in enumerate(g):
            start = wd["start"]
            end = g[k + 1]["start"] if k + 1 < len(g) else g_end
            text = " ".join(
                (r"{\c" + YELLOW + r"}" if j == k else r"{\c" + WHITE + r"}") + x["word"].upper()
                for j, x in enumerate(g))
            pop = r"{\fscx112\fscy112\t(0,90,\fscx100\fscy100)}" if k == 0 else ""
            lines.append(f"Dialogue: 0,{ts(start)},{ts(end)},Cap,,0,0,0,,{pop}{text}")

    for c in cards:
        style = "Big" if c.get("big") else "Card"
        anim = r"{\fad(120,150)\fscx60\fscy60\t(0,180,\fscx100\fscy100)}"
        text = c["text"].replace("\n", r"\N")
        lines.append(f"Dialogue: 1,{ts(c['start'])},{ts(c['end'])},{style},,0,0,0,,{anim}{text}")

    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")


def main(edit_path, out_path):
    root = os.path.dirname(os.path.abspath(edit_path))
    edit = json.load(open(edit_path, encoding="utf-8"))
    p = lambda x: os.path.join(root, x)
    w, h = edit["size"]
    fps = edit["fps"]
    vo = p(edit["voiceover"])
    vo_len = float(probe(vo, "format=duration"))
    words = json.load(open(p(edit["words"]), encoding="utf-8"))["words"]

    missing = sorted({b["clip"] for b in edit["beats"] if not os.path.exists(p(b["clip"]))})
    if missing:
        sys.exit("Missing footage:\n  " + "\n  ".join(missing))

    inputs, filters, vlabels, alabels = [], [], [], []
    for i, b in enumerate(edit["beats"]):
        end = b["end"] if b["end"] is not None else vo_len
        dur = end - b["start"]
        clip = p(b["clip"])
        clip_len = float(probe(clip, "format=duration"))
        start_in = min(b["in"], max(clip_len - dur, 0))
        inputs += ["-ss", f"{start_in:.3f}", "-t", f"{dur:.3f}", "-i", clip]
        frames = max(int(round(dur * fps)), 1)
        z = b.get("zoom", 1.0)
        # Fill the frame, then a slow linear punch-in to `z` over the beat.
        # If the clip is shorter than the beat, hold its last frame.
        filters.append(
            f"[{i}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
            f"setsar=1,fps={fps},tpad=stop_mode=clone:stop_duration={dur:.3f},"
            f"trim=duration={dur:.3f},setpts=PTS-STARTPTS,"
            f"scale=w='{w}*(1+({z}-1)*n/{frames})':h=-2:eval=frame,"
            f"crop={w}:{h}:(iw-{w})/2:(ih-{h})/2,format=yuv420p[v{i}]")
        vlabels.append(f"[v{i}]")
        if has_audio(clip):
            filters.append(f"[{i}:a]aresample=48000,apad,atrim=duration={dur:.3f},"
                           f"asetpts=PTS-STARTPTS[a{i}]")
        else:
            filters.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={dur:.3f}[a{i}]")
        alabels.append(f"[a{i}]")

    n = len(edit["beats"])
    ass = os.path.join(root, "captions.ass")
    write_ass(ass, words, edit.get("cards", []), w, h)
    ass_esc = ass.replace("\\", "/").replace(":", r"\:")
    vo_idx = n
    filters.append("".join(vlabels) + f"concat=n={n}:v=1:a=0[vcat]")
    filters.append(f"[vcat]ass='{ass_esc}'[vout]")
    filters.append("".join(alabels) + f"concat=n={n}:v=0:a=1,volume={edit['ambience_db']}dB[amb]")
    filters.append(f"[{vo_idx}:a]aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=11,"
                   f"aresample=48000,apad,atrim=duration={vo_len:.3f}[vo]")
    filters.append("[vo][amb]amix=inputs=2:duration=first:normalize=0[aout]")

    cmd = (["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"] + inputs + ["-i", vo,
           "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-r", str(fps),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
           "-t", f"{vo_len:.3f}", out_path])
    subprocess.run(cmd, check=True)
    print(f"Wrote {out_path} ({vo_len:.1f}s)")


if __name__ == "__main__":
    main(*sys.argv[1:3])
