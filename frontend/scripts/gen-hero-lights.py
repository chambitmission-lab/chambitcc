#!/usr/bin/env python3
"""홈 히어로(교회 밤 사진) 점등 레이어 생성 — 2026-11-15, 꺼진 십자가 2026-11-20 A안(유백 아크릴)

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
# 꺼진 십자가 A안(유백 아크릴) — 앞면 = 벽 톤×배율 + 색(BGR), 옆면 배율, 가장자리 하이라이트
CROSS_FACE_MUL = 1.05
CROSS_FACE_TINT = (22, 20, 18)
CROSS_SIDE_MUL = 0.45
CROSS_RIM = 10


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


def shift(a: np.ndarray, dx: float, dy: float) -> np.ndarray:
    h, w = a.shape[:2]
    return cv2.warpAffine(a, np.float32([[1, 0, dx], [0, 1, dy]]), (w, h), flags=cv2.INTER_LINEAR)


def cross_shape(h: int, w: int) -> np.ndarray:
    """앞으로 튀어나온 십자가 상자(앞면+테두리) — 원본에서 잰 좌표(네 계절 같은 구도).
    세로대 x 383.5~393.5, y 107~206.5 / 가로대 x 360.5~418, 위 끝 y = 134.5 @x361 에서 기울기 -0.28, 두께 7.
    ★ 그 오른쪽 아래로 비친 흰 십자가는 상자가 아니라 백라이트가 벽에 번진 빛이다(예전엔 이걸 '옆면'으로 칠해 두껍게 보였다)."""
    k = 4
    def fill(pts):
        m = np.zeros((h * k, w * k), np.uint8)
        cv2.fillPoly(m, [np.round(np.array(pts) * k).astype(np.int32)], 255)
        return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    top = lambda x: 134.5 - 0.28 * (x - 361)
    vert = fill([(383.5, 107), (393.5, 107), (393.5, 206.5), (383.5, 206.5)])
    arm = fill([(360.5, top(360.5)), (418, top(418)), (418, top(418) + 7), (360.5, top(360.5) + 7)])
    return np.clip(vert + arm, 0, 1)


def cross_off_layer(im: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """꺼진 십자가(2026-11-20 A안 '유백 아크릴' — 기도 카드 PrayerCrossLight 와 같은 결).
    ① 벽에 번진 백라이트 빛을 종탑 벽으로 메우고(줄눈은 원본의 어두운 잔결로 되살림)
    ② 불 꺼진 우윳빛 상자 + 오른쪽·아래 옆면(두께) + 벽 접촉 그림자를 얹는다.
    반환: 전체 크기 이미지(float)와 덮을 알파."""
    h, w = im.shape[:2]
    f = im.astype(np.float32)
    lum = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    cross = cross_shape(h, w)
    cbox = box(h, w, CROSS)

    # 빛 = 십자가 바로 둘레의 흰빛만. 노란 지붕·조명(R≫B)과 봄 사진의 밝은 파란 하늘(채도 높음)은 제외
    not_yellow = np.clip((f[..., 0] - f[..., 2] + 45) / 25, 0, 1)
    mx = f.max(axis=2)
    white = np.clip((0.5 - (mx - f.min(axis=2)) / np.maximum(mx, 1)) / 0.15, 0, 1)
    spill = np.zeros_like(cross)  # 백라이트 번짐 = 상자를 오른쪽 아래로 밀어 놓은 모양
    for dx in range(9):
        for dy in range(8):
            spill = np.maximum(spill, shift(cross, dx, dy))
    spill = spill * not_yellow
    near = cv2.dilate(((cross > 0.02) | (spill > 0.3)).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32)
    core = smooth(lum, 105, 190) * cbox * not_yellow * white * near
    hard = cv2.dilate(((core > 0.05) | (cross > 0.02) | (spill > 0.3)).astype(np.uint8), np.ones((5, 5), np.uint8))
    hard = (hard * (cbox > 0)).astype(np.uint8)
    wall = cv2.inpaint(im, hard * 255, 4, cv2.INPAINT_TELEA).astype(np.float32)

    # 줄눈 — 빛 아래에도 어두운 가는 선은 남아 있으니 원본의 '어두운 잔결'만 메운 밝기에 맞춰 되돌린다
    fine = np.minimum((f - cv2.GaussianBlur(f, (0, 0), 1.4)).mean(axis=2, keepdims=True), 0)
    gain = cv2.GaussianBlur(wall, (0, 0), 3).mean(axis=2, keepdims=True) / np.maximum(
        cv2.GaussianBlur(f, (0, 0), 3).mean(axis=2, keepdims=True), 1)
    keepfine = hard * (1 - cv2.dilate((cross > 0.02).astype(np.uint8), np.ones((5, 5), np.uint8)))
    keepfine = cv2.GaussianBlur(keepfine.astype(np.float32), (0, 0), 1.2)[..., None]
    wall = wall + fine * np.clip(gain, 0, 1.2) * keepfine * 1.3

    # 메운 자리 바로 바깥 엷은 번짐 — 무채색으로 조금 낮춤
    g = (np.clip(cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 5) * 1.2, 0, 1) * (1 - hard) * not_yellow)[..., None]
    wall = (wall * (1 - g * 0.4) + wall.mean(axis=2, keepdims=True) * g * 0.4) * (1 - g * 0.2)

    # 벽 접촉 그림자 — 상자가 오른쪽 아래 벽에 드리움
    ao = np.clip(cv2.GaussianBlur(shift(cross, 1.5, 2), (0, 0), 1.6) * 0.55, 0, 0.6) * (1 - cross)
    out = wall * (1 - ao[..., None])
    # 상자 — 우윳빛 앞면(벽 톤 + 살짝 따뜻한 흰빛), 위·왼쪽 가장자리 하이라이트, 오른쪽·아래 옆면
    base = cv2.GaussianBlur(wall, (0, 0), 6)
    face = base * CROSS_FACE_MUL + np.array(CROSS_FACE_TINT, np.float32)
    edge = np.clip(cross - shift(cross, 1, 1), 0, 1)
    face = face + edge[..., None] * CROSS_RIM * np.array([1.1, 1.0, 0.9], np.float32)
    side = np.clip(shift(cross, 1.5, 1.5) - cross, 0, 1)
    out = out * (1 - side[..., None]) + base * CROSS_SIDE_MUL * side[..., None]
    out = out * (1 - cross[..., None]) + face * cross[..., None]

    alpha = np.clip(np.maximum(cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 2.2) * 1.25,
                               np.maximum(g[..., 0] * 1.5, side)), 0, 1)
    return np.clip(out, 0, 255), alpha


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

    # 십자가는 따로 — 빛 번짐은 벽으로, 상자는 불 꺼진 우윳빛 아크릴로(cross_off_layer). CROSS 상자 안은 이걸로 통째 교체
    cross_off, cross_alpha = cross_off_layer(im)
    cb = box(h, w, CROSS)[..., None]
    off = off * (1 - cb) + cross_off * cb

    # 알파 — 메운 자리 전체를 부드러운 가장자리로 덮는다
    alpha = np.clip(cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 2.2) * 1.25, 0, 1)
    alpha = alpha * (1 - cb[..., 0]) + cross_alpha * cb[..., 0]

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
