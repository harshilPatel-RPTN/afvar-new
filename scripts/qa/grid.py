import sys,glob
from PIL import Image
tag,out=sys.argv[1],sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 2; cw=int(sys.argv[4]) if len(sys.argv)>4 else 720
fs=sorted(glob.glob(f'{tag}-*.png'))
ims=[Image.open(f) for f in fs]
ims=[im.resize((cw,int(im.height*cw/im.width))) for im in ims]
ch=max(im.height for im in ims); rows=(len(ims)+cols-1)//cols
W=Image.new('RGB',(cw*cols,ch*rows))
for i,im in enumerate(ims): W.paste(im,((i%cols)*cw,(i//cols)*ch))
W.save(out); print(len(fs))
