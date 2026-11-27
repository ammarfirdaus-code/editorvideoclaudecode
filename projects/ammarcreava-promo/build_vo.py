# Generates per-phrase Malay TTS (facebook/mms-tts-zlm), joins with gaps, writes vo.wav + timeline.json
import json,sys,numpy as np,torch,scipy.io.wavfile as w
from transformers import VitsModel, AutoTokenizer
m=VitsModel.from_pretrained("facebook/mms-tts-zlm"); t=AutoTokenizer.from_pretrained("facebook/mms-tts-zlm")
SR=m.config.sampling_rate; LEAD=0.4
for d,rate in [(x.split(':')[0],float(x.split(':')[1])) for x in sys.argv[1:]]:
    m.speaking_rate=rate; torch.manual_seed(7)
    ph=json.load(open(f'{d}/phrases.json')); audio=[np.zeros(int(LEAD*SR))]; t0=LEAD; out=[]
    for p in ph:
        with torch.no_grad(): y=m(**t(p['tts'],return_tensors='pt')).waveform[0].numpy()
        # trim silence
        idx=np.where(np.abs(y)>0.02)[0]; y=y[max(0,idx[0]-200):idx[-1]+400]
        dur=len(y)/SR; out.append({**p,'start':round(t0,3),'end':round(t0+dur,3)})
        audio+= [y,np.zeros(int(p['gap']*SR))]; t0+=dur+p['gap']
    a=np.concatenate(audio); a=a/np.abs(a).max()*0.9
    w.write(f'{d}/vo.wav',SR,(a*32767).astype(np.int16))
    json.dump({'duration':round(t0,3),'phrases':out},open(f'{d}/timeline.json','w'),indent=1,ensure_ascii=False)
    print(d,'dur',round(t0,2))
