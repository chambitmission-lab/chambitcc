#!/usr/bin/env python3
"""홈 타임캡슐 배너 삽화 후처리 — ~/Downloads/1.png(라이트) 2.png(다크) → public/images/capsule/

하는 일:
  1) 제미나이 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'.
     ✦ 는 순수 흰색(255)을 고정 알파로 올린 합성이라, 다크 원본에서 별 둘레의 평평한
     그림자 바닥을 2차 다항식으로 맞춰 배경을 복원하면 a = (obs-bg)/(255-bg) 로 풀린다.
     두 장의 워터마크가 같은 좌표·같은 알파(≈0.29)라 다크에서 잰 알파 맵을 그대로 쓴다.
     별 바로 위가 새끼양 뒷발굽이라 TELEA 인페인트는 발굽을 빨아들인다 → 금지.
  2) 라이트 배경만 브랜드 쪽으로 살짝 회전(시안 h≈197° → 211°). 배경으로 판정된 픽셀만
     건드려서 크림색 양·회색 외곽선은 그대로 둔다.
  3) 오른쪽으로 캔버스 확장 — 카드 우측의 원형 화살표 버튼이 앉을 빈 자리를 만든다.
     가장자리 열을 그대로 늘리면 새끼양 그림자가 세로 줄무늬로 번지므로,
     배경 모델(좌측 절반 + 상단 띠로 맞춘 bilinear)로 서서히 녹인다.
  4) 왼쪽 알파 페이드를 굽고(카드 그라데이션이 그대로 비치게) webp 로 저장.
"""

import numpy as np
from PIL import Image
from pathlib import Path
from scipy.ndimage import gaussian_filter

SRC = {"light": Path.home() / "Downloads" / "1.png", "dark": Path.home() / "Downloads" / "2.png"}
OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "capsule"

W, H = 1456, 720          # 제미나이 원본
EXTEND = 168              # 오른쪽으로 늘릴 폭 (화살표 버튼 자리 ≈ 화면상 31px)
CROP_X = 440              # 왼쪽은 어차피 알파 0 이라 잘라 버린다
FADE = (500, 745)         # 가로 알파 페이드 (원본 좌표): 이 전은 투명, 이 후는 불투명
FADE_TOP = 240            # 세로(위) 알파 페이드 — 삽화가 카드보다 낮게 앉을 때(홈 PC 사이드바는
                          # 368px 고정이라 삽화가 카드 높이의 86% 밖에 안 된다) 삽화 윗변이
                          # 가로줄로 보인다. 하늘을 길게 녹여 없앤다. 짧게(58px) 잡으면
                          # 에셋 오른쪽 위가 카드 그라데이션보다 밝아 경계가 드러난다.
                          # ★ 이 페이드는 '하늘'에만 걸린다 — 양·편지는 salience 로 지킨다
SCALE = 0.75              # 최종 축소율

# 워터마크 ✦ — 원본 1456×720 기준 실측
WM_C = (1335.0, 604.5)    # 중심
WM_R = (27.0, 21.0)       # 다이아몬드 반폭·반높이 (네 꼭짓점 x 1310/1360, y 585/624)


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def bg_model(img):
    """배경 그라데이션 모델. 그림이 없는 좌측 절반 + 상단 띠에서 bilinear 로 맞춘다.
    오른쪽 확장 구간까지 완만하게 외삽하는 게 목적이라 차수를 낮게 잡았다."""
    ys, xs = np.mgrid[0:H, 0:W]
    clean = np.zeros((H, W), bool)
    clean[:, :640] = True          # 그림은 x≈690 부터 시작한다
    clean[:70, :] = True           # 상단 띠 — x 외삽을 잡아 준다
    # 표본을 성기게 뽑고(속도) 채널별로 a + b·x + c·y + d·xy 회귀
    step = 4
    m = clean[::step, ::step]
    X = xs[::step, ::step][m].astype(float)
    Y = ys[::step, ::step][m].astype(float)
    A = np.stack([np.ones_like(X), X, Y, X * Y], axis=1)
    out = []
    for ch in range(3):
        v = img[::step, ::step, ch][m]
        coef, *_ = np.linalg.lstsq(A, v, rcond=None)
        out.append(coef)
    return np.array(out)         # (3,4)


def eval_bg(coef, w, h, x0=0):
    ys, xs = np.mgrid[0:h, 0:w]
    xs = xs.astype(float) + x0
    ys = ys.astype(float)
    planes = [coef[ch][0] + coef[ch][1] * xs + coef[ch][2] * ys + coef[ch][3] * xs * ys for ch in range(3)]
    return np.stack(planes, axis=2)


