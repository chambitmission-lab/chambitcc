#!/usr/bin/env python3
"""선교 히어로 삽화 후처리 — ~/Downloads/1~4.png → src/assets/mission/*.webp

짝: 3·4 = 채택안 A(보내는 언덕·닿은 언덕) 라이트/다크 → hero-light.webp / hero-dark.webp.
1·2 = 탈락한 B안(시차 너머의 기도). 굽지는 않지만 **2.png 는 여전히 필요하다** — 워터마크
알파를 재는 원본이다(아래 WM_SRC).
프롬프트와 구역표는 docs/mission-hero-bg-prompts.md.

하는 일
-------
1) 제미나이 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'.
   ✦ 는 순수 흰색(255)을 고정 알파로 올린 합성이라, 배경을 복원하면 a = (obs-bg)/(255-bg) 로 풀린다.
   네 장 모두 같은 좌표·같은 알파라, **배경이 가장 매끈한 2.png(다크 B안, 돌계단 위)** 에서
   알파 맵을 한 번 재서 네 장에 똑같이 되돌린다.
   ★ A안(3·4)은 ✦ 가 고슴도치 몸통 위에 앉아 있어 TELEA 인페인트는 털을 빨아들인다 — 금지.
   ★ 별의 위 절반은 2.png 에서도 양 뒷머리와 겹친다. 그래서 **아래 절반만 재고 위로 거울 반사**한다
     (✦ 는 상하 대칭이다). 중심·반지름은 아래 상수에 실측으로 박혀 있다.
2) webp 로 저장. 알파는 쓰지 않는다 — 히어로를 덮는 배경이고, 가장자리는 CSS 그라데이션이
   페이지 캔버스로 녹인다(Mission.css).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path.home() / "Downloads"
OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "mission"

# 채택안(A · 「보내는 언덕, 닿은 언덕」) → 최종 파일명.
# B안(1·2 = 「시차 너머의 기도」)은 붙여 보고 탈락했다 — 오른쪽 오두막이 프레임보다 커서
# 날개 폭에서 잘리고, 라이트에서 큰 덩어리로 떴다. 원본은 그대로 두되 굽지 않는다.
PAIRS = {
    "hero": ("3.png", "4.png"),
}

# ── 워터마크 ✦ 실측 (1376×768 원본 기준) ─────────────────────
# 2.png 의 행/열 프로파일로 잰 값: 가로 1232~1278, 세로 623~672.
# 별은 알파 ≈0.32 로 거의 균일하고 테두리가 2px 안에서 뚝 떨어지는 '단단한' 도형이다
# (s 로 묶어 보면 0~1.0 구간이 평탄, 1.02~1.08 에서 0). 그래서 반지름 프로파일이나
# 상하 거울 반사로 근사하면 테두리가 **링으로 남는다**(둘 다 해 보고 버렸다).
# 픽셀 단위로 잰 알파 맵을 그대로 쓴다.
WM_C = (1255.0, 647.5)     # 중심 (x, y)
WM_A, WM_B = 23.5, 25.0    # 초타원 반지름
WM_P = 0.7                 # 오목한 4각별 = 지수 <1
WM_CUT = 1.12              # 이 바깥은 알파 0 (별 경계는 s≈1.05)
# ★ 알파는 탈락한 B안 다크(2.png)에서 잰다 — 네 장 중 별 둘레가 유일하게 평평한 돌계단이라
#   배경 복원이 정확하다. A안은 ✦ 가 고슴도치 몸통 위라 여기서는 못 잰다.
WM_SRC = "2.png"
BOX = 40                   # 알파를 재는 상자 반폭

# 위쪽 빈 하늘은 잘라 낸다. 네 장 모두 첫 내용(예배당 십자가·오두막 지붕)이 y≈134 에서 시작한다.
# 삽화는 늘 '폭에 맞춰' 깔리므로, 빈 하늘을 남겨 두면 그만큼 장면이 세로로 잘려 나간다
# (자르기 전: 예배당 지붕이 히어로 위에서 목이 날아갔다).
TOP_CROP = 110             # 남는 하늘 여백 ≈24px


def _superellipse(yy, xx):
    """중심에서의 초타원 거리. <=1 이면 별 안쪽."""
    return (np.abs(xx / WM_A) ** WM_P) + (np.abs((yy + 0.5) / WM_B) ** WM_P)


def measure_alpha():
    """✦ 의 알파 맵을 상자 크기로 돌려준다.

    별 둘레 고리(s 1.15~2.0)로 2차 다항식 배경을 맞추고, 그 배경과의 차이를 알파로 푼다.
    고리 안에는 양 뒷머리(밝은 양털)와 머그가 걸치므로 **이상치를 잘라 내며 3번 다시 맞춘다** —
    안 자르면 배경이 통째로 밝은 쪽으로 끌려가 별 자리에 어두운 구멍이 남는다.
    (별 자체는 양·머그와 겹치지 않는다. 겹치는 건 고리뿐이다.)
    """
    img = np.asarray(Image.open(SRC / WM_SRC).convert("RGB")).astype(float)
    cx, cy = int(round(WM_C[0])), int(round(WM_C[1]))
    box = img[cy - BOX:cy + BOX + 1, cx - BOX:cx + BOX + 1]

    yy, xx = np.mgrid[-BOX:BOX + 1, -BOX:BOX + 1].astype(float)
    s = _superellipse(yy, xx)
    ring = (s > 1.15) & (s < 2.0)
    basis = np.stack([np.ones_like(xx), xx, yy, xx * xx, xx * yy, yy * yy], axis=-1)

    bg = np.empty_like(box)
    for c in range(3):
        obs = box[..., c]
        keep, fit = ring.copy(), None
        for _ in range(3):
            coef, *_ = np.linalg.lstsq(basis[keep], obs[keep], rcond=None)
            fit = basis @ coef
            r = obs - fit
            med = np.median(r[keep])
            mad = 1.4826 * np.median(np.abs(r[keep] - med))
            keep = ring & (np.abs(r - med) < 2.5 * max(mad, 1.0))
        bg[..., c] = fit

    alpha = np.median((box - bg) / np.maximum(255.0 - bg, 1.0), axis=-1)
    alpha = np.clip(alpha, 0.0, 0.95)
    alpha[s > WM_CUT] = 0.0
    return alpha


def unwatermark(img, alpha):
    """흰색 합성을 역산해 원래 색을 되돌린다."""
    cx, cy = int(round(WM_C[0])), int(round(WM_C[1]))
    sl = (slice(cy - BOX, cy + BOX + 1), slice(cx - BOX, cx + BOX + 1))
    a = alpha[..., None]
    patch = img[sl]
    img[sl] = np.clip((patch - 255.0 * a) / np.maximum(1.0 - a, 1e-3), 0, 255)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    alpha = measure_alpha()
    print(f"watermark alpha: max {alpha.max():.3f}, mean(>0) {alpha[alpha > 0].mean():.3f}")

    for key, (light, dark) in PAIRS.items():
        for theme, name in (("light", light), ("dark", dark)):
            img = np.asarray(Image.open(SRC / name).convert("RGB")).astype(float)
            img = unwatermark(img, alpha)[TOP_CROP:]
            out = OUT / f"{key}-{theme}.webp"
            Image.fromarray(img.round().astype(np.uint8)).save(out, "WEBP", quality=82, method=6)
            print(f"{name} → {out.relative_to(OUT.parent.parent.parent)}  {out.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
