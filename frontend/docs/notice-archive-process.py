# -*- coding: utf-8 -*-
"""공지 아카이브 히어로 배경 후처리 (docs/notice-archive-hero-bg-prompts.md 참고)

Gemini 원본 2장(1.png 라이트 / 2.png 다크, 1456x720)을 받아
  1) 우상단에 잘못 그린 **사각 패널** 제거
     - 라이트: 패널 안쪽이 살짝 밝은 '단차'뿐 → 라운드 사각 마스크로 단차만 빼고 경계를 녹인다
     - 다크: 거기에 **파란 네온 테두리 + 글로우**까지 있다. 배경이 완전 중성(33,33,33)이라
       `e = B - R` 로 오염 범위를 정확히 집어낼 수 있다 → 그 자리를 주변 배경으로 메운다
  2) 아래로 캔버스를 늘리고 왼쪽/아래 알파 페이드를 구운 뒤 webp 로 저장

    python docs/notice-archive-process.py [원본폴더]

원본 순서 = 프롬프트 순서: 1 라이트 / 2 다크
"""
import os
import sys

import numpy as np
import scipy.ndimage as nd
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "news")

# ── 잘못 그린 패널의 기하 (실측) ───────────────────────────────────────
# 세로 단차 x=1091, 가로 단차 y≈195, 좌하단만 둥글게 깎인 라운드 사각.
PANEL_X, PANEL_Y, PANEL_R = 1091.0, 195.0, 44.0
FEATHER = 80.0          # 단차를 녹일 램프 반폭 (px)

# 다크 네온의 '파랑 초과분' 문턱 — 배경은 완전 중성(R=G=B)이라 2 만 넘어도 오염이다.
GLOW_E = 2.0


