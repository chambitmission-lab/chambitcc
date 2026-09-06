# -*- coding: utf-8 -*-
"""읽기 플랜 히어로 배경 후처리 (docs/plan-hero-bg-prompts.md 참고)

Gemini 원본 2장(1.png 라이트 / 2.png 다크, 1792x592)을 받아
  1) 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'
  2) 위로 캔버스를 늘려 2.2:1 로 만든다 (모바일에서 삽화가 글씨를 덮지 않게 하는 유일한 레버)
  3) 왼쪽 알파 페이드를 굽고 1536 폭 webp 로 저장
까지 한 번에 한다.

    python docs/plan-hero-process.py [원본폴더] [대상폴더명]

대상폴더명은 public/images/ 아래 이름(기본 plans). 공동 묵상방 히어로는 rooms —
docs/rooms-hero-bg-prompts.md 가 같은 규격(2.2:1)이라 이 스크립트를 그대로 쓴다.
"""
import sys, os
import numpy as np
import scipy.ndimage as nd
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
DEST = sys.argv[2] if len(sys.argv) > 2 else "plans"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", DEST)

RATIO   = 2.2            # 최종 가로:세로 — 아래 "왜 2.2:1 인가" 참고
# 왼쪽을 녹이는 구간(폭 비율). ★2026-09-05: '투명으로 파기' → '자기 하늘색으로 녹이기'.
#   1판은 이 구간의 알파를 0 으로 만들어 **카드 그라데이션이 비치게** 했다. 그런데 정작
#   사용자가 좋아한 건 삽화 자신의 거의 검은 별밤 하늘이었고, 그 자리를 카드 남색이 덮고 있었다.
#   그렇다고 통짜로 불투명하게 깔면 통독표 왼쪽 끝이 모바일 안내문 위에서 밝게 뜬다(p95 160).
#   그래서 알파는 255 로 두고, 이 구간에서 **삽화를 자신의 하늘색으로** 녹인다.
#   별은 마스크의 열림 연산이 지켜 준다(blend_to_sky 주석) — 램프 구간은 통독표만 보고 잡으면 된다.
FADE    = (0.50, 0.90)
WIDTH   = 1536
CX, CY = 1671.5, 471.5   # 워터마크 ✦ 중심 (1792x592 기준) — 두 세대 연속 같은 자리
BOXR   = 70              # 별 주변 작업 상자 반경

def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, name)).convert("RGB")).astype(np.float32)

    # ── 제미나이가 배경에 남기는 '가로 계단' 세 종류를 여기서 다 없앤다 ──────────
    # 프롬프트에 "no straight background edges anywhere" 를 넣어도 거의 매번 그린다.
    # 대비가 2~5 밖에 안 되지만 **완벽하게 곧고 화면을 가로지르므로** 그림이 아니라
    # 렌더링 이음매로 읽힌다. 카드가 214px 로 납작해서 더 눈에 띈다.

    # (1) 맨 위 하늘 띠 — 그대로 두면 extend_top 이 그 띠 색으로 천장을 채워
    #     모바일 카드에 이음매 한 줄이 그대로 남는다.
    col = a[:200, :600].mean((1, 2))
    d = np.abs(np.diff(col))
    i = int(np.argmax(d))
    if d[i] > 4:
        print(f"  {name}: 상단 하늘 띠 엣지 row {i+1} (jump {d[i]:.1f}) 잘라냄")
        a = a[i+1:]

    # (2) 맨 아래 1~2행 — 카드는 bottom 정렬이라 이 몇 줄이 카드 최하단에 그대로 깔린다.
    col = a[:, :600].mean((1, 2))
    while len(col) > 3 and abs(col[-1] - col[-2]) > 1.0:
        a, col = a[:-1], col[:-1]

    # (3) 중간의 지평선 — 배경(빈 하늘) 열에서만 녹인다. 언덕·책·양의 실루엣은
    #     content 마스크가 지켜 주므로 장면은 그대로 남고 허공의 직선만 사라진다.
    d = np.abs(np.diff(col))
    for r in np.where(d[5:len(col)-5] > 1.5)[0] + 6:
        if r < 5 or r > len(col) - 5:
            continue
        print(f"  {name}: 지평선 계단 row {r} (jump {d[r-1]:.1f}) 녹임")
        a = soften_hstep(a, int(r))
    return a


