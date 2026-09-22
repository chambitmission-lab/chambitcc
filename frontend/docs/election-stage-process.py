#!/usr/bin/env python3
"""선거 발표 화면 배경 후처리 — ~/Downloads/1.png(라이트)·2.png(다크)
→ public/images/election/stage-{left,right}-{light,dark}.webp (총 4장)

프롬프트·구역표는 docs/election-stage-bg-prompts.md.
워터마크 ✦ 가 남아 있으면 먼저 지운다: `python docs/gemini-unwatermark.py ~/Downloads/1.png`
(이번 2026-09-22 자산은 사용자가 직접 지워 왔다 — 그대로 1.png/2.png 를 읽는다.)

왜 한 장이 아니라 네 장인가
---------------------------
처음 설계는 "테마당 한 장을 좌우 날개가 각각 끝만 잘라 쓴다"(`background-size: auto 100%`)였다.
받아 보니 **왼쪽 무리가 프레임의 48.7% 를 먹는다** — 날개 폭은 23% 라, 그대로 깔면
돌을 안고 서 있는 새끼양(이 그림의 유일한 미소)이 통째로 잘린다.

그래서 **폭맞춤(`background-size: 100% auto`)으로 바꾸고, 무리를 패널로 잘라 굽는다.**
좌우 패널의 **가로 크기를 같게(720px)** 유지하는 것이 핵심이다 — 폭맞춤은 패널 폭으로
배율이 정해지므로, 폭이 다르면 오른쪽 예배당이 왼쪽 양들보다 커져 원근이 깨진다.
오른쪽 패널의 왼쪽 절반이 빈 하늘인 건 낭비가 아니라 **배율을 맞추는 값**이다.

하는 일
-------
1) 하늘색을 페이지 캔버스(`--app-canvas`)로 옮긴다.
   ★ 다크 원본은 슬레이트 블루(#2b3945)라 그대로 깔면 `#131313` 위에 **파란 세로 판떼기**가 뜬다.
     단순 오프셋은 흰 양털까지 누렇게 만들므로, **밝기 램프**를 태운다 —
     하늘 밝기에서 최대, 밝은 데로 갈수록 0. 양털(밝기 250)은 손대지 않는다.
2) 좌우 패널로 자른다 (같은 가로 720px).
3) **알파 페이드를 구워 넣는다** — 위(하늘 쪽)와 안쪽(글자 쪽) 모서리.
   CSS 마스크가 아니라 알파인 이유: 무대 배경에 라디얼 워시가 깔려 있어서,
   캔버스 색으로 덮으면 그 워시 위에 네모가 뜬다.
4) webp(알파) 저장 + 검사값 출력.

    python docs/election-stage-process.py [원본폴더]
"""
import os
import sys

import numpy as np
from PIL import Image

# 윈도우 기본 콘솔(cp949)은 '—' 같은 글자에서 죽는다 — 출력만 UTF-8 로 돌린다
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "election")

SOURCES = (("1.png", "light"), ("2.png", "dark"))

# 페이지 캔버스 색 — theme.css 의 --app-canvas
CANVAS = {"light": (241, 243, 246), "dark": (19, 19, 19)}

# ── 자르는 자리 (1376×768 원본 기준 · 실측값) ──────────────────────────
# 왼쪽 무리 x 0~670 · 오른쪽 무리 x 925~1376 · 내용 세로 시작 y 341
PANEL_W = 720          # 좌우 공통 — 이 값이 곧 배율이다. 바꾸면 좌우가 같이 커지고 작아진다
TOP = 120              # 여기서부터 아래를 쓴다(위는 빈 하늘). 768-120=648 → 패널 1.111:1
LEFT_X = 0             # 왼쪽 패널: x 0~720 (무리 끝 670 뒤로 50px 여유)
RIGHT_X = 1376 - PANEL_W   # 오른쪽 패널: x 656~1376 (무리 시작 925 = 패널 안 269)

# ★ 위 페이드는 **빈 하늘 안에서 끝나야** 한다. 짧으면 패널 윗변이 가로줄로 보여
#   삽화가 화면에 붙은 네모 스티커가 된다(1차로 TOP=250·16% 로 굽고 실기에서 확인했다).
#   그래서 TOP 을 250→120 으로 올려 하늘을 100px 더 확보하고, 페이드를 32% 로 늘렸다:
#   원본 y 120~327 구간을 지나는데, 내용은 y 341 부터라 나무 끝에 안 걸린다.
#   ☠ TOP 과 TOP_FADE 는 한 쌍이다. TOP 만 내리면 페이드가 나무를 갉아먹는다.
TOP_FADE = 0.32        # 패널 위 32% 를 하늘로 흘려보낸다
INNER_FADE_L = 0.065   # 왼쪽 패널의 오른쪽 끝 — 무리가 바로 옆이라 짧게
INNER_FADE_R = 0.30    # 오른쪽 패널의 왼쪽 끝 — 어차피 빈 하늘이라 길게

QUALITY = 84
BUDGET_KB = 60.0       # 한 장 예산 (네 장 합계 240KB 이하)

# 밝기 램프 — 하늘 밝기에서 보정 최대, 여기(하늘+RAMP)부터는 손대지 않는다
RAMP = 120.0

# 다크 전용 하이라이트 눌림 — 원본 양털이 순백(250)이라 근-검정 위에서 화면에서 제일 밝은
# 물체가 된다. 가운데 카드의 흰 글자보다 밝으면 눈이 양한테 먼저 간다. 밝은 쪽만 살짝 눌러
# 카드에 위계를 돌려준다(라이트는 필요 없다 — 바탕이 이미 밝다).
HI_KNEE = 185.0
HI_CUT = 0.14