def watermark_alpha(dark):
    """다크 원본에서 ✦ 의 알파 맵을 잰다."""
    x0, x1, y0, y1 = 1298, 1372, 578, 632
    pad = 26
    rx0, rx1, ry0, ry1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad

    ys, xs = np.mgrid[ry0:ry1, rx0:rx1]
    patch = dark[ry0:ry1, rx0:rx1]
    lum = patch.mean(axis=2)

    dia = np.abs(xs - WM_C[0]) / WM_R[0] + np.abs(ys - WM_C[1]) / WM_R[1]
    inside = dia <= 1.12                      # 별(과 그 둘레)
    # 회귀에서 뺄 것: 새끼양 뒷발굽(밝다). 복원에서 뺄 것: y<586(발굽 바닥) — 별의 맨 위
    # 꼭짓점 3px 는 발굽 안티에일리어싱과 붙어 있어 손대는 쪽이 더 위험하다.
    # 별의 아래 꼭짓점 밝기가 100~115 라, 복원 마스크의 임계는 회귀용(110)보다 높아야 한다.
    fit = (~inside) & (lum <= 110)
    inside &= (ys >= 586) & (lum <= 170)

    X = xs[fit].astype(float)
    Y = ys[fit].astype(float)
    A = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y], axis=1)
    bg = np.zeros_like(patch)
    Xa, Ya = xs.astype(float), ys.astype(float)
    for ch in range(3):
        coef, *_ = np.linalg.lstsq(A, patch[fit][:, ch], rcond=None)
        bg[:, :, ch] = (coef[0] + coef[1] * Xa + coef[2] * Ya + coef[3] * Xa * Xa
                        + coef[4] * Xa * Ya + coef[5] * Ya * Ya)

    a = ((patch - bg) / np.maximum(255.0 - bg, 1.0)).mean(axis=2)
    a = np.clip(a, 0.0, 0.45)
    a[~inside] = 0.0
    a[a < 0.04] = 0.0
    a = gaussian_filter(a, 0.6)

    full = np.zeros((H, W))
    full[ry0:ry1, rx0:rx1] = a
    return full


def unmix(img, alpha):
    """obs = (1-a)·bg + a·255 를 되푼다."""
    a = alpha[:, :, None]
    out = (img - 255.0 * a) / np.maximum(1.0 - a, 1e-3)
    return np.clip(out, 0, 255)


def recolor_light(img, coef):
    """라이트 배경만 시안 → 브랜드 블루 쪽으로 14° 회전. 배경 판정 픽셀에만."""
    import colorsys

    bg = eval_bg(coef, W, H)
    dist = np.abs(img - bg).mean(axis=2)
    w = 1.0 - smoothstep((dist - 6.0) / 16.0)          # 배경에 가까울수록 1

    # 배경 모델을 HSV 에서 돌린 목표색
    flat = (bg.reshape(-1, 3) / 255.0)
    tgt = np.empty_like(flat)
    for i, (r, g, b) in enumerate(flat):
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        tgt[i] = colorsys.hsv_to_rgb((h + 14.0 / 360.0) % 1.0, s * 0.94, v)
    tgt = tgt.reshape(H, W, 3) * 255.0

    return np.clip(img + (tgt - bg) * w[:, :, None], 0, 255)


def extend_right(img, coef):
    """오른쪽 EXTEND 픽셀을 배경 모델로 녹여 늘린다 (그림자 잘림 방지)."""
    out = np.zeros((H, W + EXTEND, 3))
    out[:, :W] = img
    model = eval_bg(coef, W + EXTEND, H)
    edge = img[:, W - 1, :]                            # 마지막 열
    for k in range(EXTEND):
        t = smoothstep(k / (EXTEND * 0.55))            # 55% 지점에서 배경 모델로 완전 전환
        out[:, W + k] = edge * (1 - t) + model[:, W + k] * t
    return np.clip(out, 0, 255)


def bake_alpha(img, coef):
    h, w = img.shape[:2]
    xs = np.arange(w) + CROP_X
    ax = smoothstep((xs - FADE[0]) / (FADE[1] - FADE[0]))
    ay = smoothstep(np.arange(h) / FADE_TOP)

    # 위 페이드는 하늘에만 — 배경 모델과 다른 픽셀(양·편지·그림자·반짝임)은 불투명하게 남긴다.
    # 카드 그라데이션이 에셋 배경색과 같게 맞춰져 있어, 하늘을 지워도 보이는 색은 그대로다.
    bg = eval_bg(coef, w, h, x0=CROP_X)
    dist = np.abs(img - bg).mean(axis=2)
    salience = gaussian_filter(smoothstep((dist - 5.0) / 12.0), 1.2)
    print(f"   위 페이드 구간 salience 평균={salience[:FADE_TOP].mean():.3f}"
          f" (0에 가까울수록 하늘이 잘 녹는다)")

    a = np.maximum(ay[:, None], salience) * ax[None, :]
    rgba = np.dstack([img, a * 255.0])
    return np.clip(rgba, 0, 255).astype(np.uint8)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    dark = np.asarray(Image.open(SRC["dark"]).convert("RGB")).astype(float)
    light = np.asarray(Image.open(SRC["light"]).convert("RGB")).astype(float)
    assert dark.shape[:2] == (H, W) and light.shape[:2] == (H, W), "원본 크기가 1456×720이 아니다"

    alpha = watermark_alpha(dark)
    print(f"워터마크 알파 peak={alpha.max():.3f}  픽셀={int((alpha > 0).sum())}")
    dark = unmix(dark, alpha)
    light = unmix(light, alpha)

    for name, img in (("light", light), ("dark", dark)):
        coef = bg_model(img)
        if name == "light":
            img = recolor_light(img, coef)
            coef = bg_model(img)
        img = extend_right(img, coef)
        img = img[:, CROP_X:]
        rgba = bake_alpha(img, coef)
        im = Image.fromarray(rgba, "RGBA")
        im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
        path = OUT / f"home-banner-{name}.webp"
        im.save(path, "WEBP", quality=80, alpha_quality=92, method=6)
        print(f"{path.name}: {im.width}×{im.height}  {path.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