def sky_model(a):
    """행마다 x 에 대한 1차식으로 맞춘 '빈 배경' 색. 통독표·삽화가 없는 x 5~58% 만 본다."""
    H, W, _ = a.shape
    lo, hi = int(W*0.05), int(W*0.58)
    xs = np.arange(lo, hi, dtype=np.float32)
    A = np.stack([np.ones_like(xs), xs], axis=1)
    coef = np.linalg.lstsq(A, a[:, lo:hi, :].transpose(1, 0, 2).reshape(len(xs), -1), rcond=None)[0]
    x = np.arange(W, dtype=np.float32)
    return (coef[0][None, :] + np.outer(x, coef[1])).reshape(W, H, 3).transpose(1, 0, 2)


def content_mask(a, grow=6, blur=4.0):
    """그려진 것(언덕·책·양·풀) = 배경색과 다른 자리. 열림 연산이 별·잔점을 떨어뜨린다."""
    big = np.abs(a - sky_model(a)).mean(2) > 8
    big = nd.binary_dilation(nd.binary_opening(big, disk(4)), disk(grow))
    return nd.gaussian_filter(big.astype(np.float32), blur)

def soften_hstep(a, row, hw=45):
    """가로 계단 한 줄을 세로 블러로 녹인다 — 배경인 열에서만.

    세로 방향 가우시안은 선형 그라데이션을 그대로 보존하고 계단만 완만한 램프로 바꾼다.
    가중치는 계단에서 1, ±hw 에서 0 인 스무스스텝이라 밴딩 없이 이어진다."""
    H, W, _ = a.shape
    r = np.arange(H, dtype=np.float32)
    w = smooth(1 - np.abs(r-row)/hw)
    blur = np.dstack([nd.gaussian_filter1d(a[:, :, c], hw/2.4, axis=0, mode="nearest") for c in range(3)])
    W3 = (w[:, None]*(1 - content_mask(a)))[:, :, None]
    return a*(1-W3) + blur*W3

def smooth(t):
    t = np.clip(t, 0, 1); return t*t*(3-2*t)

def gauss1d(v, sigma):
    r = max(1, int(sigma*3))
    k = np.exp(-0.5*(np.arange(-r, r+1)/sigma)**2); k /= k.sum()
    return np.convolve(np.pad(v, r, mode='edge'), k, mode='valid')

# ── 1. 워터마크 알파 맵 ────────────────────────────────────────────────
# ✦ 는 순수 흰색(255)을 **거의 일정한 알파(≈0.30)** 로 올린 하드 글리프이고,
# 모양은 x<->y 스왑에 대칭인 4각 별이다. 이 두 성질이 복원의 전부다.
#
# 1판은 별 둘레를 2차 다항식으로 맞춰 배경을 복원했는데, 2판에선 별이 **책 위**에
# (게다가 책의 밝은 윗모서리 하이라이트에) 걸려 그 맞춤이 무너졌다(알파 0.535, 정상의 두 배
# → 책 표지에 검은 얼룩). 그래서 배경 추정에 기대지 않는 방법으로 바꾼다:
#   1) 큰 원반 중앙값으로 대략의 배경을 잡아 잔차 → 알파 후보. 얇은 별은 지워지고
#      긴 엣지는 살아남으므로, 별이 놓인 바닥이 뭐든 후보는 잡힌다.
#   2) 알파 레벨 A 는 **세로 팔**(중심 열, 배경이 평평한 구간)의 중앙값으로만 잰다.
#   3) 행별 반폭 H(|t|) 를 재고 위/아래를 접어 큰 쪽을 취한다 → 오염된 띠는 자동으로 버려진다.
#   4) x<->y 대칭이므로 "행 조건 ∪ 열 조건"으로 래스터라이즈하면 가운데 띠까지 정확히 메워진다.
# TELEA 인페인트는 여전히 쓰지 말 것 — 주인공 실루엣을 빨아들여 얼룩이 남는다.
def disk(r):
    yy, xx = np.mgrid[-r:r+1, -r:r+1]
    return (yy*yy + xx*xx) <= r*r

