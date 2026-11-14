import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
S=os.path.dirname(os.path.abspath(__file__))
FONT='/System/Library/Fonts/AppleSDGothicNeo.ttc'
def bold():
    for i in range(20):
        try:
            f=ImageFont.truetype(FONT,100,index=i)
            if f.getname()[1] in ('Bold','ExtraBold'): return i
        except Exception: break
    return 0
IDX=bold()
def fix(src,dst,yoff=0,night=True):
    im=Image.open(src).convert('RGB'); a=np.asarray(im).astype(float)
    x0,x1,y0,y1=283,329,1194-yoff,1214-yoff
    reg=a[y0:y1,x0:x1].copy()
    lum=reg.mean(2)
    # 글자색 = 가장 밝은(밤) 픽셀 평균
    thr=np.percentile(lum,92 if night else 8)
    sel=lum>=thr if night else lum<=thr
    col=reg[sel].mean(0)
    # 바탕 복원: 열마다 위·아래 벽 색을 세로 보간
    top=a[y0-3:y0,x0:x1].mean(0); bot=a[y1:y1+3,x0:x1].mean(0)
    h=y1-y0
    t=(np.arange(h)+0.5)/h
    fill=top[None]*(1-t)[:,None,None]+bot[None]*t[:,None,None]
    orig=a[y0:y1,x0:x1]
    # 원래 질감(저주파 노이즈)을 조금 남긴다
    a[y0:y1,x0:x1]=fill
    # 새 글자: 8배로 그려 축소
    K=8; W,H=(x1-x0)*K,h*K
    m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m)
    f=ImageFont.truetype(FONT,int(13.0*K),index=IDX)
    txt='참빛교회'
    bb=d.textbbox((0,0),txt,font=f)
    tw=bb[2]-bb[0]; th=bb[3]-bb[1]
    sp=(40*K-tw)/3 if tw<40*K else 0
    x=(W-(tw+sp*3))/2-bb[0]; y=(H-th)/2-bb[1]
    for ch in txt:
        d.text((x,y),ch,font=f,fill=255); x+=d.textlength(ch,font=f)+sp
    glow=m.filter(ImageFilter.GaussianBlur(K*1.6)).resize((x1-x0,h),Image.LANCZOS)
    m=m.resize((x1-x0,h),Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.35))
    al=np.asarray(m)[...,None]/255.0; gl=np.asarray(glow)[...,None]/255.0
    r=a[y0:y1,x0:x1]
    if night: r=r+(col-r)*np.clip(gl*0.35,0,1)
    r=r+(col-r)*np.clip(al*1.15,0,1)
    a[y0:y1,x0:x1]=r
    Image.fromarray(np.clip(a,0,255).astype('uint8')).save(dst)
if __name__=='__main__':
    fix(sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4]=='night')
