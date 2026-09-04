# -*- coding: utf-8 -*-
"""읽기 플랜 히어로 배경 후처리 (docs/plan-hero-bg-prompts.md 참고)

Gemini 원본 2장(1.png 라이트 / 2.png 다크, 1792x592)을 받아
  1) 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'
  2) 위로 캔버스를 늘려 2.2:1 로 만든다 (모바일에서 삽화가 글씨를 덮지 않게 하는 유일한 레버)
  3) 왼쪽 알파 페이드를 굽고 1536 폭 webp 로 저장
까지 한 번에 한다.

    python docs/plan-hero-process.py [원본폴더]
"""
import sys, os
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "plans")

RATIO   = 2.2            # 최종 가로:세로 — 아래 "왜 2.2:1 인가" 참고
FADE    = (0.50, 0.86)   # 왼쪽 알파 페이드 구간 (폭 비율)
WIDTH   = 1536
CX, CY, R = 1671.5, 471.5, 27.0     # 워터마크 ✦ 중심/반경 (1792x592 기준)

def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert("RGB")).astype(np.float32)

def smooth(t):
    t = np.clip(t, 0, 1); return t*t*(3-2*t)

def gauss1d(v, sigma):
    r = max(1, int(sigma*3))
    k = np.exp(-0.5*(np.arange(-r, r+1)/sigma)**2); k /= k.sum()
    return np.convolve(np.pad(v, r, mode='edge'), k, mode='valid')

# ── 1. 워터마크 알파 맵 ────────────────────────────────────────────────
# ✦ 는 순수 흰색(255)을 고정 알파로 올린 합성이다. 다크 원본에서 별 둘레의
# 평평한 남색 바닥을 2차 다항식으로 맞춰 배경을 복원하면 a 가 풀린다(피크 0.31).
# 별의 왼쪽 아래는 책 모서리에 겹쳐 있어 신뢰할 수 없으므로, ✦ 가 좌우 대칭인 걸
# 이용해 오른쪽 절반에서만 재고 미러링해 채운다.
def watermark_alpha(dark):
    P = 46
    x0, x1 = int(CX-P+0.5), int(CX+P+0.5)
    y0, y1 = int(CY-P+0.5), int(CY+P+0.5)
    box = dark[y0:y1, x0:x1]
    h, w, _ = box.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    gx, gy = xx+x0-CX, yy+y0-CY
    rr = np.hypot(gx, gy)
    clean = (rr > R+2) & ((gx > 6) | (gy < -12))          # 책·별을 뺀 맨바닥
    D = np.stack([np.ones_like(gx), gx, gy, gx*gx, gx*gy, gy*gy], axis=-1)
    m = clean.copy()
    for _ in range(6):
        coef = [np.linalg.lstsq(D[m], box[..., c][m], rcond=None)[0] for c in range(3)]
        fit = np.stack([D@coef[c] for c in range(3)], axis=-1)
        r = np.abs(box-fit).mean(axis=2)
        m = clean & (r < max(2.0, 4*np.median(r[clean])))
    a = np.clip(((box-fit)/np.maximum(255.0-fit, 1e-3)).mean(axis=2), 0, 1)
    a = np.where(gx > 0, a, 0.0)                          # 오른쪽 절반만 신뢰
    a = np.maximum(a, a[:, ::-1])                         # 좌우 대칭으로 복원
    a[rr > R+2] = 0
    a[a < 0.03] = 0
    return a, (x0, x1, y0, y1)

def unwatermark(img, A, box):
    x0, x1, y0, y1 = box
    out = img.copy()
    al = A[:, :, None]
    out[y0:y1, x0:x1] = np.clip((out[y0:y1, x0:x1] - 255.0*al)/(1.0-al), 0, 255)
    return out

# ── 2. 위로 캔버스 늘리기 ──────────────────────────────────────────────
# 원본 3.03:1 을 그대로 cover 로 깔면 모바일(358x216)에서 삽화가 폭 242px 를
# 차지해 안내 문구를 통째로 덮는다. cover 는 높이로 스케일이 정해지므로
# **위에 빈 하늘을 덧대 세로를 늘리는 것**만이 모바일에서 그림을 줄이는 방법이다.
# 늘린 띠는 맨 윗줄을 위로 갈수록 더 세게 가로 블러해 채운다 —
# 그냥 복제하면 다크의 등불 광채가 세로 줄무늬로 뻗는다.
def extend_top(a, ratio):
    h, w, _ = a.shape
    H = int(round(w/ratio))
    pad = H - h
    base = np.median(a[:8], axis=0)
    rows = np.empty((pad, w, 3), np.float32)
    for i in range(pad):
        t = (pad-1-i)/max(pad-1, 1)                       # 0=이음매, 1=맨 위
        sig = 6 + 150*t*t
        for c in range(3):
            rows[i, :, c] = gauss1d(base[:, c], sig)
    return np.concatenate([rows, a], axis=0)

def run():
    os.makedirs(OUT, exist_ok=True)
    dark = load("2.png")
    A, box = watermark_alpha(dark)
    print(f"watermark alpha peak {A.max():.3f}  area {(A>0).sum()}")
    for name, out_name in [("1.png", "hero-light"), ("2.png", "hero-dark")]:
        a = unwatermark(load(name), A, box)
        a = extend_top(a, RATIO)
        H, W, _ = a.shape
        x = np.arange(W)[None, :]
        al = smooth((x - FADE[0]*W)/((FADE[1]-FADE[0])*W)) * np.ones((H, 1), np.float32)
        rgba = np.dstack([np.clip(a, 0, 255), al*255]).astype(np.uint8)
        im = Image.fromarray(rgba, "RGBA").resize((WIDTH, int(round(H*WIDTH/W))), Image.LANCZOS)
        p = os.path.join(OUT, out_name + ".webp")
        im.save(p, "WEBP", quality=80, method=6, alpha_quality=92)
        print(f"{out_name}.webp  {im.size}  {os.path.getsize(p)/1024:.1f}KB")

if __name__ == "__main__":
    run()