def watermark_alpha(dark):
    x0, x1 = int(CX-BOXR), int(CX+BOXR)
    y0, y1 = int(CY-BOXR), int(CY+BOXR)
    box = dark[y0:y1, x0:x1].mean(2)
    bg = nd.median_filter(box, footprint=disk(25), mode="nearest")
    est = np.clip((box-bg)/np.maximum(255.0-bg, 1.0), 0, 0.45)

    h, w = box.shape
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
    gx -= (CX-x0); gy -= (CY-y0)

    core = est[(np.abs(gx) <= 2) & (np.abs(gy) > 8) & (np.abs(gy) < 22)]
    A = float(np.median(core[core > 0.15]))          # 알파 레벨 (2판 실측 0.2995)

    m = est > 0.45*A
    cxi = int(round(CX-x0))
    half = {}
    for t in range(-32, 33):                          # 중심을 지나는 연속 런만 인정
        r = int(round(CY-y0+t))
        if not (0 <= r < h) or not m[r, cxi]:
            continue
        l = cxi
        while l > 0 and m[r, l-1]: l -= 1
        rt = cxi
        while rt < w-1 and m[r, rt+1]: rt += 1
        half[t] = (rt-l+1)/2.0

    folded = {}
    for t, v in half.items():
        folded.setdefault(abs(t), []).append(v)
    prof = {k: max(v) for k, v in folded.items()}     # 오염된 쪽은 짧게 잘리므로 큰 쪽을 취한다
    best = 0.0
    for k in sorted(prof, reverse=True):              # 바깥→안쪽 단조 증가 보정
        best = max(best, prof[k]); prof[k] = best
    kmin, tips = min(prof), max(prof)

    def Hf(t):
        t = abs(t)
        if t <= kmin: return None                     # 코어 — 무조건 별 안쪽
        if t >= tips+1: return 0.0
        lo = int(np.floor(t))
        a = prof.get(lo, prof[kmin] if lo < kmin else 0.0)
        b = prof.get(lo+1, 0.0)
        return a + (b-a)*(t-lo)

    S = 4                                             # 4배 슈퍼샘플 래스터라이즈
    yy, xx = np.mgrid[0:h*S, 0:w*S].astype(np.float32)
    ax = np.abs((xx+0.5)/S - (CX-x0) - 0.5)
    ay = np.abs((yy+0.5)/S - (CY-y0) - 0.5)
    inside = (ax <= kmin) & (ay <= kmin)
    for arr, other in ((ay, ax), (ax, ay)):           # 행 조건 ∪ 열 조건 = 정확한 별
        for k in range(int(kmin), int(tips)+2):
            band = (arr >= k) & (arr < k+1)
            if not band.any(): continue
            h1 = Hf(k+0.5); h2 = Hf(k+1.5)
            if h1 is None: continue
            if h2 is None: h2 = h1
            inside[band] |= other[band] <= h1 + (h2-h1)*(arr[band]-k)
    mask = nd.gaussian_filter(inside.reshape(h, S, w, S).mean(axis=(1, 3)), 0.5)
    a = mask*A
    a[np.hypot(gx, gy) > tips+3] = 0
    a[a < 0.01] = 0
    return a, (x0, x1, y0, y1)

def unwatermark(img, A, box):
    """알파 역산: obs = bg(1-a) + 255a  →  bg = (obs - 255a)/(1-a)"""
    x0, x1, y0, y1 = box
    out = img.copy()
    al = A[:, :, None]
    out[y0:y1, x0:x1] = np.clip((out[y0:y1, x0:x1] - 255.0*al)/(1.0-al), 0, 255)
    return out

