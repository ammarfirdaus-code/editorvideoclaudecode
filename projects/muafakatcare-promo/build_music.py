# Royalty-free procedural bed: warm, hopeful pop (bells, pluck, pad, soft kick). python3 build_music.py 33
import sys,numpy as np,scipy.io.wavfile as w
from scipy.signal import lfilter
SR=44100; L=float(sys.argv[1]) if len(sys.argv)>1 else 33; np.random.seed(5)
hz=lambda m:440*2**((m-69)/12)
def env(n,a,r): t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/r)
def tone(f,d,kind,a=.005,r=.4,amp=1):
    n=int(d*SR); t=np.arange(n)/SR
    if kind=='bell': s=np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*2.76*f*t)*np.exp(-t*3)+.3*np.sin(2*np.pi*5.4*f*t)*np.exp(-t*6)
    elif kind=='pluck': s=np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*2*f*t)*np.exp(-t*7)
    elif kind=='pad': s=sum(np.sin(2*np.pi*f*(1+d)*t) for d in(-.004,0,.005))/3
    else: s=np.sin(2*np.pi*f*t)
    return s*env(n,a,r)*amp
def add(b,s,t):
    i=int(t*SR); j=min(len(b),i+len(s))
    if 0<=i<len(b): b[i:j]+=s[:j-i]
def kick(): n=int(.3*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(45+90*np.exp(-t*28))/SR)*np.exp(-t*10)
def shk(): n=int(.06*SR); x=np.diff(np.random.randn(n),prepend=0); return x*np.exp(-np.arange(n)/SR*50)*.12
lp=lambda x,a:lfilter([a],[1,a-1],x)
bpm=100; b=60/bpm; N=int(L*SR); dr=np.zeros(N); pad=np.zeros(N); mel=np.zeros(N); bas=np.zeros(N)
prog=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]]   # Cmaj7 Am7 Fmaj7 G7
for bar in range(int(L/(4*b))+1):
    t0=bar*4*b; ch=prog[bar%4]
    for n_ in ch: add(pad,tone(hz(n_),4*b+1,'pad',a=.8,r=3,amp=.10),t0)
    for k in range(8):
        t=t0+k*b/2
        add(mel,tone(hz([ch[0],ch[2],ch[1],ch[3]][k%4]+12),.9,'pluck',r=.35,amp=.13),t)
        if bar>=1: add(dr,shk(),t+b/4)
    for k in range(4):
        t=t0+k*b
        if bar>=1 or k>=2: add(dr,kick()*.7,t)
        add(bas,tone(hz(ch[0]-24),b*.9,'sine',a=.01,r=.5,amp=.45),t)
    if bar%2==0: [add(mel,tone(hz(ch[i]+24),2.5,'bell',r=1.0,amp=.07),t0+i*.12) for i in range(3)]
# sparkle hits at scene changes
for t in [0.1,3.45,9.25,12.65,20.1,24.75,28.0]:
    for i,m in enumerate([84,88,91,96]): add(mel,tone(hz(m),2,'bell',r=.8,amp=.06),t+i*.05)
x=lp(pad,.25)*1.2+mel+dr+lp(bas,.2)*1.3
f=int(2*SR); x[-f:]*=np.linspace(1,0,f); x[:int(.03*SR)]*=np.linspace(0,1,int(.03*SR))
x=x/np.abs(x).max()*.85; st=np.stack([x,np.roll(x,int(.011*SR))],1)
w.write('music.wav',SR,(st*32767).astype(np.int16)); print('music.wav',L)
