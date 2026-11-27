# Align phrases.json to an external vo.wav (e.g. Gemini TTS) with Whisper word timestamps.
# usage: python align_vo.py a b c   -> rewrites {theme}/timeline.json (start/end per phrase + duration)
# Each phrase may carry "say" (what the voice actually speaks); otherwise "text" is used.
import json, re, sys, difflib
from faster_whisper import WhisperModel
import subprocess, numpy as np

def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

ONES = ['kosong','satu','dua','tiga','empat','lima','enam','tujuh','lapan','sembilan']

def num_ms(n):
    # Malay number words for 0..999
    if n < 10: return ONES[n]
    if n == 10: return 'sepuluh'
    if n == 11: return 'sebelas'
    if n < 20: return ONES[n - 10] + ' belas'
    if n < 100: return ONES[n // 10] + ' puluh' + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    h = 'seratus' if n // 100 == 1 else ONES[n // 100] + ' ratus'
    return h + ('' if n % 100 == 0 else ' ' + num_ms(n % 100))

def norm(w):
    w = w.lower().replace('ammarcreava', 'ammar kriava').replace('-', '')
    w = re.sub(r"\d+", lambda m: ' ' + num_ms(int(m.group())) + ' ' if int(m.group()) < 1000 else m.group(), w)
    w = re.sub(r"[^a-z0-9 ]", ' ', w)
    return [x for x in w.split() if x]

model = WhisperModel('small', device='cpu', compute_type='int8')

for th in sys.argv[1:]:
    ph = json.load(open(f'{th}/phrases.json', encoding='utf-8'))
    segs, info = model.transcribe(load16k(f'{th}/vo.wav'), language='ms', word_timestamps=True, condition_on_previous_text=False)
    words = [(w.word, w.start, w.end) for s in segs for w in s.words]
    hyp = []  # (token, start, end)
    for w, s, e in words:
        for t in norm(w): hyp.append((t, s, e))
    ref, owner = [], []
    for i, p in enumerate(ph):
        for t in norm(p.get('say', p['text'])): ref.append(t); owner.append(i)
    sm = difflib.SequenceMatcher(None, ref, [h[0] for h in hyp], autojunk=False)
    ts = [None] * len(ref)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): ts[a + k] = (hyp[b + k][1], hyp[b + k][2])
    # fuzzy fill for replace blocks of equal length (spelling variants)
    for tag, a0, a1, b0, b1 in sm.get_opcodes():
        if tag == 'replace':
            for k in range(a1 - a0):
                j = b0 + round(k * (b1 - b0) / max(1, a1 - a0))
                if j < b1: ts[a0 + k] = (hyp[j][1], hyp[j][2])
    # interpolate remaining gaps linearly
    known = [i for i, t in enumerate(ts) if t]
    for i in range(len(ts)):
        if ts[i]: continue
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        if lo is None: ts[i] = (ts[hi][0], ts[hi][0])
        elif hi is None: ts[i] = (ts[lo][1], ts[lo][1])
        else:
            f = (i - lo) / (hi - lo); t = ts[lo][1] + f * (ts[hi][0] - ts[lo][1]); ts[i] = (t, t)
    out = []
    for i, p in enumerate(ph):
        idx = [k for k, o in enumerate(owner) if o == i]
        out.append({**p, 'start': round(ts[idx[0]][0], 3), 'end': round(ts[idx[-1]][1], 3)})
    # keep phrases monotonic and non-overlapping
    for i in range(1, len(out)):
        if out[i]['start'] < out[i - 1]['end']: out[i]['start'] = out[i - 1]['end']
        if out[i]['end'] <= out[i]['start']: out[i]['end'] = round(out[i]['start'] + 0.3, 3)
    dur = round(out[-1]['end'], 3)
    json.dump({'duration': dur, 'phrases': out}, open(f'{th}/timeline.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    matched = sum(1 for a, b, n in sm.get_matching_blocks() for _ in range(n))
    print(th, 'dur', dur, f'matched {matched}/{len(ref)} words')
    for p in out: print(f"  {p['start']:6.2f}-{p['end']:6.2f}  {p['text']}")