def despeckle(img, A, box):
    """알파 역산이 별 테두리에 남기는 얇은 윤곽 지우기.

    ✦ 가장자리 1px 은 실제 알파가 0~A 사이로 램프하는데 마스크는 사실상 이진이라,
    안/밖 어느 쪽으로 찍히든 밝거나 어두운 실선이 한 겹 남는다(다크에서 특히 보인다).
    마스크를 더 뭉개는 건 역효과였다(잔차가 오히려 커진다) → 별 둘레 링에서
    **배경이 평평한 화소만** 골라 작은 중앙값으로 눌러 준다. 책 모서리·풀처럼
    진짜 엣지가 지나가는 곳은 평탄도 조건에서 걸러져 손대지 않는다."""
    x0, x1, y0, y1 = box
    sub = img[y0:y1, x0:x1]
    bg = nd.median_filter(sub.mean(2), footprint=disk(25), mode="nearest")
    gx, gy = np.gradient(bg)
    ring = nd.binary_dilation(A > 0.02, disk(2)) & (np.hypot(gx, gy) < 1.2)
    med = np.dstack([nd.median_filter(sub[:, :, c], size=5, mode="nearest") for c in range(3)])
    w = nd.gaussian_filter(ring.astype(np.float32), 1.0)[:, :, None]
    out = img.copy()
    out[y0:y1, x0:x1] = sub*(1-w) + med*w
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

def blend_to_sky(a, fade):
    """왼쪽에서 삽화의 **큰 물체만** 자기 하늘색으로 녹인다(알파는 건드리지 않는다).

    하늘색은 행마다 다르다(위아래 그라데이션·아래쪽 바닥). 통독표가 없는 깨끗한 구간
    (x 5~58%)에서 행별로 x 에 대한 1차식을 맞춰 오른쪽으로 외삽한다.

    ★ 그냥 x 램프만으로 녹이면 **왼쪽 별밤의 별까지 매끈한 하늘로 지워진다**(한 번 겪었다).
    그래서 "하늘과 다른 화소" 마스크를 만들고 **열림 연산으로 작은 점(별)을 떨어뜨린 뒤**
    그 마스크 안에서만 램프를 먹인다. 별은 어디에 있든 그대로 남는다."""
    if fade is None:
        return a
    H, W, _ = a.shape
    sky = sky_model(a)
    x = np.arange(W, dtype=np.float32)
    big = content_mask(a, grow=0, blur=3.0)[:, :, None]   # 하늘과 다른 자리 = 그려진 것
    ramp = smooth((x - fade[0]*W)/((fade[1]-fade[0])*W))[None, :, None]
    w = 1.0 - big*(1.0-ramp)                              # 마스크 밖은 원본 그대로
    return sky*(1-w) + a*w

def run():
    os.makedirs(OUT, exist_ok=True)
    dark = load("2.png")
    A, box = watermark_alpha(dark)
    print(f"watermark alpha peak {A.max():.3f}  area {(A>0).sum()}")
    for name, out_name in [("1.png", "hero-light"), ("2.png", "hero-dark")]:
        a = despeckle(unwatermark(load(name), A, box), A, box)
        a = extend_top(a, RATIO)
        H, W, _ = a.shape
        a = blend_to_sky(a, FADE)
        al = np.ones((H, W), np.float32)
        rgba = np.dstack([np.clip(a, 0, 255), al*255]).astype(np.uint8)
        im = Image.fromarray(rgba, "RGBA").resize((WIDTH, int(round(H*WIDTH/W))), Image.LANCZOS)
        p = os.path.join(OUT, out_name + ".webp")
        im.save(p, "WEBP", quality=80, method=6, alpha_quality=92)
        print(f"{out_name}.webp  {im.size}  {os.path.getsize(p)/1024:.1f}KB")

if __name__ == "__main__":
    run()
