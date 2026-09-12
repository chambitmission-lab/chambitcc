#!/usr/bin/env python3
"""우리반 알림장 히어로 배경 후처리 — ~/Downloads/1.png(라이트)·2.png(다크) → src/assets/classes/*.webp

프롬프트·구역표는 docs/class-note-hero-bg-prompts.md.

하는 일
-------
1) 위아래 '가로 계단' 정리 — 제미나이가 배경에 남기는 자 대고 그은 듯한 가로선.
   카드가 187px 로 납작해서 한 줄만 있어도 렌더링 이음매로 읽힌다.
2) **위로 캔버스를 늘려 2.6:1** — 이게 핵심이다.
   원본은 8.3:1(2928×352)이라 그대로 깔면 `cover` 가 모바일에서 높이로 배율을 잡아
   장면이 폭 380px 로 확대돼 안내 문구를 통째로 덮는다. 가로 여백을 늘려도 소용없고
   (cover 는 높이로 맞춘다), **세로를 늘리는 것만이 장면을 줄이는 레버**다.
   덧댄 띠는 맨 윗줄을 위로 갈수록 세게 가로 블러해서 채운다(세로 줄무늬 방지).
3) 1536 폭 webp 저장 + 카드 위 글자 자리 밝기 실측 출력.

    python docs/class-hero-process.py [원본폴더]
"""
import os
import sys

import numpy as np
import scipy.ndimage as nd
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "classes")

RATIO = 3.6      # 최종 가로:세로 — 모바일 장면 폭(165px)을 정하는 유일한 손잡이.
                 # 키우면 장면이 커지고(2.6=120px / 3.6=165px / 3.8=175px) 글씨와 겹칠 여지도 같이 는다.
                 # PC 는 폭맞춤이라 이 값과 무관하게 장면 폭이 205px 로 같다.
WIDTH = 1536     # 최종 폭
CARD_H = 187     # 히어로 실측 높이(문구 한 줄 기준)
# 카드 위 글자 사각형 (x0, y0, x1, y1) — 세로 가운데 정렬이라 넉넉하게 잡았다
# 안내문은 비참여 상태의 3줄 문단이 최악값(max-w-[14rem] = 224px)
RECTS = {"라벨": (24, 40, 140, 60), "제목": (24, 66, 250, 110), "안내문": (24, 114, 248, 172)}


def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, name)).convert("RGB")).astype(np.float32)
    col = a[:, :1200].mean((1, 2))
    # 맨 위 하늘 띠 — 그대로 두면 extend_top 이 그 띠 색으로 천장을 채워 이음매가 남는다
    d = np.abs(np.diff(col[:40]))
    if len(d) and d.max() > 3:
        i = int(np.argmax(d))
        print(f"  {name}: 상단 띠 엣지 row {i+1} (jump {d[i]:.1f}) 잘라냄")
        a = a[i + 1:]
        col = a[:, :1200].mean((1, 2))
    # 맨 아래 1~2행 — 카드는 bottom 정렬이라 이 몇 줄이 카드 최하단에 그대로 깔린다
    while len(col) > 3 and abs(col[-1] - col[-2]) > 1.0:
        a, col = a[:-1], col[:-1]
    return a


def extend_top(a):
    """위로 빈 하늘을 덧대 RATIO 로 만든다. 덧댄 띠는 맨 윗줄을 위로 갈수록 세게 가로 블러."""
    H, W, _ = a.shape
    target = int(round(W / RATIO))
    add = target - H
    if add <= 0:
        return a
    top = a[0].copy()                       # (W,3)
    band = np.empty((add, W, 3), np.float32)
    for i in range(add):
        t = (i + 1) / add                   # 위로 갈수록 1
        sigma = 2.0 + 60.0 * t              # 위로 갈수록 뭉갠다
        band[add - 1 - i] = np.stack(
            [nd.gaussian_filter1d(top[:, c], sigma, mode="nearest") for c in range(3)], axis=-1
        )
    out = np.concatenate([band, a], axis=0)
    # 이음매를 세로로 살짝 녹인다 (세로 블러는 가로 그라데이션을 보존한다)
    s = max(add - 12, 0)
    out[s:add + 12] = nd.gaussian_filter(out[s:add + 12], (4, 0, 0), mode="nearest")
    print(f"  캔버스 {H} → {target} (위에 {add}행 하늘 덧댐, {W/target:.2f}:1)")
    return out


def sample(img, card_w, card_h=CARD_H):
    """`background-size: cover; background-position: right bottom` 매핑을 흉내 내 카드 위 밝기를 잰다."""
    H, W, _ = img.shape
    g = img.mean(2)
    scale = max(card_w / W, card_h / H)
    dw, dh = W * scale, H * scale
    ox, oy = dw - card_w, dh - card_h       # right bottom 정렬이라 왼쪽·위가 잘린다
    res = {}
    for name, (x0, y0, x1, y1) in RECTS.items():
        sx0, sx1 = int((ox + x0) / scale), int((ox + x1) / scale)
        sy0, sy1 = int((oy + y0) / scale), int((oy + y1) / scale)
        r = g[max(sy0, 0):sy1, max(sx0, 0):sx1]
        res[name] = (r.mean(), np.percentile(r, 5), np.percentile(r, 95))
    return res


def main():
    os.makedirs(OUT, exist_ok=True)
    for src, theme in (("1.png", "light"), ("2.png", "dark")):
        print(src, "→", theme)
        a = extend_top(load(src))
        h = int(round(WIDTH * a.shape[0] / a.shape[1]))
        img = np.asarray(
            Image.fromarray(a.round().clip(0, 255).astype(np.uint8)).resize((WIDTH, h), Image.LANCZOS)
        ).astype(np.float32)
        out = os.path.join(OUT, f"hero-{theme}.webp")
        Image.fromarray(img.round().astype(np.uint8)).save(out, "WEBP", quality=82, method=6)
        kb = os.path.getsize(out) / 1024
        print(f"  {WIDTH}×{h}  {kb:.1f}KB")
        for card_w, tag in ((358, "모바일"), (832, "PC   ")):
            st = sample(img, card_w)
            print("   ", tag, "  ".join(f"{k} 평균{v[0]:6.1f} p5{v[1]:6.1f} p95{v[2]:6.1f}" for k, v in st.items()))


if __name__ == "__main__":
    main()
