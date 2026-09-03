"""/visit 히어로 자산 빌드 (v3: RGBA 교회 레이어 + CSS 배경).

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
# 2026-09-03 v3 — 레퍼런스(좌: 매트한 배경+글자, 우: 교회가 배경에서 스며 나오듯) 구도.
# 자산은 RGBA: 교회만 불투명, 왼쪽 동 벽에서 FADE 폭만큼 알파가 0→1 로 오르고 그 왼쪽은 완전 투명.
# 배경(남색/하늘 그라데이션·글로우·링)은 전부 CSS(Visit.css .visit-hero-stage)가 그린다 →
# 사진 하늘을 합성해 붙이던 v2 의 '색 안 맞는 이음새' 문제가 구조적으로 사라진다.
FADE = (-100, 240)             # 알파 램프 시작/끝(교회 왼쪽 모서리 기준 px). 왼쪽 동(가는 창 있는 흰 벽면)이
                               # 왼쪽 끝 ~0.2 에서 시작해 동 절반쯤(120px)에 0.7, 탑 전에 1 — 벽면·창이 또렷히 읽혀야 한다
                               # (2026-09-03: 하늘을 컷아웃한 뒤로는 램프가 짧아도 '반반 띠'가 안 생긴다. 예전 띠는 하늘 페이드 탓)
FADE_GAMMA = 1.0               # 램프 곡선(1=smoothstep 그대로)
NIGHT_DIM = 0.82               # 밤 사진은 살짝 눌러 남색 배경에 앉힌다(불 켜진 창의 대비는 유지)
BRANCH_BOX = (0, 0, 880, 480)  # 나뭇가지 실루엣 별도 레이어(branch-night.webp) 크롭 — 카드 왼쪽 위에 CSS 로 얹는다
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


def sky_mask(im, key):
    """사진에서 '하늘'(위쪽 테두리에 이어진 파란/흰 구름 또는 밤 남색 영역) 마스크(0~1).
    색 규칙으로 후보를 뽑고, 위쪽 테두리에 연결된 성분만 남긴다(창문 유리·캐노피처럼 건물 안에 갇힌 파랑은 제외).
    2026-09-03: 사진 하늘을 남기면 CSS 배경과 만나는 가로선이 생겨 부자연스럽다는 피드백 → 건물만 남긴다."""
    a = np.asarray(im).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (r * 299 + g * 587 + b * 114) // 1000
    if key == 'day':
        blue = (b - r > 12) & (b > g + 6)
        cloud = (lum > 222) & (b >= r - 4) & (b >= g - 4)
        cand = blue | cloud
    else:
        # 밤: 아주 어둡고 확실히 파란 것만 — 그늘진 오른쪽 부속 건물(회색, lum 60~90)이 하늘로 새면 구멍이 난다
        cand = (lum < 58) & (b - r > 8) & (b >= g)
    m = cand.astype(np.uint8)
    if cv2 is not None:
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        n, lab = cv2.connectedComponents(m, connectivity=4)
        top_labels = set(np.unique(lab[0:3, :])) - {0}
        keep = np.isin(lab, list(top_labels))
        m = keep.astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    sky = np.asarray(Image.fromarray(m * 255).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    return sky


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


def build_branch_layer():
    """밤 카드 왼쪽 위 나뭇가지 실루엣 — 투명 배경 위 진남색 실루엣(RGBA)."""
    yy, xx = np.mgrid[0:H, 0:W]
    fx, fy = xx / W, yy / H
    fl = FOLIAGE['night']
    sil = foliage_mask(W, H, seed=11)
    r = np.sqrt((fx / fl['rx']) ** 2 + (fy / fl['ry']) ** 2)
    sil = sil * (1 - smoothstep((r - 0.5) / 0.5))
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 3, 8, 20
    rgba[..., 3] = np.clip(sil * 255, 0, 255).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA').crop(BRANCH_BOX)
    dest = VISIT / 'branch-night.webp'
    out.save(dest, 'WEBP', quality=80, method=6)
    print(f'{dest.name}: {out.size}')


SKY_SIZE = (1600, 800)


def _smooth_noise(w, h, cells, rng):
    """저해상 난수를 바이큐빅으로 키운 부드러운 노이즈(0~1)."""
    small = rng.random((max(2, h // cells), max(2, w // cells))).astype(np.float32)
    return np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255


def build_sky_day(seed=3):
    """라이트 히어로 배경 — 레퍼런스(2026-09-03): 왼쪽은 흰 안개와 부드러운 구름 덩어리, 위·오른쪽으로 갈수록
    맑은 파랑. 사진 하늘(오른쪽 위 ≈ #79bafc)과 색이 이어지도록 오른쪽 위를 그 계열로 맞춘다."""
    W_, H_ = SKY_SIZE
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H_, 0:W_]
    fx, fy = xx / W_, yy / H_

    # 기본 하늘: 위쪽 진한 파랑 → 아래 옅게, 오른쪽이 왼쪽보다 조금 더 짙게
    top = np.array([0x6e, 0xb4, 0xf4], np.float32)
    low = np.array([0xc9, 0xe3, 0xfa], np.float32)
    t = smoothstep(fy * 1.15) * (1 - 0.18 * (1 - fx))
    base = top[None, None] * (1 - t[..., None]) + low[None, None] * t[..., None]

    # 구름: 여러 스케일의 부드러운 노이즈를 합쳐 덩어리로, 아래·왼쪽에 많고 오른쪽 위는 맑게
    n = (0.50 * _smooth_noise(W_, H_, 260, rng) + 0.30 * _smooth_noise(W_, H_, 120, rng)
         + 0.14 * _smooth_noise(W_, H_, 55, rng) + 0.06 * _smooth_noise(W_, H_, 24, rng))
    density = 0.35 + 0.65 * smoothstep((fy - 0.15) / 0.7) * (1 - 0.55 * smoothstep((fx - 0.45) / 0.5))
    cloud = smoothstep((n - (0.62 - 0.30 * density)) / 0.28)
    cloud = np.asarray(Image.fromarray((cloud * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255
    # 구름 아랫면은 아주 옅게 회청색으로 — 평면 흰 얼룩이 아니라 입체로 읽히게
    shade = np.asarray(Image.fromarray((cloud * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))).astype(np.float32) / 255
    white = np.array([255, 255, 255], np.float32)
    grey = np.array([0xd8, 0xe6, 0xf4], np.float32)
    img = base * (1 - cloud[..., None]) + white[None, None] * cloud[..., None]
    img = img * (1 - 0.18 * np.clip(shade - cloud, 0, 1)[..., None]) + grey[None, None] * 0.18 * np.clip(shade - cloud, 0, 1)[..., None]

    # 왼쪽 햇살 안개: 글자가 앉는 왼쪽 가운데는 거의 흰색으로 — 레퍼런스의 '흰색에서 점점 푸르게'
    haze = np.exp(-(((fx - 0.08) / 0.55) ** 2 + ((fy - 0.55) / 0.62) ** 2)) * 0.92
    img = img * (1 - haze[..., None]) + white[None, None] * haze[..., None]

    img += rng.normal(0, 0.7, img.shape)
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    dest = VISIT / 'sky-day.webp'
    out.save(dest, 'WEBP', quality=82, method=6)
    print(f'{dest.name}: {out.size}')


for key, path in SRC.items():
    im = remove_objects(Image.open(path).convert('RGB'), REMOVE_POLYS)
    scale = H / im.height
    roof_c = int(NEIGH[1] * scale)                       # 캔버스에서 동 지붕 높이

    # ── 교회 레이어: 실제 모서리에서 자르고 오른쪽 정렬
    church = im.crop((WING_X, 0, im.width, im.height))
    cw = round(church.width * scale)
    ch = np.asarray(church.resize((cw, H), Image.LANCZOS)).astype(np.float32)
    sky = np.asarray(Image.fromarray((sky_mask(im, key) * 255).astype(np.uint8)).crop((WING_X, 0, im.width, im.height))
                     .resize((cw, H), Image.LANCZOS)).astype(np.float32) / 255
    if key == 'night':
        ch = ch * NIGHT_DIM
    x0 = W - cw
    yy, xx = np.mgrid[0:H, 0:cw]
    # 하늘은 투명 — 배경은 CSS 가 그린다. 단 낮 사진의 구름은 살린다(2026-09-03 요청): 파란 하늘 픽셀(b-r 큼)은
    # 투명, 흰 구름 픽셀(b-r 작음)만 반투명으로 남겨 CSS 하늘 위에 떠 있게. 자산 위 가장자리는 페더로 녹여
    # 모바일에서 사진 레이어 상단선에 구름이 잘려 보이지 않게 한다
    if key == 'day':
        # 맑은 하늘 b-r ≈ 100~130, 구름 심지 ≈ 0~25. 100 부터 서서히 — 옅은 뭉게 가장자리까지 살린다
        cloud = np.clip((100 - (ch[..., 2] - ch[..., 0])) / 75, 0, 1) * 0.96
        cloud = cloud * smoothstep(yy / 60)
        cloud = np.asarray(Image.fromarray((cloud * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    else:
        cloud = 0.0
    alpha = smoothstep(xx / EDGE_SOFT) * (1 - sky * (1 - cloud))
    # 지붕 위 이웃 건물 지우기(투명으로)
    nx = (NEIGH[0] - WING_X) * scale
    neigh = (1 - smoothstep((xx - nx) / 40)) * (1 - smoothstep((yy - (roof_c - 1)) / 1.0))
    alpha = alpha * (1 - neigh)
    # 지면: 아래로 갈수록 넓게 녹인다
    gy = GROUND_Y * scale
    gw = GROUND_FEATHER * smoothstep((yy - gy) / (H - gy))
    alpha = alpha * np.where(gw > 0, smoothstep(xx / np.maximum(gw, 1e-3)), 1)
    # 왼쪽 동이 배경에서 스며 나오는 램프 — 레퍼런스의 '건물이 안개/밤에서 떠오르는' 느낌
    alpha = alpha * smoothstep((xx - FADE[0]) / (FADE[1] - FADE[0])) ** FADE_GAMMA

    canvas = np.zeros((H, W, 4), np.float32)
    canvas[:, x0:, :3] = ch
    canvas[:, x0:, 3] = alpha * 255
    canvas[..., :3] += np.random.default_rng(7).normal(0, 0.8, (H, W, 3))  # 밴딩 방지 노이즈
    out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), 'RGBA')
    dest = VISIT / f'church-{key}.webp'
    out.save(dest, 'WEBP', quality=86, method=6)
    print(f'{dest.name}: {out.size}, church {cw}px ({cw / W:.0%}), fade x {x0 + FADE[0]}~{x0 + FADE[1]}')

build_branch_layer()
build_sky_day()
