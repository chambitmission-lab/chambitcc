#!/usr/bin/env python3
"""문화교실 타이틀 밴드 삽화 후처리 — ~/Downloads/3.png(라이트) 4.png(다크) → public/images/culture/

하는 일 (docs/culture-hero-bg-prompts.md 참고):
  1) 제미나이 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'(캡슐·소식과 같은 방식).
     이번 원본은 별의 **왼쪽 위 절반이 우쿨렐레 양의 양털에 겹쳐** 있어서, 캡슐처럼
     별 둘레에 배경을 회귀시키는 방법이 통하지 않는다(둘레의 절반이 배경이 아니다).
     대신 **별이 평평한 어둠 위에만 있는 오른쪽-아래 사분면에서 알파를 재고,
     좌우·상하 대칭으로 나머지 세 사분면을 복원**한다. 별은 정확한 4점 대칭이라 안전하다.
  2) 알파 페이드 굽기 — 왼쪽(제목·안내문이 지나간다) · 위/아래(밴드 경계선 지우기).
     타이틀 밴드는 카드가 아니라 페이지 최상단 띠라, 이미지 배경색이 그대로 남으면
     앱 캔버스(#f1f3f6 / #131313)와의 이음매가 가로줄로 보인다.
  3) 알파 0 인 왼쪽을 잘라내고 축소해 webp 로 저장. `auto 100% + right center` 로 깔리므로
     왼쪽을 잘라도 화면 결과는 완전히 같다(바이트만 준다).
"""

import numpy as np
from PIL import Image
from pathlib import Path
from scipy.ndimage import gaussian_filter

SRC = {"light": Path.home() / "Downloads" / "3.png", "dark": Path.home() / "Downloads" / "4.png"}
OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "culture"

W, H = 1456, 720           # 제미나이 원본
CROP_X = 260               # 여기 왼쪽은 알파 0 이라 잘라 버린다
SCALE = 0.70               # 최종 축소율 (화면 폭 ≈ 181px, 3배 DPR 까지 여유)

FADE_X = (300, 665)        # 가로 알파 페이드 — 665 부터 불투명(그림은 x≈669 부터 시작)
FADE_BOT = (692, 720)      # 아래 알파 페이드
FADE_TOP = {"light": 120, "dark": 48}   # 위 알파 페이드 (다크는 y≈61 의 스탠드 갓을 지켜야 한다)

# 워터마크 ✦ — 1456×720 원본 실측. 오른쪽 꼭짓점 x≈1359.5, 아래 꼭짓점 y≈623.5
WM_C = (1335.5, 599.5)   # 대칭 최적화로 잰 중심
WM_R = 25.0                # 반폭 = 반높이 (실측 24.0 / 23.7 → 여유 포함)
WM_BG = 21.0               # 별 둘레 평평한 어둠의 밝기 (다크 원본)


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def watermark_alpha(dark):
    """다크 원본의 오른쪽-아래 사분면에서 ✦ 알파를 재고 대칭으로 펼친다."""
    cx, cy = WM_C
    lum = dark.mean(axis=2)
    meas = np.clip((lum - WM_BG) / (255.0 - WM_BG), 0.0, 1.0)

    # 사분면 격자: 중심에서 오른쪽·아래로 0.5px 간격이면 충분하다(bilinear 로 되읽는다)
    x0, y0 = int(np.floor(cx)), int(np.floor(cy))
    fx, fy = cx - x0, cy - y0
    R = int(WM_R) + 3

    ys, xs = np.mgrid[y0 - R : y0 + R + 1, x0 - R : x0 + R + 1].astype(float)
    u = np.abs(xs - cx)        # 중심에서의 거리 → 항상 오른쪽-아래 사분면을 읽는다
    v = np.abs(ys - cy)
    sx, sy = cx + u, cy + v

    ix, iy = np.floor(sx).astype(int), np.floor(sy).astype(int)
    tx, ty = sx - ix, sy - iy
    a = (meas[iy, ix] * (1 - tx) * (1 - ty) + meas[iy, ix + 1] * tx * (1 - ty)
         + meas[iy + 1, ix] * (1 - tx) * ty + meas[iy + 1, ix + 1] * tx * ty)

    a[(u / WM_R + v / WM_R) > 1.10] = 0.0      # 다이아몬드 밖은 버린다
    a[a < 0.035] = 0.0
    a = gaussian_filter(a, 0.5)

    full = np.zeros((H, W))
    full[y0 - R : y0 + R + 1, x0 - R : x0 + R + 1] = a
    assert 0.25 < full.max() < 0.40, f"알파 피크가 이상하다: {full.max():.3f}"
    print(f"  워터마크 알파 피크 {full.max():.3f}  (중심 {cx},{cy})")
    return full


def unmix(img, alpha):
    """obs = (1-a)·bg + a·255 를 되푼다."""
    a = alpha[:, :, None]
    return np.clip((img - 255.0 * a) / np.maximum(1.0 - a, 1e-3), 0, 255)


def bake_alpha(theme):
    x = np.arange(W)[None, :].astype(float)
    y = np.arange(H)[:, None].astype(float)
    left = smoothstep((x - FADE_X[0]) / (FADE_X[1] - FADE_X[0]))
    top = smoothstep(y / float(FADE_TOP[theme]))
    bot = smoothstep((FADE_BOT[1] - y) / float(FADE_BOT[1] - FADE_BOT[0]))
    return np.clip(left * top * bot, 0, 1)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    dark = np.asarray(Image.open(SRC["dark"]).convert("RGB")).astype(np.float32)
    alpha = watermark_alpha(dark)

    for theme in ("light", "dark"):
        img = np.asarray(Image.open(SRC[theme]).convert("RGB")).astype(np.float32)
        assert img.shape[:2] == (H, W), f"{theme}: 원본 크기가 {img.shape[:2]}"
        img = unmix(img, alpha)
        rgba = np.dstack([img, bake_alpha(theme) * 255.0]).astype(np.uint8)
        im = Image.fromarray(rgba, "RGBA").crop((CROP_X, 0, W, H))
        im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
        p = OUT / f"hero-{theme}.webp"
        im.save(p, "WEBP", quality=82, method=6, alpha_quality=90)
        print(f"  hero-{theme}.webp  {im.size}  {p.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
