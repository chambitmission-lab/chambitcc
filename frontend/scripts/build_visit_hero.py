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
FEATHER = 72         # 교회 왼쪽 가장자리를 하늘로 녹이는 폭(캔버스 px). 260이면 왼쪽 동(약 140px)이 통째로 사라지고,
                     # 120도 왼쪽 동 창이 반쯤 가려 '사진을 덜 가리게' 피드백 → 좁게
SKY_X = (540, 600)   # 순수 하늘 샘플 열(원본 좌표, 십자가 탑 오른쪽)
SKY_Y = 330          # 이 행까지가 순수 하늘
# 지평선 쪽 외삽 감쇠 — 낮은 옅게 밝아져도 자연스럽지만 밤은 남색을 지켜야 회보라로 바래지 않는다
DAMP = {'day': 0.05, 'night': 0.10}   # 낮 0.35는 왼쪽 아래가 희게 바래 오른쪽 사진 하늘과 색이 안 맞았다(2026-09-03)
FLATTEN = {'day': 0.35, 'night': 0.0}   # 밤 0.45는 위쪽이 사진 하늘보다 밝아져 좌우 색이 어긋났다(2026-09-03)
# 먼 도시 보케: zoom=캔버스 높이 대비 확대, blur=흐림 반경, hi_from 이상 밝기만 점광(glow·warm 색),
# lo_to 이하 어둠은 shade 만큼 눌러 건물 실루엣. 2026-09-03 현재 glow·shade=0 으로 꺼둠 —
# 흐린 띠가 '얼룩'으로 읽힌다는 피드백. 레퍼런스처럼 깨끗한 하늘 + 잎 실루엣만 쓴다
BOKEH = {
    'day': dict(zoom=1.4, blur=30, hi_from=0.80, glow=0.0, warm=(255, 250, 235), lo_to=0.45, shade=0.0),
    'night': dict(zoom=1.4, blur=26, hi_from=0.45, glow=0.0, warm=(214, 178, 118), lo_to=0.16, shade=0.0),
}
# 잎 실루엣: rx·ry=왼쪽 위 기준 타원 마스크 반경(화면 비율), alpha=최대 농도, darken=실루엣 색(하늘색×배율)
FOLIAGE = {
    'day': dict(rx=0.62, ry=0.80, alpha=0.0, darken=0.80, vignette=0.06),   # 라이트는 나무 없이 파란 하늘만(사용자 결정)
    'night': dict(rx=0.62, ry=0.80, alpha=0.82, darken=0.52, vignette=0.07),
}

def foliage_mask(w, h, seed=0):
    """왼쪽 위에서 늘어진 나뭇가지 실루엣(0~1 마스크).
    가지는 재귀로 뻗고(중력 방향으로 살짝 처짐), 끝가지마다 잎을 어긋나게 단다.
    2배 해상도로 그려 축소해 잎 가장자리를 매끈하게, 흐림은 아주 약하게 — 잎이 '잎'으로 읽혀야 한다
    (덩어리를 세게 흐리면 얼룩처럼 보인다는 피드백 2026-09-03)."""
    rng = np.random.default_rng(seed)
    S = 2
    img = Image.new('L', (w * S, h * S), 0)
    d = ImageDraw.Draw(img)

    def leaf(cx, cy, ang, ln):
        # 잎: 끝이 뾰족한 렌즈꼴 + 살짝 비대칭. ln=잎 길이(px, 2배 해상도 기준)
        tt = np.linspace(0, 2 * np.pi, 18)
        ex = ln / 2 * np.cos(tt)
        ey = ln * 0.24 * np.sin(tt) * (1 - 0.35 * np.abs(np.cos(tt))) * (1 + 0.15 * np.sin(tt))
        ca, sa = np.cos(ang), np.sin(ang)
        d.polygon([(cx + ln / 2 * ca + ex[j] * ca - ey[j] * sa, cy + ln / 2 * sa + ex[j] * sa + ey[j] * ca) for j in range(len(tt))], fill=255)

    def grow(p, ang, length, depth, width):
        pts = [p]
        n = 7
        a = ang
        for i in range(n):
            a += rng.normal(0, 0.10) + 0.035 * np.cos(a)   # 중력: 아래로 살짝 처짐
            q = pts[-1] + (length / n) * np.array([np.cos(a), np.sin(a)])
            d.line([tuple(pts[-1] * S), tuple(q * S)], fill=255, width=max(1, int(width * S * (1 - 0.5 * i / n))))
            pts.append(q)
        pts = np.array(pts)
        if depth >= 2:
            # 잎: 가지를 따라 어긋나게, 잎은 가지 방향에서 벌어지고 아래로 살짝 처진다
            step = 7
            total = length
            k = 0
            for t in np.arange(0, total, step):
                idx = min(int(t / total * n), n - 1)
                seg = pts[idx + 1] - pts[idx]
                sa_ = np.arctan2(seg[1], seg[0])
                base = pts[idx] + seg * ((t / total * n) - idx)
                side = 1 if k % 2 == 0 else -1
                k += 1
                if rng.random() < 0.45:
                    continue
                la = sa_ + side * rng.uniform(0.55, 1.15) + 0.25 * rng.normal()
                ln = rng.uniform(16, 26) * S
                leaf(base[0] * S, base[1] * S, la, ln)
                # 잎 무리: 같은 자리에 한두 장 더
                if rng.random() < 0.3:
                    leaf(base[0] * S + rng.normal(0, 3) * S, base[1] * S + rng.normal(0, 3) * S,
                         la + rng.normal(0, 0.5), ln * rng.uniform(0.7, 1.0))
        if depth < 4:
            for _ in range(2):
                t = rng.uniform(0.35, 1.0)
                idx = min(int(t * n), n - 1)
                q = pts[idx]
                seg = pts[idx + 1] - pts[idx] if idx + 1 < len(pts) else pts[idx] - pts[idx - 1]
                sa_ = np.arctan2(seg[1], seg[0])
                child_ang = sa_ + rng.choice([-1, 1]) * rng.uniform(0.35, 0.85)
                grow(q, child_ang, length * rng.uniform(0.55, 0.75), depth + 1, width * 0.6)

    # 굵은 가지: 위쪽 가장자리(왼쪽 절반)에서 아래·오른쪽으로, 왼쪽 가장자리에서 오른쪽으로
    # 가지 수는 성기게 — 우거진 숲이 아니라 모서리에 걸린 가지 몇 개(과하다는 피드백 2026-09-03)
    for _ in range(3):
        p0 = np.array([rng.uniform(-0.04, 0.40) * w, rng.uniform(-0.06, -0.01) * h])
        grow(p0, rng.uniform(np.pi * 0.30, np.pi * 0.62), rng.uniform(0.34, 0.5) * h, 0, 7)
    for _ in range(2):
        p0 = np.array([rng.uniform(-0.05, -0.01) * w, rng.uniform(0.02, 0.4) * h])
        grow(p0, rng.uniform(-0.15, 0.45), rng.uniform(0.34, 0.5) * h, 0, 7)

    m = img.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.4))
    sharp = np.asarray(m).astype(np.float32) / 255
    # 초점 밖 느낌은 아주 옅은 번짐 한 겹으로만
    soft = np.asarray(img.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255
    return np.clip(sharp + 0.15 * soft, 0, 1)


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
    # 밤: 지평선 밝은 띠를 눌러 하늘을 고르게(중간이 뿌옇게 밝으면 안개처럼 보인다)
    grad = grad * (1 - FLATTEN[key]) + grad.mean(axis=0, keepdims=True) * FLATTEN[key]
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
    if fl['alpha'] > 0:
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
