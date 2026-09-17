# -*- coding: utf-8 -*-
"""/growth 신앙 여정 히어로 후처리 — 1~6.png → src/assets/growth/hero-{시간대}-{테마}.webp

프롬프트·구역표는 docs/growth-hero-bg-prompts.md.

먼저 워터마크를 지운다(인페인트 금지, 알파 역산):

    for i in 1 2 3 4 5 6; do python docs/gemini-unwatermark.py ~/Downloads/$i.png ~/Downloads/$i-clean.png; done
    python docs/growth-hero-process.py            # -clean 이 있으면 그걸 먼저 집는다

★ 원본 6장은 "장면 3개 × 테마 2개"인데 받은 순서가 장면 순이 아니다(1=등불 라이트,
  2=발자국 다크, 3=발자국 라이트, 4=등불 다크, 5=미니멀 라이트, 6=미니멀 다크).
  아래 PLAN 이 그걸 시간대별 라이트/다크 쌍으로 되묶는다 —
  오전=발자국(일출/달), 오후=미니멀(밝은 안개/달), 저녁=등불(박명/밤).

하는 일
-------
1) 1536 폭 webp 저장 (원본 1968×544 = 3.618:1 이라 비율 조정은 필요 없다)
2) 카드 위 **글자 자리 밝기 실측** — `.growth-hero-art` 는
   `background-size: cover; background-position: right 40%` 이고 글씨는 **두 테마 모두 흰색**이라
   합격선이 양쪽 다 **상한**이다(감사 히어로와 방향이 반대다).
   라이트 평균 ≤ 175 / p95 ≤ 215,  다크 평균 ≤ 95 / p95 ≤ 130.
   ※ 스크림(좌하단 black/65 → 우상단 black/10)은 반영하지 않은 **원본 삽화 값**이다.
     스크림이 왼쪽·아래를 더 눌러 주므로 실제 대비는 이보다 낫다.
3) 우상단 주인공 구역(x 78~98%, y 6~58%)의 광원 밝기도 같이 잰다 — 여기는 **하한**이다
   (라이트 ≥ 200 / 다크 ≥ 190). 죽으면 두 테마가 똑같아진다.
"""
import os
import sys

import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "growth")

WIDTH = 1536      # 최종 폭
CARD_H = 210      # 히어로 실측 높이 (문구 1줄 기준)
POS_Y = 0.40      # background-position 의 세로 정렬 (right 40%)

# 받은 원본 → (시간대, 테마). 장면이 시간대와 맞도록 다시 묶는다.
PLAN = [
    ("3", "morning", "light", "발자국·일출"),
    ("2", "morning", "dark", "발자국·달"),
    ("5", "afternoon", "light", "미니멀·밝은 안개"),
    ("6", "afternoon", "dark", "미니멀·달"),
    ("1", "evening", "light", "등불·박명"),
    ("4", "evening", "dark", "등불·밤"),
]

# 카드 위 글자 사각형 — (x0 px, y0, y1, x1 을 카드 폭 비율로)
RECTS = {
    "라벨": (20, 24, 60, 0.42),
    "숫자": (20, 72, 116, 0.28),
    "헤드": (20, 128, 153, 0.64),
    "보조": (20, 161, 207, 0.85),
}
# 주인공 구역 — 삽화 비율 좌표 (x0, x1, y0, y1)
SUBJECT = (0.78, 0.98, 0.06, 0.58)

PASS = {  # (글자 상한 평균, 글자 상한 p95, 주인공 하한)
    "light": (175, 215, 200),
    "dark": (95, 130, 190),
}


def sample(img, card_w):
    """`cover` + `right 40%` 매핑을 흉내 내 카드 위 밝기를 잰다."""
    H, W, _ = img.shape
    g = img.mean(2)
    scale = max(card_w / W, CARD_H / H)
    dw, dh = W * scale, H * scale
    ox = dw - card_w                 # 오른쪽 정렬 → 왼쪽이 잘린다
    oy = POS_Y * (dh - CARD_H)       # 세로 40% 정렬
    res = {}
    for name, (x0, y0, y1, xf) in RECTS.items():
        x1 = xf * card_w
        sx0, sx1 = int((ox + x0) / scale), int((ox + x1) / scale)
        sy0, sy1 = int((oy + y0) / scale), int((oy + y1) / scale)
        r = g[max(sy0, 0):sy1, max(sx0, 0):sx1]
        res[name] = (r.mean(), np.percentile(r, 95))
    return res


def subject_peak(img):
    """주인공 구역의 광원 밝기 — 상위 2% 평균(해·달·등불 코어)."""
    H, W, _ = img.shape
    g = img.mean(2)
    x0, x1, y0, y1 = SUBJECT
    r = g[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)]
    return r[r >= np.percentile(r, 98)].mean()


def pick(stem):
    for name in (f"{stem}-clean.png", f"{stem}.png"):
        p = os.path.join(SRC, name)
        if os.path.exists(p):
            return p
    raise SystemExit(f"{stem}.png 를 {SRC} 에서 못 찾았다")


def main():
    os.makedirs(OUT, exist_ok=True)
    bad = 0
    for stem, tod, theme, scene in PLAN:
        src = pick(stem)
        im = Image.open(src).convert("RGB")
        h = int(round(WIDTH * im.size[1] / im.size[0]))
        im = im.resize((WIDTH, h), Image.LANCZOS)
        out = os.path.join(OUT, f"hero-{tod}-{theme}.webp")
        im.save(out, "WEBP", quality=76, method=6)
        kb = os.path.getsize(out) / 1024
        print(f"{os.path.basename(src)} → hero-{tod}-{theme}.webp  "
              f"{WIDTH}×{h}  {kb:5.1f}KB   ({scene})")

        img = np.asarray(im).astype(np.float32)
        lim_mean, lim_p95, lim_subj = PASS[theme]
        peak = subject_peak(img)
        flag = "" if peak >= lim_subj else f"  ← 광원 약함 (하한 {lim_subj})"
        print(f"    주인공 광원 {peak:6.1f}{flag}")
        for card_w, tag in ((358, "모바일358"), (416, "모바일416"),
                            (616, "PC 616  "), (832, "PC 832  ")):
            st = sample(img, card_w)
            over = [k for k, v in st.items() if v[0] > lim_mean or v[1] > lim_p95]
            bad += len(over)
            mark = "" if not over else f"  ← {' '.join(over)} 초과"
            print("    ", tag, " ".join(
                f"{k} {v[0]:5.1f}/{v[1]:5.1f}" for k, v in st.items()) + mark)
    print(f"\n합격선(평균/p95): 라이트 ≤175/≤215 · 다크 ≤95/≤130 — 초과 {bad}건")


if __name__ == "__main__":
    main()
