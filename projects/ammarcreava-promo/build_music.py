# Procedural royalty-free music beds per theme. usage: python3 build_music.py a 28 b 28 c 33
import sys,numpy as np,scipy.io.wavfile as w
SR=44100
def env(n,a=0.005,r=0.2):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/r); return e
def note(f,dur,kind='saw',a=0.005,r=0.3,amp=1):
    n=int(dur*SR); t=np.arange(n)/SR
    if kind=='saw': s=sum(np.sin(2*np.pi*f*k*t)/k for k in range(1,9))
    elif kind=='sq': s=sum(np.sin(2*np.pi*f*k*t)/k for k in range(1,9,2))
    elif kind=='pluck': s=np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*2*f*t)*np.exp(-t*8)+0.25*np.sin(2*np.pi*3*f*t)*np.exp(-t*12)
    elif kind=='pad': s=sum(np.sin(2*np.pi*f*(1+d)*t) for d in(-0.004,0,0.005))/3+0.3*np.sin(2*np.pi*2*f*t)
    else: s=np.sin(2*np.pi*f*t)
    return s*env(n,a,r)*amp
def kick(): n=int(0.35*SR); t=np.arange(n)/SR; f=50+120*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def hat(d=0.05): n=int(d*SR); x=np.random.randn(n); x=np.diff(x,prepend=0); return x*np.exp(-np.arange(n)/SR*60)*0.25
def clap(): n=int(0.2*SR); x=np.random.randn(n); return x*np.exp(-np.arange(n)/SR*25)*0.35
def hz(m): return 440*2**((m-69)/12)
def add(buf,s,t):
    i=int(t*SR); j=min(len(buf),i+len(s));
    if i<len(buf): buf[i:j]+=s[:j-i]
def lp(x,a=0.15):
    y=np.zeros_like(x); acc=0
    # one-pole lowpass via cumulative filter (vectorised-ish)
    try:
        from scipy.signal import lfilter
        return lfilter([a],[1,a-1],x)
    except ImportError:  # scipy.signal blocked (e.g. Windows Application Control): same one-pole filter in pure Python
        k=1-a; out=[0.0]*len(x); acc=0.0
        for i,v in enumerate(x.tolist()): acc=a*v+k*acc; out[i]=acc
        return np.array(out)
def theme_a(L):
    bpm=124; b=60/bpm; buf=np.zeros(int(L*SR)); bass=np.zeros_like(buf); syn=np.zeros_like(buf)
    prog=[(57,[57,60,64]),(53,[53,57,60]),(48,[48,52,55]),(55,[55,59,62])]
    beats=int(L/b)
    for i in range(beats):
        t=i*b; bar=(i//4)%4; root,ch=prog[bar]
        if i>=4: add(buf,kick(),t)
        add(buf,hat(),t+b/2)
        if i%2==1 and i>=4: add(buf,clap()*0.8,t)
        for k in range(2): add(bass,note(hz(root-24),b/2*0.9,'saw',r=0.12,amp=0.5),t+k*b/2)
        arp=ch+[ch[1]+12]
        for k in range(4): add(syn,note(hz(arp[(i*4+k)%4]+12),b/4,'sq',r=0.08,amp=0.12),t+k*b/4)
    # riser into 1st second
    n=int(1.2*SR); r=np.random.randn(n)*np.linspace(0,0.25,n); add(buf,lp(r,0.3),0)
    return buf*0.9+lp(bass,0.12)*1.2+lp(syn,0.35)
def theme_b(L,turn):
    bpm=112; b=60/bpm; buf=np.zeros(int(L*SR)); mel=np.zeros_like(buf); bass=np.zeros_like(buf)
    sad=[(57,[57,60,64]),(53,[53,57,60])]; happy=[(60,[60,64,67]),(55,[55,59,62]),(57,[57,60,64]),(53,[53,57,60])]
    for i in range(int(L/b)):
        t=i*b
        if t<turn:
            root,ch=sad[(i//4)%2]
            if i%4==0: [add(mel,note(hz(n),b*4,'pad',a=0.4,r=2,amp=0.12),t) for n in ch]
            add(mel,note(hz(ch[i%3]+12),b,'pluck',r=0.25,amp=0.12),t)
        else:
            root,ch=happy[(i//4)%4]
            add(buf,kick()*0.8,t); add(buf,hat(0.03),t+b/2)
            if i%2==1: add(buf,clap()*0.7,t)
            add(bass,note(hz(root-24),b*0.8,'sine',r=0.3,amp=0.6),t)
            pat=[ch[0]+12,ch[2]+12,ch[1]+12,ch[2]+12]
            for k in range(2): add(mel,note(hz(pat[(i*2+k)%4]),b/2,'pluck',r=0.2,amp=0.16),t+k*b/2)
    return buf+mel+bass
def theme_c(L):
    bpm=76; b=60/bpm; buf=np.zeros(int(L*SR)); pno=np.zeros_like(buf)
    prog=[[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61]]
    for i in range(int(L/(b*4))+1):
        t=i*b*4; ch=prog[i%4]
        for n in ch: add(buf,note(hz(n),b*4.5,'pad',a=1.2,r=3,amp=0.09),t)
        add(buf,note(hz(ch[0]-12),b*4,'sine',a=0.05,r=1.5,amp=0.35),t)
        arp=[ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12,ch[1]+24,ch[3]+12,ch[2]+12,ch[3]+12]
        for k in range(8): add(pno,note(hz(arp[k]),b*1.5,'pluck',a=0.003,r=0.6,amp=0.09),t+k*b/2)
    return lp(buf,0.2)*1.3+pno
L={}
args=sys.argv[1:]
for k in range(0,len(args),2): L[args[k]]=float(args[k+1])
import json
for th,dur in L.items():
    np.random.seed(3)
    if th=='a': x=theme_a(dur)
    elif th=='b':
        turn=[p['start'] for p in json.load(open('b/timeline.json'))['phrases'] if p['s']=='turn'][0]
        x=theme_b(dur,turn)
    else: x=theme_c(dur)
    n=len(x); fade=int(1.5*SR); x[-fade:]*=np.linspace(1,0,fade); x[:int(0.05*SR)]*=np.linspace(0,1,int(0.05*SR))
    x=x/np.abs(x).max()*0.85; st=np.stack([x,np.roll(x,int(0.012*SR))],1)
    w.write(f'{th}/music.wav',SR,(st*32767).astype(np.int16)); print(th,'ok')
