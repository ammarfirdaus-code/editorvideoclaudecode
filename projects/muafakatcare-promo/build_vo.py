# VO with Gemini TTS (Google AI Studio) -> vo.wav + timeline.json
#   python3 build_vo.py              # call Gemini per phrase (needs key: env GEMINI_API_KEY or proxy-injected)
#   python3 build_vo.py --no-vo      # timeline from script slots only (captions/motion, no voice)
#   python3 build_vo.py --voice Kore # other prebuilt voice (Sulafat, Kore, Aoede, Leda, Charon, Puck ...)
# Each phrase is placed at its slot start; if longer than the slot it is sped up (max 1.15x).
import json, sys, os, base64, subprocess, urllib.request, numpy as np, scipy.io.wavfile as w

D = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(f'{D}/script.json'))
args = sys.argv[1:]
voice = args[args.index('--voice') + 1] if '--voice' in args else S['voice']
model = args[args.index('--model') + 1] if '--model' in args else 'gemini-2.5-flash-preview-tts'
SR = 24000

def gemini(text):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
    body = {"contents": [{"parts": [{"text": f"{S['style']} {text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    h = {'Content-Type': 'application/json'}
    if os.environ.get('GEMINI_API_KEY'): h['x-goog-api-key'] = os.environ['GEMINI_API_KEY']
    r = json.load(urllib.request.urlopen(urllib.request.Request(url, json.dumps(body).encode(), h), timeout=120))
    pcm = base64.b64decode(r['candidates'][0]['content']['parts'][0]['inlineData']['data'])
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768

def trim(y):
    idx = np.where(np.abs(y) > 0.015)[0]
    return y[max(0, idx[0] - 240): idx[-1] + 600] if len(idx) else y

def speed(y, f):
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                        '-filter:a', f'atempo={f:.4f}', '-f', 'f32le', '-'], input=y.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32)

out, buf = [], np.zeros(int(S['duration'] * SR), np.float32)
for i, p in enumerate(S['phrases']):
    a, b = p['slot']
    if '--no-vo' in args:
        out.append({**p, 'start': a, 'end': b}); continue
    y = trim(gemini(p['tts']))
    room = (S['phrases'][i + 1]['slot'][0] - 0.12 if i + 1 < len(S['phrases']) else S['duration'] - 1.0) - a
    if len(y) / SR > room: y = speed(y, min(1.15, len(y) / SR / room))
    end = a + len(y) / SR
    i0 = int(a * SR); buf[i0:i0 + len(y)] += y[:len(buf) - i0]
    out.append({**p, 'start': a, 'end': round(end, 3)})
    print(f"{p['s']:7s} {a:5.2f}-{end:5.2f} (slot {b:5.2f})  {p['text']}")

if '--no-vo' not in args:
    buf = buf / max(1e-6, np.abs(buf).max()) * 0.9
    w.write(f'{D}/vo.wav', SR, (buf * 32767).astype(np.int16))
elif os.path.exists(f'{D}/vo.wav'):
    os.remove(f'{D}/vo.wav')
json.dump({'duration': S['duration'], 'phrases': out}, open(f'{D}/timeline.json', 'w'), indent=1, ensure_ascii=False)
print('timeline.json written', '(no VO)' if '--no-vo' in args else f'+ vo.wav (voice {voice})')
