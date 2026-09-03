"""/visit 히어로 자산 빌드.

원본 예배당 사진(1024x1048, 낮/밤)을 오른쪽에 두고 — 십자가 탑부터 입구·가로등까지 전경 그대로 —
왼쪽은 그 사진의 하늘에서 샘플한 그라데이션으로 이어 붙인 1600x800(2:1) 와이드 자산을 만든다.
교회 왼쪽 가장자리(이웃 건물 제외)는 하늘로 부드럽게 녹인다.

    python scripts/build_visit_hero.py
      → public/images/visit/_backup/church-{day,night}-src.webp 를 읽어
        public/images/visit/church-{day,night}.webp 를 덮어쓴다
    python scripts/build_visit_hero.py 낮원본.png 밤원본.png   # 다른 원본으로
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
VISIT = ROOT / 'public' / 'images' / 'visit'
SRC = {
    'day': Path(sys.argv[1]) if len(sys.argv) > 1 else VISIT / '_backup' / 'church-day-src.webp',
    'night': Path(sys.argv[2]) if len(sys.argv) > 2 else VISIT / '_backup' / 'church-night-src.webp',
}
W, H = 1600, 800
CROP_L = 44          # 원본 왼쪽 끝의 이웃 건물 잘라냄
FEATHER = 260        # 교회 왼쪽 가장자리를 하늘로 녹이는 폭(캔버스 px)
SKY_X = (540, 600)   # 순수 하늘 샘플 열(원본 좌표, 십자가 탑 오른쪽)
SKY_Y = 330          # 이 행까지가 순수 하늘
# 지평선 쪽 외삽 감쇠 — 낮은 옅게 밝아져도 자연스럽지만 밤은 남색을 지켜야 회보라로 바래지 않는다
DAMP = {'day': 0.35, 'night': 0.10}
# 먼 도시 보케: zoom=캔버스 높이 대비 확대, blur=흐림 반경, hi_from 이상 밝기만 점광(glow·warm 색),
# lo_to 이하 어둠은 shade 만큼 눌러 건물 실루엣
BOKEH = {
    'day': dict(zoom=1.4, blur=30, hi_from=0.80, glow=0.0, warm=(255, 250, 235), lo_to=0.45, shade=0.04),
    'night': dict(zoom=1.4, blur=16, hi_from=0.40, glow=0.5, warm=(214, 178, 118), lo_to=0.16, shade=0.26),
}
# 잎 실루엣: rx·ry=왼쪽 위 기준 타원 마스크 반경(화면 비율), alpha=최대 농도, darken=실루엣 색(하늘색×배율)
FOLIAGE = {
    'day': dict(rx=0.58, ry=0.70, alpha=0.55, darken=0.80, vignette=0.06),
    'night': dict(rx=0.58, ry=0.70, alpha=0.92, darken=0.50, vignette=0.22),
}

def foliage_mask(w, h, seed=0):
    """왼쪽 위 모서리에서 늘어지는 가지+잎 실루엣(0~1 마스크). 두 겹(앞:많이 흐림, 중간:조금 흐림)."""
    rng = np.random.default_rng(seed)

    def bezier(p0, p1, p2, n=40):
        t = np.linspace(0, 1, n)[:, None]
        return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2

    def draw_layer(n_branches, leaf_r, blur, width):
        img = Image.new('L', (w, h), 0)
        d = ImageDraw.Draw(img)
        for _ in range(n_branches):
            # 시작점: 위쪽 가장자리(왼쪽 55%) 또는 왼쪽 가장자리(위 60%)
            if rng.random() < 0.6:
                p0 = np.array([rng.uniform(-0.05, 0.55) * w, rng.uniform(-0.08, 0.02) * h])
                ang = rng.uniform(np.pi * 0.25, np.pi * 0.75)     # 아래쪽으로
            else:
                p0 = np.array([rng.uniform(-0.06, 0.0) * w, rng.uniform(0.0, 0.6) * h])
                ang = rng.uniform(-np.pi * 0.25, np.pi * 0.35)    # 오른쪽으로
            length = rng.uniform(0.28, 0.5) * h
            p2 = p0 + length * np.array([np.cos(ang), np.sin(ang)])
            p1 = (p0 + p2) / 2 + rng.normal(0, 0.12 * length, 2)
            pts = bezier(p0, p1, p2)
            for i in range(len(pts) - 1):
                wd = max(1, width * (1 - i / len(pts)))
                d.line([tuple(pts[i]), tuple(pts[i + 1])], fill=255, width=int(wd))
            # 잔가지
            for _ in range(rng.integers(2, 4)):
                k = rng.integers(len(pts) // 4, len(pts) - 2)
                q0 = pts[k]
                a2 = ang + rng.uniform(-0.9, 0.9)
                l2 = length * rng.uniform(0.25, 0.5)
                q2 = q0 + l2 * np.array([np.cos(a2), np.sin(a2)])
                q1 = (q0 + q2) / 2 + rng.normal(0, 0.12 * l2, 2)
                sub = bezier(q0, q1, q2, 20)
                for i in range(len(sub) - 1):
                    d.line([tuple(sub[i]), tuple(sub[i + 1])], fill=255, width=max(1, int(width * 0.45 * (1 - i / 20))))
                pts = np.concatenate([pts, sub])
            # 잎: 가지를 따라 무리로
            for c in pts[::3]:
                if rng.random() < 0.55:
                    continue
                for _ in range(rng.integers(2, 6)):
                    cx, cy = c + rng.normal(0, leaf_r * 1.6, 2)
                    rr = leaf_r * rng.uniform(0.6, 1.3)
                    th = rng.uniform(0, np.pi)
                    # 잎 모양: 양끝이 뾰족한 렌즈꼴 폴리곤
                    tt = np.linspace(0, 2 * np.pi, 14)
                    ex, ey = rr * np.cos(tt), rr * 0.45 * np.sin(tt) * (1 - 0.25 * np.abs(np.cos(tt)))
                    poly = [(cx + ex[j] * np.cos(th) - ey[j] * np.sin(th), cy + ex[j] * np.sin(th) + ey[j] * np.cos(th)) for j in range(len(tt))]
                    d.polygon(poly, fill=255)
        return np.asarray(img.filter(ImageFilter.GaussianBlur(blur))).astype(np.float32) / 255

    front = draw_layer(3, leaf_r=22, blur=9, width=13)    # 카메라 바로 앞 — 크고 많이 흐림
    mid = draw_layer(10, leaf_r=12, blur=2.5, width=6)        # 조금 뒤 — 형태가 보임
    return np.clip(front * 0.7 + mid, 0, 1)


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


for key, path in SRC.items():
    im = Image.open(path).convert('RGB')
    src = np.asarray(im).astype(np.float32)
    scale = H / im.height

    # 하늘 그라데이션: 샘플 열의 행별 평균 → 캔버스 스케일로 보간 → 아래로 완만히 외삽
    col = src[:SKY_Y, SKY_X[0]:SKY_X[1]].mean(axis=1)
    sky_rows = int(SKY_Y * scale)
    ys = np.linspace(0, SKY_Y - 1, sky_rows)
    grad = np.stack([np.interp(ys, np.arange(SKY_Y), col[:, c]) for c in range(3)], axis=1)
    top, bot = grad[:40].mean(axis=0), grad[-40:].mean(axis=0)
    slope = (bot - top) / max(sky_rows, 1)
    rest = H - sky_rows
    t = np.arange(rest) / max(rest, 1)
    ext = bot[None, :] + slope[None, :] * (rest * (1 - (1 - t) ** 2) * DAMP[key])[:, None]
    grad = np.clip(np.concatenate([grad, ext], axis=0), 0, 255)
    canvas = np.repeat(grad[:, None, :], W, axis=1)

    # ── 왼쪽 여백을 '심도 흐림 장면'으로: 단색 하늘은 밋밋하다는 피드백(2026-09-03) ──
    yy, xx = np.mgrid[0:H, 0:W]
    fx, fy = xx / W, yy / H
    left_mask = 1 - smoothstep((fx - 0.28) / 0.30)          # 왼쪽에서 교회 쪽으로 사라지는 가중치

    # (1) 먼 도시 보케: 사진을 좌우 반전·확대·강하게 흐린 뒤, 밝은 부분(불 켜진 창)만 따뜻한
    #     점광으로 얹고 어두운 덩어리는 살짝만 눌러 '멀리 흐릿한 건물 실루엣'을 만든다.
    #     흐린 사진을 통째로 깔면 회색 안개가 되므로(검증됨) 하이라이트·섀도만 쓴다
    bk = BOKEH[key]
    big = im.transpose(Image.FLIP_LEFT_RIGHT)
    bh = int(H * bk['zoom'])
    big = big.resize((round(big.width * bh / big.height), bh), Image.LANCZOS)
    big = big.filter(ImageFilter.GaussianBlur(bk['blur']))
    lum = np.asarray(big.convert('L')).astype(np.float32) / 255
    lum = lum[bh - H:, :W] if lum.shape[1] >= W else np.pad(lum[bh - H:], ((0, 0), (0, W - lum.shape[1])), mode='edge')
    band = smoothstep((fy - 0.30) / 0.25) * (1 - smoothstep((fy - 0.80) / 0.15))   # 화면 중간~아래 띠
    hi = np.clip((lum - bk['hi_from']) / (1 - bk['hi_from']), 0, 1) * band * left_mask
    lo = np.clip((bk['lo_to'] - lum) / bk['lo_to'], 0, 1) * band * left_mask
    warm = np.array(bk['warm'], np.float32)[None, None, :]
    canvas = canvas * (1 - bk['shade'] * lo[..., None])
    canvas = canvas + (warm - canvas) * (bk['glow'] * hi)[..., None]

    # (2) 초점 밖 잎·가지 실루엣(절차적): 왼쪽 위 모서리에서 늘어진 가지에 잎을 흩뿌리고 흐린다.
    #     사진의 나무를 잘라 쓰면 창문 격자가 딸려와 어색하다(검증됨)
    fl = FOLIAGE[key]
    sil = foliage_mask(W, H, seed=11)
    r = np.sqrt((fx / fl['rx']) ** 2 + (fy / fl['ry']) ** 2)
    sil = sil * (1 - smoothstep((r - 0.5) / 0.5)) * fl['alpha']
    canvas = canvas * (1 - sil[..., None]) + (canvas * fl['darken']) * sil[..., None]

    # (3) 글자 자리 바닥·왼쪽 모서리를 살짝 눌러 텍스트가 뜨게
    vig = (1 - fl['vignette'] * smoothstep((fy - 0.45) / 0.55) * (1 - smoothstep((fx - 0.15) / 0.45)))[..., None]
    canvas = canvas * vig

    canvas += np.random.default_rng(7).normal(0, 1.2, canvas.shape)  # 밴딩 방지 노이즈

    # 교회 레이어: 높이 H 에 맞춰 축소, 오른쪽 정렬, 왼쪽 가장자리 페더
    church = im.crop((CROP_L, 0, im.width, im.height))
    cw = round(church.width * scale)
    ch = np.asarray(church.resize((cw, H), Image.LANCZOS)).astype(np.float32)
    x0 = W - cw
    alpha = smoothstep(np.arange(cw) / FEATHER)[None, :, None]
    canvas[:, x0:, :] = ch * alpha + canvas[:, x0:, :] * (1 - alpha)

    out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    dest = VISIT / f'church-{key}.webp'
    out.save(dest, 'WEBP', quality=84, method=6)
    print(f'{dest.name}: {out.size}, church {cw}px ({cw / W:.0%})')
