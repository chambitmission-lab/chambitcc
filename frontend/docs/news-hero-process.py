# -*- coding: utf-8 -*-
"""소식 허브 히어로 배경 후처리 (docs/news-hero-bg-prompts.md 참고)

Gemini 원본 6장(1~6.png, 1456x720)을 받아
  1) 워터마크 제거 -- 인페인트가 아니라 '알파 역산'
  2) 제미나이가 잘못 그린 것 제거 -- 사각형 하늘 패널(4·6), 진짜로 그려버린 UI pill(2)
  3) 아래로 캔버스를 늘리고 왼쪽/아래 알파 페이드를 구운 뒤 webp 로 저장
까지 한 번에 한다.

    python docs/news-hero-process.py [원본폴더]

원본 순서 = 프롬프트 순서: 1 행사L / 2 새가족L / 3 소식L / 4 행사D / 5 새가족D / 6 소식D
"""
import sys
from PIL import Image
import numpy as np, os

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")

def load(i):
    return np.asarray(Image.open(os.path.join(SRC, f"{i}.png")).convert("RGB")).astype(np.float32)

def gauss1d(v, sigma):
    r = int(sigma*3)
    k = np.exp(-0.5*(np.arange(-r, r+1)/sigma)**2); k /= k.sum()
    return np.convolve(np.pad(v, r, mode='edge'), k, mode='valid')

def coons(a, x0, x1, y0, y1, pad=4):
    """fill rect [x0,x1)x[y0,y1) from its boundary (transfinite/Coons interpolation)"""
    out = a.copy()
    L = np.median(a[y0:y1, x0-pad:x0], axis=1)          # (h,c)
    R = np.median(a[y0:y1, x1:x1+pad], axis=1)
    T = np.median(a[y0-pad:y0, x0:x1], axis=0)          # (w,c)
    B = np.median(a[y1:y1+pad, x0:x1], axis=0)
    h, w = y1-y0, x1-x0
    u = np.linspace(0, 1, w)[None, :, None]
    v = np.linspace(0, 1, h)[:, None, None]
    Lc, Rc, Tc, Bc = L[:, None, :], R[:, None, :], T[None, :, :], B[None, :, :]
    c00, c10 = a[y0-1, x0-1], a[y0-1, x1]
    c01, c11 = a[y1, x0-1], a[y1, x1]
    corner = ((1-u)*(1-v)*c00 + u*(1-v)*c10 + (1-u)*v*c01 + u*v*c11)
    out[y0:y1, x0:x1] = (1-u)*Lc + u*Rc + (1-v)*Tc + v*Bc - corner
    return out

def feather_vedge(a, E, F, y0=0, y1=None, sigma=12):
    """turn a hard vertical step at column E into a smooth ramp of half-width F"""
    y1 = a.shape[0] if y1 is None else y1
    out = a.copy()
    left = a[:, E-10:E-2].mean(axis=1)   # (H,c)
    right = a[:, E+2:E+10].mean(axis=1)
    delta = right - left
    for c in range(3):
        delta[:, c] = gauss1d(delta[:, c], sigma)
    x = np.arange(a.shape[1])
    t = np.clip((x - (E-F)) / (2.0*F), 0, 1)
    S = t*t*(3-2*t)                                     # smoothstep
    step = (x >= E).astype(np.float32)
    prof = (S - step)[None, :, None]                    # (1,W,1)
    mask = np.zeros(a.shape[0], np.float32); mask[y0:y1] = 1
    mask = gauss1d(mask, 10)[:, None, None]
    out += prof * delta[:, None, :] * mask
    return out

def feather_hedge(a, E, F, x0=0, x1=None, sigma=12):
    y = np.swapaxes(a, 0, 1)
    r = feather_vedge(y, E, F, x0, x1, sigma)
    return np.swapaxes(r, 0, 1)