def smooth(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def load(i):
    return np.asarray(Image.open(os.path.join(SRC, f"{i}.png")).convert("RGB")).astype(np.float32)


def gauss1d(v, sigma):
    r = int(sigma * 3)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    return np.convolve(np.pad(v, r, mode="edge"), k, mode="valid")


def feather_vedge(a, E, F, y0=0, y1=None, sigma=12):
    """세로 하드 스텝(열 E)을 반폭 F 의 완만한 램프로 바꾼다 (news-hero-process.py 와 동일).

    ★ 단차를 '평균값'으로 빼면 안 된다 — 이 그림의 패널은 세로변 8, 가로변 4 로 자리마다
      세기가 다르다. 평균을 넓은 램프로 빼면 **하드 스텝은 거의 그대로 남는다**(실측 잔차 9).
      여기서는 줄마다 실측한 단차를 그 자리에서 없애므로 어디서 재든 남지 않는다.
    """
    y1 = a.shape[0] if y1 is None else y1
    out = a.copy()
    delta = a[:, E + 2:E + 10].mean(axis=1) - a[:, E - 10:E - 2].mean(axis=1)
    for c in range(3):
        delta[:, c] = gauss1d(delta[:, c], sigma)
    x = np.arange(a.shape[1])
    t = np.clip((x - (E - F)) / (2.0 * F), 0, 1)
    prof = (t * t * (3 - 2 * t) - (x >= E).astype(np.float32))[None, :, None]
    mask = np.zeros(a.shape[0], np.float32)
    mask[y0:y1] = 1
    return out + prof * delta[:, None, :] * gauss1d(mask, 10)[:, None, None]


def feather_hedge(a, E, F, x0=0, x1=None, sigma=12):
    return np.swapaxes(feather_vedge(np.swapaxes(a, 0, 1), E, F, x0, x1, sigma), 0, 1)


def soften_line(a, E, lo, hi, vertical=True, half=6, blur=13):
    """램프로 단차를 없앤 뒤 남는 1~2px 머리카락 선을 지운다.

    원본 경계의 안티앨리어싱 픽셀(238.4 → 239.5 → 247.1 의 가운데 값)은 단차를 뺀 뒤
    양쪽 어디에도 안 맞아 **어두운 실선**으로 남는다(실측 -5 레벨). 그 띠만 흐린다.
    """
    if not vertical:
        return np.swapaxes(soften_line(np.swapaxes(a, 0, 1), E, lo, hi, True, half, blur), 0, 1)
    out = a.copy()
    seg = a[lo:hi, E - half - blur:E + half + blur]
    sm = nd.uniform_filter1d(seg, blur, axis=1, mode="nearest")
    x = np.arange(seg.shape[1]) - (half + blur)
    w = np.clip(1.0 - (np.abs(x) / float(half)) ** 2, 0, 1)[None, :, None]
    out[lo:hi, E - half - blur:E + half + blur] = seg * (1 - w) + sm * w
    return out


def blur_box(a, y0, y1, x0, x1, sigma=14):
    """라운드 코너처럼 램프로 못 지우는 짧은 호(弧)는 그 상자만 뭉갠다 (배경뿐인 자리)."""
    out = a.copy()
    seg = a[y0:y1, x0:x1]
    sm = np.dstack([nd.gaussian_filter(seg[:, :, c], sigma, mode="nearest") for c in range(3)])
    yy = np.linspace(-1, 1, y1 - y0)[:, None, None]
    xx = np.linspace(-1, 1, x1 - x0)[None, :, None]
    w = np.clip(1.0 - (yy ** 2 + xx ** 2), 0, 1)
    out[y0:y1, x0:x1] = seg * (1 - w) + sm * w
    return out


def panel_sdf(h, w):
    """좌하단만 둥근 라운드 사각(오른쪽·위로 무한)의 부호거리. 음수 = 패널 안쪽."""
    x = np.arange(w)[None, :].astype(np.float32)
    y = np.arange(h)[:, None].astype(np.float32)
    qx = (PANEL_X + PANEL_R) - x
    qy = y - (PANEL_Y - PANEL_R)
    mx, my = np.maximum(qx, 0.0), np.maximum(qy, 0.0)
    return np.hypot(mx, my) + np.minimum(np.maximum(qx, qy), 0.0) - PANEL_R


def strip_glow(a):
    """다크 전용 — 파란 네온 테두리와 그 번짐을 **주변 배경으로 메운다**.

    ☠ 가산 성분을 색으로 역산해 빼는 방법(헌금·소식의 워터마크 방식)은 여기서 안 된다.
      네온은 코어가 거의 흰 하늘색(가산 89,126,171)이고 번짐은 순수한 파랑(2,10,19)이라
      **색비가 자리마다 다르다**. 단일 계수로 빼면 번짐 쪽이 18 까지 파여 검은 얼룩이 남는다.
    ★ 대신 배경이 거의 평평한 차콜이라는 점을 쓴다. 오염 픽셀을 빼고 큰 가우시안으로
      정규화 합성곱(normalized convolution)하면 그 자리의 배경이 그대로 복원된다.
    ★ 밝은 것(양털·두루마리)은 표본에서 빼야 한다 — 안 그러면 복원값이 흰색 쪽으로 끌린다.
    """
    h, w, _ = a.shape
    x = np.arange(w)[None, :]
    y = np.arange(h)[:, None]
    roi = (x > 950) & (y < 340)
    e = a[:, :, 2] - a[:, :, 0]
    bad = nd.binary_dilation(roi & (e > GLOW_E), iterations=6)

    bright = a.max(axis=2)
    clean = (~nd.binary_dilation(bad, iterations=10)) & (bright < 70) & (y < 560)
    cw = nd.gaussian_filter(clean.astype(np.float32), 50, mode="nearest")
    est = np.dstack([
        nd.gaussian_filter(a[:, :, c] * clean, 50, mode="nearest") / np.maximum(cw, 1e-6)
        for c in range(3)
    ])
    m = nd.gaussian_filter(bad.astype(np.float32), 3, mode="nearest")[:, :, None]
    print(f"  [dark] 네온 오염 {int(bad.sum())}px · 배경 표본 {int(clean.sum())}px")
    return a * (1.0 - m) + est * m


# 패널 안/바깥 단차를 재는 표본 상자 (y0, y1, x0, x1).
# ★ 다크는 네온 번짐이 경계 양옆 60px 을 오염시켜 이미 복원된 자리라, 경계에서 **떨어뜨려**
#   잰다(대신 배경 비네팅이 1 레벨쯤 섞이지만 눈에 안 보인다). 라이트는 경계에 바짝 붙인다.
LIFT_BANDS = {
    1: [((0, 130, 1094, 1112), (0, 130, 1070, 1088)),
        ((160, 190, 1250, 1440), (202, 232, 1250, 1440))],
    2: [((40, 120, 1200, 1440), (0, 130, 900, 1000))],
}


def strip_panel(a, i, tag):
    """패널을 지운다 — 넓은 '단차 빼기' + 경계 세 군데(세로변·가로변·라운드 코너) 녹이기."""
    h, w, _ = a.shape
    band = lambda b: np.median(a[b[0]:b[1], b[2]:b[3]].reshape(-1, 3), axis=0)
    lifts = [band(inn) - band(out) for inn, out in LIFT_BANDS[i]]
    lift = np.mean(lifts, axis=0)
    print(f"  [{tag}] 패널 단차 {[list(np.round(v, 1)) for v in lifts]} → 적용 {np.round(lift, 1)}")
    wgt = 1.0 - smooth((panel_sdf(h, w) + FEATHER) / (2.0 * FEATHER))
    a = a - wgt[:, :, None] * lift[None, None, :]

    XE, YE, R = int(PANEL_X), int(PANEL_Y), int(PANEL_R)
    a = feather_vedge(a, XE, 90, 0, YE - R)                 # 세로변 (코너 위까지)
    a = feather_hedge(a, YE + 1, 70, XE + R, w)             # 가로변 (코너 오른쪽부터)
    a = blur_box(a, YE - R - 26, YE + 26, XE - 26, XE + R + 26)   # 라운드 코너
    a = soften_line(a, XE, 0, YE - R, vertical=True)
    a = soften_line(a, YE + 1, XE + R, w, vertical=False)
    return a


# i: (name, out height, left fade [x0,x1], bottom fade [y0,y1])
CFG = {
    1: ("notice-archive-light", 1040, (240, 880), (700, 1000)),
    2: ("notice-archive-dark", 1040, (240, 880), (700, 1000)),
}

os.makedirs(OUT, exist_ok=True)

for i, (name, H, (lx0, lx1), (by0, by1)) in CFG.items():
    a = load(i)
    if i == 2:
        a = strip_glow(a)
    a = strip_panel(a, i, name)
    a = np.clip(a, 0, 255)

    h, w, _ = a.shape
    # 아래로 캔버스를 늘린다 — 늘린 띠는 알파로 사라지고, 카드에는 그림 720줄만 보인다
    a = np.concatenate([a, np.repeat(a[-1:], H - h, axis=0)], axis=0)
    x = np.arange(w)[None, :].astype(np.float32)
    y = np.arange(H)[:, None].astype(np.float32)
    alpha = smooth((x - lx0) / float(lx1 - lx0)) * smooth((by1 - y) / float(by1 - by0))

    rgba = np.dstack([a, np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    p = os.path.join(OUT, name + ".webp")
    im.save(p, "WEBP", quality=80, method=6, alpha_quality=92)
    print(f"{name}.webp  {im.size}  {os.path.getsize(p)/1024:.1f}KB")
