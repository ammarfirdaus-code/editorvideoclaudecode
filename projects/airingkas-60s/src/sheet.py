import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]
W,H=360,640; cols=min(4,len(fs)); rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*W,rows*(H+30)),'white'); d=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize((W,H)); x=(i%cols)*W; y=(i//cols)*(H+30)
    S.paste(im,(x,y+30)); d.text((x+8,y+8),f.split('_')[-1],fill='black')
S.save(out)
