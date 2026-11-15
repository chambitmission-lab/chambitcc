#!/usr/bin/env python3
"""홈 히어로(교회 밤 사진) 점등 레이어 생성 — 2026-11-15

다크 홈 히어로 church-{season}-night.webp 에서 십자가 네온·처마 LED 띠·간판 '참빛교회' 글자의
'빛나는 픽셀'만 골라 두 장을 만든다(사진의 해당 영역만 잘라 낸 SPRITE 상자):
  church-{season}-night-off.webp  꺼진 상태 — 빛 픽셀을 주변 벽으로 메우고(inpaint) 어둡게, 알파=빛 마스크.
                                   사진 위에 덮으면 불이 꺼져 보이고, 걷어 내면(opacity 0) 원래 사진 = 불이 켜진다.
  church-{season}-night-glow.webp 빛만 — 켜지는 순간의 번쩍임·이후 숨쉬기(screen 합성)용.
네 장 모두 같은 구도(704×900, 종탑 꼭대기 y≈65)라 상자·영역은 공통 상수. 사진을 바꾸면 다시 돌리고
REGIONS 가 여전히 맞는지 확인할 것(프론트 heroLights.ts 의 좌표와 동기).

  python3 scripts/gen-hero-lights.py
"""
from pathlib import Path

import cv2
import numpy as np

HERO = Path(__file__).resolve().parent.parent / 'src/assets/hero'
SEASONS = ('spring', 'summer', 'autumn', 'winter')

# 잘라 낼 상자(원본 px) — heroLights.ts SPRITE 와 같아야 한다
SX, SY, SW, SH = 340, 90, 364, 290

# 영역(원본 px). 띠는 왼쪽 아래(409,311) → 오른쪽 위로 기울기 -0.299 인 선 둘레 ±13px
CROSS = (354, 98, 426, 224)
LETTERS = ((446, 324, 488, 366), (484, 312, 528, 356), (521, 302, 566, 346), (567, 290, 611, 336))
STRIP_X = (400, 704)


