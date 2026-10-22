# Cap long pauses, speed up slightly, and write chunk timings (marks.json).
import subprocess, re, json, sys
src, out, tempo, lead = sys.argv[1], sys.argv[2], float(sys.argv[3]), 0.3
log = subprocess.run(['ffmpeg','-hide_banner','-i',src,'-af','silencedetect=n=-35dB:d=0.15','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]
en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src]))
chunks=[]; cur=0.0
for s,e in zip(st,en):
    if s-cur>0.08: chunks.append([cur,s])
    cur=e
chunks.append([cur,dur])
# merge chunks shorter than 0.25s into previous
m=[]
for c in chunks:
    if m and c[1]-c[0]<0.25: m[-1][1]=c[1]
    else: m.append(c)
chunks=m
CAP=0.24
parts=[]; t=0; marks=[]
for i,(a,b) in enumerate(chunks):
    a0=max(0,a-0.04); b0=min(dur,b+0.04)
    parts.append((a0,b0))
    marks.append([t,t+(b0-a0)]); t+=b0-a0
    if i<len(chunks)-1:
        gap=min(CAP,chunks[i+1][0]-b)
        parts.append(('sil',gap)); t+=gap
fc=[];labels=[]
for k,p in enumerate(parts):
    if p[0]=='sil': fc.append(f"anullsrc=r=44100:cl=mono,atrim=0:{p[1]:.3f}[p{k}]")
    else: fc.append(f"[0:a]atrim={p[0]:.3f}:{p[1]:.3f},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono[p{k}]")
    labels.append(f"[p{k}]")
fc.append(''.join(labels)+f"concat=n={len(parts)}:v=0:a=1,atempo={tempo},adelay={int(lead*1000)}[o]")
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',src,'-filter_complex',';'.join(fc),'-map','[o]','-ar','48000',out],check=True)
marks=[[round(lead+a/tempo,3),round(lead+b/tempo,3)] for a,b in marks]
json.dump(marks,open('marks.json','w'))
for i,mk in enumerate(marks): print(i,mk)