def soften_line(a, E, half=7, blur=11, vertical=True, lo=0, hi=None):
    """kill the residual 1-3px hairline left at a repaired edge"""
    if not vertical:
        return np.swapaxes(soften_line(np.swapaxes(a,0,1), E, half, blur, True, lo, hi), 0, 1)
    hi = a.shape[0] if hi is None else hi
    out = a.copy()
    k = np.ones(blur, np.float32)/blur
    seg = a[lo:hi, E-half-blur:E+half+blur]
    sm = np.empty_like(seg)
    for c in range(3):
        pad = np.pad(seg[:,:,c], ((0,0),(blur//2,blur//2)), mode='edge')
        sm[:,:,c] = np.apply_along_axis(lambda r: np.convolve(r, k, mode='valid'), 1, pad)
    x = np.arange(seg.shape[1]) - (half+blur)
    w = np.clip(1.0 - (np.abs(x)/float(half))**2, 0, 1)[None,:,None]
    out[lo:hi, E-half-blur:E+half+blur] = seg*(1-w) + sm*w
    return out


# ── 워터마크 알파 맵: 다크 원본(5번)의 평평한 바닥 위에서 역산한다 ──
# 워터마크는 순수 흰색(255)을 고정 알파로 올린 합성이라, 주변에서 배경을 복원하면
#   a = (obs - bg) / (255 - bg) 로 풀린다(피크 ~0.31). 그 다음 모든 장에
#   bg = (obs - 255a) / (1 - a) 를 적용하면 캐릭터에 겹쳐도 자국 없이 벗겨진다.
X0, X1, Y0, Y1 = 1300, 1376, 562, 638
_a5 = load(5)
_bg = coons(_a5, X0, X1, Y0, Y1)[Y0:Y1, X0:X1]
A = np.clip(((_a5[Y0:Y1, X0:X1] - _bg) / np.maximum(255.0 - _bg, 1e-3)).mean(axis=2), 0, 1)
A[A < 0.03] = 0

X0,X1,Y0,Y1 = 1300,1376,562,638

def unwatermark(a):
    out = a.copy()
    patch = out[Y0:Y1, X0:X1]
    al = A[:, :, None]
    out[Y0:Y1, X0:X1] = np.clip((patch - 255.0*al) / (1.0 - al), 0, 255)
    return out

def clean(i):
    a = load(i)
    if i == 4:
        # Gemini drew a bright light-mode "sky panel" rectangle over the top-right:
        # dim it (protecting the lantern highlights), then melt both hard edges away.
        def smooth(t):
            t = np.clip(t, 0, 1); return t*t*(3-2*t)
        Hh, Ww, _ = a.shape
        xx = np.arange(Ww)[None, :]; yy = np.arange(Hh)[:, None]
        F = 150
        M = smooth((xx-(541-F))/(2.0*F)) * smooth(((269+F)-yy)/(2.0*F))
        hl = smooth((a.mean(axis=2)-205)/45.0)
        a = a * (1.0 - 0.58*M*(1.0-hl))[:, :, None]
        a = feather_vedge(a, 541, 130, 0, 300)
        a = feather_hedge(a, 269, 130, 470, 1456)
        a = soften_line(a, 541, vertical=True, lo=0, hi=300)
        a = soften_line(a, 269, vertical=False, lo=440, hi=1456)
    if i == 6:
        a = feather_vedge(a, 504, 110, 0, 430)
        a = soften_line(a, 504, vertical=True, lo=0, hi=440)
    a = unwatermark(a)
    if i == 2:
        a = coons(a, 1206, 1418, 596, 696, pad=5)   # the literal UI pill Gemini drew
    return np.clip(a, 0, 255)


OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "news")
os.makedirs(OUT, exist_ok=True)

# i: (name, out height, left fade [x0,x1], bottom fade [y0,y1])
CFG = {
    1: ("event-album-light", 1100, (170, 720), (700, 1060)),
    2: ("new-family-light",  1100, (170, 720), (700, 1060)),
    3: ("church-news-light", 1080, (210, 760), (640, 1040)),
    4: ("event-album-dark",  1100, (170, 720), (700, 1060)),
    5: ("new-family-dark",   1100, (170, 720), (700, 1060)),
    6: ("church-news-dark",  1080, (210, 760), (640, 1040)),
}

def smooth(t):
    t = np.clip(t, 0, 1); return t*t*(3-2*t)

for i, (name, H, (lx0, lx1), (by0, by1)) in CFG.items():
    a = clean(i)
    h, w, _ = a.shape
    # 아래로 캔버스를 늘린다 — 늘린 띠는 어차피 알파로 사라진다(통계/토글/검색창 자리)
    pad = np.repeat(a[-1:], H-h, axis=0)
    a = np.concatenate([a, pad], axis=0)
    x = np.arange(w)[None, :]; y = np.arange(H)[:, None]
    alpha = smooth((x - lx0) / float(lx1 - lx0)) * smooth((by1 - y) / float(by1 - by0))
    rgba = np.dstack([a, np.clip(alpha, 0, 1)*255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    p = os.path.join(OUT, name + ".webp")
    im.save(p, "WEBP", quality=80, method=6, alpha_quality=92)
    print(f"{name}.webp  {im.size}  {os.path.getsize(p)/1024:.1f}KB")