def strip_band(h: int, w: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    line_y = 311 - (xx - 409) * 0.299
    band = (np.abs(yy - line_y) < 13) & (xx >= STRIP_X[0]) & (xx < STRIP_X[1])
    return band.astype(np.float32)


def box(h: int, w: int, b: tuple[int, int, int, int]) -> np.ndarray:
    m = np.zeros((h, w), np.float32)
    x0, y0, x1, y1 = b
    m[y0:y1, x0:x1] = 1
    return m


def smooth(v: np.ndarray, lo: float, hi: float) -> np.ndarray:
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def cross_masks(h: int, w: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """꺼진 십자가 — 앞면(관 1)·옆면(관 2)·이음매(사이 홈). 원본에서 잰 좌표:
    세로대 앞면 x 384~390 / 옆면 393~399, y 108~211. 가로대는 오른쪽으로 올라가는 기울기 -0.31,
    윗줄(앞면) 위 끝 y = 133 @x370 에서 5px, 아랫줄(옆면) +9~+14, x 362~418.
    네온이 새어 나오지 않게 실제 그리는 모양은 1~2px 넉넉하게."""
    k = 4
    def fill(pts):
        m = np.zeros((h * k, w * k), np.uint8)
        cv2.fillPoly(m, [np.round(np.array(pts) * k).astype(np.int32)], 255)
        return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    top = lambda x: 133 - 0.31 * (x - 370)
    arm = lambda y0, y1: [(360, top(360) + y0), (420, top(420) + y0), (420, top(420) + y1), (360, top(360) + y1)]
    v_face = fill([(382.5, 107.5), (390.5, 107.5), (390.5, 212.5), (382.5, 212.5)])
    v_side = fill([(392.5, 110), (400.5, 110), (400.5, 212.5), (392.5, 212.5)])
    v_seam = fill([(390.5, 108), (392.5, 108), (392.5, 212.5), (390.5, 212.5)])
    h_face = fill(arm(-1, 5))
    h_seam = fill(arm(5, 9.5))
    h_side = fill(arm(9.5, 15))
    # 세로대가 가로대 위를 지나간다(앞으로 나온 쪽)
    vert = np.clip(v_face + v_side + v_seam, 0, 1)
    face = np.clip(v_face + h_face * (1 - vert), 0, 1)
    side = np.clip(v_side + h_side * (1 - vert), 0, 1)
    seam = np.clip(v_seam + h_seam * (1 - vert), 0, 1)
    return face, side, seam


def build(season: str) -> None:
    src = HERO / f'church-{season}-night.webp'
    im = cv2.imread(str(src))
    h, w = im.shape[:2]
    assert (w, h) == (704, 900), f'{src.name}: 구도가 다르다 {w}x{h}'
    lum = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    val = im.max(axis=2).astype(np.float32)

    cross_core = smooth(lum, 200, 240) * box(h, w, CROSS)
    strip_core = smooth(lum, 200, 240) * strip_band(h, w)
    letters_zone = np.zeros((h, w), np.float32)
    for b in LETTERS:
        letters_zone = np.maximum(letters_zone, box(h, w, b))
    letter_core = smooth(val, 195, 240) * letters_zone
    core = np.maximum.reduce([cross_core, strip_core, letter_core])

    # 꺼진 색 — 빛 픽셀과 그 둘레 빛 무리(벽에 번진 빛)를 통째로 주변 벽으로 메운다(inpaint).
    # 글자는 상자째 메운 뒤 글자 모양만 어둡게 남긴다(불 꺼진 채널 간판 = 벽보다 어두운 금속 글자).
    # 네온관·LED 띠는 꺼져도 흰 관이 보이므로 원본을 조금 섞는다.
    halo_zone = cv2.dilate((core > 0.05).astype(np.uint8), np.ones((9, 9), np.uint8))
    letter_box = (letters_zone > 0).astype(np.uint8)
    hard = np.maximum(halo_zone, cv2.dilate(letter_box, np.ones((5, 5), np.uint8)))
    wall = cv2.inpaint(im, hard * 255, 7, cv2.INPAINT_TELEA).astype(np.float32)
    lc = letter_core[..., None]
    nc = np.maximum(cross_core, strip_core)[..., None]
    tube = im.astype(np.float32) * 0.42
    off = wall * (1 - lc * 0.55)
    off = off * (1 - nc * 0.55) + tube * nc * 0.55
    off = off * 0.9

    # 십자가는 따로(2026-11-15 "꺼진 십자가가 뭉개진다") — 픽셀을 메우면 종탑 질감이 번지고 빛 무리까지 십자가로 잡혀
    # 얼룩이 된다. 그래서 ① 종탑은 메우지 않고 푸른 빛 무리만 어둡게·무채색으로 낮추고 ② 꺼진 십자가는 실제 구조
    # (네온관 두 줄 = 앞면·옆면, 사이 이음매)대로 반듯한 다각형을 4배로 그려 내려 또렷하게 얹는다.
    cbox = box(h, w, CROSS)
    glow_amt = np.clip(cv2.GaussianBlur(cross_core, (0, 0), 6) * 2.4, 0, 1)[..., None]
    tower = im.astype(np.float32)
    gray = tower.mean(axis=2, keepdims=True)
    tower = (tower * (1 - glow_amt * 0.6) + gray * glow_amt * 0.6) * (1 - glow_amt * 0.58)
    face, side, seam = cross_masks(h, w)
    base = cv2.GaussianBlur(tower, (0, 0), 6)  # 관 둘레 벽 톤 — 십자가 색을 사진 밝기에 맞춘다
    col_face = base * 0.45 + np.array([84, 82, 80], np.float32)  # BGR — 살짝 찬 회색 금속
    col_side = base * 0.4 + np.array([60, 58, 57], np.float32)
    col_seam = base * 0.35 + np.array([34, 33, 33], np.float32)
    cross_off = tower
    for m, col in ((seam, col_seam), (side, col_side), (face, col_face)):
        cross_off = cross_off * (1 - m[..., None]) + col * m[..., None]
    cb = cbox[..., None]
    off = off * (1 - cb) + cross_off * cb

    # 알파 — 메운 자리 전체를 부드러운 가장자리로 덮는다
    alpha = np.clip(cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 2.2) * 1.25, 0, 1)

    off_rgba = np.dstack([np.clip(off, 0, 255), alpha * 255]).astype(np.uint8)
    glow_rgba = np.dstack([im, np.clip(core * 255, 0, 255)]).astype(np.uint8)

    crop = (slice(SY, SY + SH), slice(SX, SX + SW))
    for suffix, rgba in (('off', off_rgba), ('glow', glow_rgba)):
        out = HERO / f'church-{season}-night-{suffix}.webp'
        cv2.imwrite(str(out), rgba[crop], [cv2.IMWRITE_WEBP_QUALITY, 88])
        print(f'{out.name}  {out.stat().st_size // 1024}KB')


if __name__ == '__main__':
    for s in SEASONS:
        build(s)
