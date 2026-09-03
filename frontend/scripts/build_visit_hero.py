"""/visit 히어로 자산 빌드.

원본 예배당 사진(1024x1048, 낮/밤)을 오른쪽에 두고 — 십자가 탑부터 입구·가로등까지 전경 그대로 —
왼쪽은 그 사진의 '진짜 하늘'(구름 포함)을 좌우로 이어 붙인 1600x800(2:1) 와이드 자산을 만든다.

이음새 원칙(2026-09-03, 이전 방식은 왼쪽 동을 세로로 잘라 72px 페더로 녹였는데
'건물이 반쯤 지워진' 어색한 세로 경계 + 합성 하늘의 색이 사진과 안 맞는다는 피드백):
  * 교회는 왼쪽 동 벽의 실제 모서리(원본 x=8)에서 자른다 — 경계가 건축선이라 페더가 필요 없다.
  * 동 지붕 위로 보이던 이웃 건물(x<84, y<227)만 하늘로 지운다.
  * 왼쪽 하늘은 합성 그라데이션이 아니라 사진의 하늘 영역(SKY_BOX)을 좌우 반전해 쓴다.
    세로는 지붕 높이까지 사진과 같은 축척(이음새 색이 정의상 연속), 그 아래는 하늘 아랫부분을
    길게 늘여 지평선 안개처럼 — 구름·안개 질감이 그대로라 '붙인 티'가 안 난다.
  * 지면(맨 아래 몇 십 px)만 왼쪽으로 부드럽게 녹인다.

    python scripts/build_visit_hero.py
      → public/images/visit/_backup/church-{day,night}-src.webp 를 읽어
        public/images/visit/church-{day,night}.webp 를 덮어쓴다
    python scripts/build_visit_hero.py 낮원본.png 밤원본.png   # 다른 원본으로 (같은 구도여야 한다)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None

ROOT = Path(__file__).resolve().parents[1]
VISIT = ROOT / 'public' / 'images' / 'visit'
SRC = {
    'day': Path(sys.argv[1]) if len(sys.argv) > 1 else VISIT / '_backup' / 'church-day-src.webp',
    'night': Path(sys.argv[2]) if len(sys.argv) > 2 else VISIT / '_backup' / 'church-night-src.webp',
}
W, H = 1600, 800
WING_X = 8                     # 왼쪽 동 벽의 실제 모서리(원본 x). 그 왼쪽은 이웃 건물
NEIGH = (84, 227)              # 이웃 건물이 동 지붕 위로 보이는 영역: x<84, y<227 (원본) → 하늘로
SKY_BOX = (84, 0, 400, 226)    # 왼쪽 동 바로 옆 하늘(구름 없음, 십자가 탑 왼쪽) — 이음새와 같은 색.
                               # 오른쪽 구름 하늘(500~865)을 늘려 쓰면 구름이 얼룩처럼 번지고 색도 벽 옆보다 진해
                               # 어긋난다는 피드백(2026-09-03)
EXT_DAMP = {'day': 0.18, 'night': 0.08}   # 지붕 아래로 하늘 아랫부분의 밝아지는 추세를 옅게만 이어 간다 — 밤은 남색을 지켜야 회보라로 안 바랜다
EDGE_SOFT = 2.5                # 벽 모서리 안티에일리어싱 폭(px)
GROUND_Y = 1000                # 이 행(원본) 아래 지면만 왼쪽으로 녹인다
GROUND_FEATHER = 90
TEX_BLUR = 5                   # 늘린 하늘의 보간 자국을 지우는 정도
# 원본 오른쪽 아래 용달차(+옆 사람)를 지운다(2026-09-03 요청). OpenCV FSR 인페인팅 — Telea·패치 복제는
# 얼룩·타일 무늬가 났고, 광장 바닥은 FSR 이 가장 매끈했다. 다각형은 원본 좌표
REMOVE_POLYS = [
    [(914, 972), (975, 962), (1024, 972), (1024, 1048), (930, 1048), (914, 1030)],   # 용달차
    [(1000, 978), (1018, 978), (1018, 1012), (1000, 1012)],                           # 사람
]
# 잎 실루엣: rx·ry=왼쪽 위 기준 타원 마스크 반경(화면 비율), alpha=최대 농도, darken=실루엣 색(하늘색×배율)
FOLIAGE = {
    'day': dict(rx=0.62, ry=0.80, alpha=0.0, darken=0.80),    # 라이트는 나무 없이 파란 하늘만(사용자 결정)
    'night': dict(rx=0.62, ry=0.80, alpha=0.82, darken=0.52),  # 밤은 모서리에 걸린 가지 몇 개(2026-09-03 유지)
}



def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def remove_objects(im, polys):
    """다각형 영역을 주변 질감으로 메운다(FSR). OpenCV contrib 이 없으면 원본 그대로 두고 경고."""
    if cv2 is None or not hasattr(cv2, 'xphoto'):
        print('  ! opencv-contrib 없음 — 용달차 제거 생략')
        return im
    mask = Image.new('L', im.size, 0)
    d = ImageDraw.Draw(mask)
    for poly in polys:
        d.polygon(poly, fill=255)
    keep = (255 - np.asarray(mask)).astype(np.uint8)
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    dst = np.zeros_like(bgr)
    cv2.xphoto.inpaint(bgr, keep, dst, cv2.xphoto.INPAINT_FSR_BEST)
    return Image.fromarray(cv2.cvtColor(dst, cv2.COLOR_BGR2RGB))


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


for key, path in SRC.items():
    im = remove_objects(Image.open(path).convert('RGB'), REMOVE_POLYS)
    scale = H / im.height

    # ── 하늘 캔버스: 사진의 진짜 하늘을 좌우 반전해 캔버스 전체 폭으로(구름이 가로로 길어지는 건 층운처럼 자연스럽다)
    sky = im.crop(SKY_BOX).transpose(Image.FLIP_LEFT_RIGHT)
    sky_h = SKY_BOX[3] - SKY_BOX[1]
    roof_c = int(NEIGH[1] * scale)                       # 캔버스에서 동 지붕 높이
    s = np.asarray(sky.resize((W, sky_h), Image.LANCZOS)).astype(np.float32)
    # 세로: 하늘 샘플 높이까지 1:1(이음새 색 연속), 그 아래는 마지막 행 색을 잇되 지평선 쪽 밝아지는 추세만 옅게 외삽
    top_c = int(sky_h * scale)
    ys = np.minimum(np.arange(H) / scale, sky_h - 1)
    canvas = np.stack(
        [np.stack([np.interp(ys, np.arange(sky_h), s[:, x, c]) for c in range(3)], axis=1) for x in range(W)],
        axis=1,
    )
    slope = (s[-20:].mean(axis=0) - s[-60:-40].mean(axis=0)) / (40 / scale)   # 캔버스 행당 변화
    rest = H - top_c
    t = np.arange(rest) / max(rest - 1, 1)
    canvas[top_c:] += (slope[None, :, :] * (rest * (1 - (1 - t) ** 2) * EXT_DAMP[key])[:, None, None])
    canvas = np.asarray(
        Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(TEX_BLUR))
    ).astype(np.float32)

    # ── 초점 밖 잎·가지 실루엣(절차적, 밤만): 왼쪽 위 모서리에서 늘어진 가지.
    #    사진의 나무를 잘라 쓰면 창문 격자가 딸려와 어색하다(검증됨)
    fl = FOLIAGE[key]
    if fl['alpha'] > 0:
        yy, xx = np.mgrid[0:H, 0:W]
        fx, fy = xx / W, yy / H
        sil = foliage_mask(W, H, seed=11)
        r = np.sqrt((fx / fl['rx']) ** 2 + (fy / fl['ry']) ** 2)
        sil = sil * (1 - smoothstep((r - 0.5) / 0.5)) * fl['alpha']
        canvas = canvas * (1 - sil[..., None]) + (canvas * fl['darken']) * sil[..., None]

    # ── 교회 레이어: 실제 모서리에서 자르고 오른쪽 정렬
    church = im.crop((WING_X, 0, im.width, im.height))
    cw = round(church.width * scale)
    ch = np.asarray(church.resize((cw, H), Image.LANCZOS)).astype(np.float32)
    x0 = W - cw
    yy, xx = np.mgrid[0:H, 0:cw]
    alpha = smoothstep(xx / EDGE_SOFT)
    # 지붕 위 이웃 건물 지우기
    nx = (NEIGH[0] - WING_X) * scale
    neigh = (1 - smoothstep((xx - nx) / 40)) * (1 - smoothstep((yy - (roof_c - 1)) / 1.0))
    alpha = alpha * (1 - neigh)
    # 지면: 아래로 갈수록 넓게 녹인다
    gy = GROUND_Y * scale
    gw = GROUND_FEATHER * smoothstep((yy - gy) / (H - gy))
    alpha = alpha * np.where(gw > 0, smoothstep(xx / np.maximum(gw, 1e-3)), 1)
    a = alpha[..., None]
    canvas[:, x0:, :] = ch * a + canvas[:, x0:, :] * (1 - a)

    canvas += np.random.default_rng(7).normal(0, 1.0, canvas.shape)  # 밴딩 방지 노이즈
    out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    dest = VISIT / f'church-{key}.webp'
    out.save(dest, 'WEBP', quality=84, method=6)
    print(f'{dest.name}: {out.size}, church {cw}px ({cw / W:.0%})')
