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
from PIL import Image

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