def mark(ok):
    return "\033[32m✓\033[0m" if ok else "\033[31m✗\033[0m"


LUMA = np.array([0.299, 0.587, 0.114], np.float32)


def retone(a, theme):
    """하늘을 캔버스 색으로 옮긴다 — 밝은 데(양털)는 건드리지 않는다."""
    sky = np.median(a[: int(a.shape[0] * 0.20)].reshape(-1, 3), axis=0)
    want = np.array(CANVAS[theme], np.float32)
    off = want - sky                                  # 하늘에 먹일 보정량
    lum = a @ LUMA
    sky_lum = float(sky @ LUMA)
    w = np.clip((sky_lum + RAMP - lum) / RAMP, 0.0, 1.0)[..., None]
    out = np.clip(a + off * w, 0, 255)
    print(
        f"  하늘 rgb({sky[0]:.0f},{sky[1]:.0f},{sky[2]:.0f}) → "
        f"rgb({want[0]:.0f},{want[1]:.0f},{want[2]:.0f})  보정 {off.round(0)}"
    )

    if theme == "dark":
        k = np.clip(((out @ LUMA) - HI_KNEE) / (255.0 - HI_KNEE), 0.0, 1.0)[..., None]
        before = float((out @ LUMA).max())
        out = np.clip(out * (1.0 - k * HI_CUT), 0, 255)
        print(f"  하이라이트 {before:.0f} → {float((out @ LUMA).max()):.0f} (양털이 카드 글자보다 밝지 않게)")
    return out


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def alpha_for(h, w, inner):
    """위 + 안쪽 모서리 알파 페이드. inner='right'(왼쪽 패널) | 'left'(오른쪽 패널)"""
    ys = np.arange(h, dtype=np.float32)
    top = smoothstep(ys / (h * TOP_FADE))                      # 위 → 아래로 0→1

    xs = np.arange(w, dtype=np.float32)
    if inner == "right":
        edge = smoothstep((w - 1 - xs) / (w * INNER_FADE_L))   # 오른쪽 끝에서 0
    else:
        edge = smoothstep(xs / (w * INNER_FADE_R))             # 왼쪽 끝에서 0
    return (top[:, None] * edge[None, :] * 255.0).astype(np.uint8)


def bake(a, theme, side, x0):
    panel = a[TOP:, x0 : x0 + PANEL_W]
    h, w, _ = panel.shape
    alpha = alpha_for(h, w, "right" if side == "left" else "left")
    rgba = np.dstack([panel.round().clip(0, 255).astype(np.uint8), alpha])

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f"stage-{side}-{theme}.webp")
    Image.fromarray(rgba, "RGBA").save(out, "WEBP", quality=QUALITY, method=6)
    kb = os.path.getsize(out) / 1024
    ok = kb <= BUDGET_KB
    print(f"    {mark(ok)} {side:<5} {w}×{h} ({w / h:.2f}:1)  {kb:5.1f}KB  (<= {BUDGET_KB}KB)")
    return ok, panel


def inspect(theme, left, right):
    """붙이기 전에 숫자로 보는 것 — 눈으로는 안 보이는 것만."""
    ok_all = True
    want = np.array(CANVAS[theme], np.float32)

    # 1. 패널 바깥 끝의 **하늘** 색 = 화면 끝 색. 어긋나면 프로젝터 양옆에 세로 판떼기가 뜬다.
    #    ★ 위 10% 만 잰다 — 그 아래는 나무·언덕이 프레임 끝까지 닿아 있어서(장면이 원래 그렇다)
    #      더 아래를 재면 나뭇잎 색을 하늘로 착각하고 항상 ✗ 가 뜬다.
    for label, col in (("왼 패널 왼끝", left[: int(left.shape[0] * 0.10), :6]),
                       ("오른 패널 오른끝", right[: int(right.shape[0] * 0.10), -6:])):
        got = col.reshape(-1, 3).mean(0)
        d = float(np.abs(got - want).max())
        ok = d < 8.0
        ok_all &= ok
        print(f"    {mark(ok)} {label:<14} rgb({got[0]:5.1f},{got[1]:5.1f},{got[2]:5.1f})  캔버스와 최대 {d:4.1f}")

    # 2. 맨 아랫줄 — 화면 아랫변이라 페이드가 없다. 위와 이어져야 '땅'으로 읽힌다
    for label, p in (("왼 패널", left), ("오른 패널", right)):
        seam = float(np.abs(p[-1].mean(1) - p[-6].mean(1)).mean())
        ok = seam < 8.0
        ok_all &= ok
        print(f"    {mark(ok)} {label} 아랫변    평균 {seam:5.2f} 레벨 차  (< 8.0)")

    return ok_all


def main():
    every_ok = True
    for src, theme in SOURCES:
        path = os.path.join(SRC, src)
        if not os.path.exists(path):
            raise SystemExit(f"원본을 못 찾았다: {path}")
        a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
        h, w, _ = a.shape
        print(f"{src} → {theme}   원본 {w}×{h} ({w / h:.2f}:1)")
        if (w, h) != (1376, 768):
            print(f"  ! 자르는 자리(PANEL_W/TOP/RIGHT_X)는 1376×768 실측값이다 — 다시 재야 한다")

        a = retone(a, theme)
        okl, left = bake(a, theme, "left", LEFT_X)
        okr, right = bake(a, theme, "right", RIGHT_X)
        every_ok &= okl and okr and inspect(theme, left, right)
        print()

    if every_ok:
        print("전부 통과. #/dev/election-stage 에서 라이트·다크 둘 다 눈으로 한 번 더 볼 것.")
    else:
        print("✗ 가 있다 — docs/election-stage-bg-prompts.md 의 '레이아웃 제약' 절을 볼 것.")


if __name__ == "__main__":
    main()
