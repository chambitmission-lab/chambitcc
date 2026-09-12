#!/usr/bin/env python3
"""/thanks 오늘의 말씀 히어로 후처리 — 1.png(라이트)·2.png(다크) → src/assets/thanks/*.webp

프롬프트·구역표는 docs/thanks-hero-bg-prompts.md.

먼저 워터마크를 지운다(인페인트 금지, 알파 역산):

    python docs/gemini-unwatermark.py ~/Downloads/1.png ~/Downloads/1-clean.png
    python docs/gemini-unwatermark.py ~/Downloads/2.png ~/Downloads/2-clean.png
    python docs/thanks-hero-process.py            # -clean 이 있으면 그걸 먼저 집는다

하는 일
-------
1) 1536 폭 webp 저장 (받은 원본이 1968×544 = 3.62:1 이라 비율 조정은 필요 없다 —
   세로가 모자란 원본이 오면 RATIO 를 켜서 위로 하늘을 덧대는 건 class-hero-process.py 쪽을 볼 것)
2) 카드 위 **글자 자리 밝기 실측** — `.thanks-hero-art` 는
   `background-size: cover; background-position: right 40%` 라 모바일(416×168)은 왼쪽이,
   PC(688×168)는 위아래가 잘린다. 두 폭 모두에서 잰다.
   합격선: 라이트 평균 ≥ 205 / 하위5% ≥ 170,  다크 평균 ≤ 58 / 상위5% ≤ 105.
   ※ 좌측 스크림(카드색 → 78% 에서 투명)은 여기 반영하지 않은 **원본 삽화 값**이다.
     스크림이 왼쪽을 더 밀어 올려 주므로 실제 대비는 이보다 낫다.
"""
import os
import sys

import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "thanks")

WIDTH = 1536      # 최종 폭
CARD_H = 168      # 히어로 실측 높이 (min-height, 말씀 2줄까지 이 높이)
POS_Y = 0.40      # background-position 의 세로 정렬 (right 40%)

# 카드 위 글자 사각형 — x0(px), y0, y1, x1 은 카드 폭의 62%(.thanks-hero-body max-width)
RECTS = {
    "라벨": (24, 28, 48, 0.62),
    "말씀": (24, 54, 114, 0.62),
    "장절": (24, 118, 140, 0.40),
}


def sample(img, card_w):
    """`cover` + `right 40%` 매핑을 흉내 내 카드 위 밝기를 잰다."""
    H, W, _ = img.shape
    g = img.mean(2)
    scale = max(card_w / W, CARD_H / H)
    dw, dh = W * scale, H * scale
    ox = dw - card_w                 # 오른쪽 정렬 → 왼쪽이 잘린다
    oy = POS_Y * (dh - CARD_H)       # 세로 40% 정렬 → 위 40% / 아래 60% 로 잘린다
    res = {}
    for name, (x0, y0, y1, xf) in RECTS.items():
        x1 = 24 + xf * card_w
        sx0, sx1 = int((ox + x0) / scale), int((ox + x1) / scale)
        sy0, sy1 = int((oy + y0) / scale), int((oy + y1) / scale)
        r = g[max(sy0, 0):sy1, max(sx0, 0):sx1]
        res[name] = (r.mean(), np.percentile(r, 5), np.percentile(r, 95))
    return res


def pick(stem):
    for name in (f"{stem}-clean.png", f"{stem}.png"):
        p = os.path.join(SRC, name)
        if os.path.exists(p):
            return p
    raise SystemExit(f"{stem}.png 를 {SRC} 에서 못 찾았다")


def main():
    os.makedirs(OUT, exist_ok=True)
    for stem, theme in (("1", "light"), ("2", "dark")):
        src = pick(stem)
        im = Image.open(src).convert("RGB")
        h = int(round(WIDTH * im.size[1] / im.size[0]))
        im = im.resize((WIDTH, h), Image.LANCZOS)
        out = os.path.join(OUT, f"hero-{theme}.webp")
        im.save(out, "WEBP", quality=78, method=6)
        kb = os.path.getsize(out) / 1024
        print(f"{os.path.basename(src)} → {theme}  {WIDTH}×{h}  {kb:.1f}KB")
        img = np.asarray(im).astype(np.float32)
        for card_w, tag in ((416, "모바일"), (688, "PC   ")):
            st = sample(img, card_w)
            print("   ", tag, "  ".join(
                f"{k} 평균{v[0]:6.1f} p5{v[1]:6.1f} p95{v[2]:6.1f}" for k, v in st.items()))


if __name__ == "__main__":
    main()
