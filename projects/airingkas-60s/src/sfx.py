# Synthesize SFX track from out/events.json + extra cues.
import json, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; DUR=60.0; rng=np.random.default_rng(7)
out=np.zeros(int(SR*DUR))
def env(n,a,d):
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def add(t,x,g=1.0):
    i=int(t*SR); x=x[:len(out)-i]; out[i:i+len(x)]+=x*g
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],btype='band',fs=SR,output='sos'),x)
def lp(x,f): return sosfilt(butter(2,f,btype='low',fs=SR,output='sos'),x)
def whoosh(d=0.5,lo=300,hi=4000,g=.5):
    n=int(d*SR); x=rng.standard_normal(n); t=np.linspace(0,1,n)
    y=np.zeros(n); seg=8
    for k in range(seg):
        a,b=k*n//seg,(k+1)*n//seg; f=lo+(hi-lo)*(k/seg)
        y[a:b]=bp(x[a:b],max(80,f*0.6),min(SR/2-100,f*1.4))
    return y*np.sin(np.pi*t)**1.5*g
def pop(f0=500,f1=1100,d=0.09):
    n=int(d*SR); t=np.arange(n)/SR; f=np.linspace(f0,f1,n)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.002,0.03)*.6
def impact():
    n=int(0.6*SR); t=np.arange(n)/SR; f=110*np.exp(-t*6)+45
    body=np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.002,0.18)
    crack=lp(rng.standard_normal(n),2500)*env(n,0.001,0.04)
    return (body*0.9+crack*0.5)
def tick(f=2500): n=int(0.03*SR); return bp(rng.standard_normal(n),f*0.7,f*1.3)*env(n,0.0005,0.006)*1.2
def bell(f=1320,d=1.0):
    n=int(d*SR); t=np.arange(n)/SR
    return sum(np.sin(2*np.pi*f*m*t)*a for m,a in [(1,1),(2.76,.4),(5.4,.2)])*env(n,0.002,0.3)*.35
def sparkle():
    y=np.zeros(int(0.8*SR))
    for k in range(9):
        b=bell(rng.uniform(2200,4200),0.4)*0.5; i=int(k*0.06*SR); y[i:i+len(b)]+=b[:len(y)-i]
    return y
def swish(): return whoosh(0.3,800,3000,.25)
import os
OUT=os.environ.get('OUT','out'); THEME=os.environ.get('THEME','v1')
ev=json.load(open(OUT+'/events.json'))
for e in ev:
    t,fx=e['t'],e['fx']
    if fx=='slam': add(t+0.05,impact(),.8); add(t-0.12,whoosh(0.2,500,3000,.25))
    elif fx=='pop': add(t,pop(450+rng.uniform(0,150),1100+rng.uniform(0,300)),.7)
    elif fx in('left','right'): add(t-0.05,whoosh(0.35,400,3500,.35))
    elif fx in('up','down'): add(t,swish(),.6)
    elif fx=='zoom': add(t,whoosh(0.45,200,1500,.35))
    elif fx=='stamp': add(t+0.04,impact(),.7); add(t+0.1,bell(1568,0.5),.4)
    elif fx=='tilt': add(t-0.05,whoosh(0.6,200,2500,.45))
    elif fx=='drop': add(t,whoosh(0.25,600,3000,.25)); add(t+0.2,pop(300,700),.6)
    elif fx=='swing': add(t,whoosh(0.35,300,2500,.4)); add(t+0.3,bell(1760,0.6),.6); add(t+0.36,bell(2350,0.6),.5)
    elif fx=='wipe': add(t,whoosh(0.6,150,5000,.75))
# extra cues
if THEME=='ed':
    for k in range(10): add(0.5+k*0.11,tick(3800),.5)         # typing
    add(3.05,whoosh(0.5,1200,4000,.3)); add(53.05,whoosh(0.6,1200,4000,.3))  # pen circles
    add(6.35,whoosh(0.6,800,5000,.3)); add(5.95,sparkle(),.5)
    for k in range(6): add(34.1+0.11*(k+1),tick(2600+k*200),.9)
    add(45.2,whoosh(0.3,1500,6000,.4))
    add(52.0+0.06,bell(1318,0.9),.8); add(52.18,bell(1760,0.9),.8)
    for k,tt in enumerate([45.6,46.1,46.6]): add(tt+0.1,bell(1760+k*220,0.4),.45)
else:
  for k in range(9): add(0.6+k*0.5,tick(3200),.35)              # clock ticking
  add(15.3,tick(1800),1.0); add(15.4,bell(1568,0.6),.7)           # copy click + ding
  r=whoosh(1.1,200,2500,.25); add(32.75,r)                        # progress riser
  add(33.85,bell(1975,0.7),.6)
  for k in range(6): add(34.1+0.11*(k+1),tick(2600+k*200),.9)    # streak count
  add(45.3,whoosh(0.3,1500,6000,.4))                              # strike
  add(51.6+0.06,bell(1318,0.9),.8); add(51.78,bell(1760,0.9),.8)  # ding-ding CTA
  add(53.05,sparkle(),.7); add(55.4,sparkle(),.6)
out=out/max(1e-6,np.abs(out).max())*0.9
wavfile.write(os.environ.get('SFX','assets/sfx.wav'),SR,(out*32767).astype(np.int16))
print('events',len(ev))
