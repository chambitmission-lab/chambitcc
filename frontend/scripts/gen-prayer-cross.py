#!/usr/bin/env python3
"""홈 우측 '이번주 기도' 카드(다크) 본당 십자가 점등 레이어 — 2026-11-16, 꺼진 모습 2026-11-20 C안(유백 아크릴)

src/assets/prayer-week/window-dark.webp(960x848) 강단 벽의 빛나는 십자가를 '꺼진 상태'로 만든 조각 두 장:
  window-dark-cross-off.webp   꺼진 십자가 — 둘레 빛 무리는 벽으로 메우고, 십자가는 '불 꺼진 우윳빛 아크릴' 물체로 남김.
                               켜졌을 때와 같은 물체라 점등이 자연스럽게 이어진다. 빛줄기가 오른쪽 위에서 오므로
                               위·오른쪽 모서리는 밝게, 벽엔 왼쪽 아래로 부드러운 그림자 + 접촉 그림자.
                               (평평한 벽색 판은 스티커처럼 보여 "어색하다"로 교체, 시안 A 철제·B 라이트박스·D 은은 중 C 채택)
                               사진 위에 덮었다가 걷어 내면(opacity 0) 원래 사진 = 불이 켜진다.
  window-dark-cross-glow.webp  빛만 — 켜지는 순간 번쩍임·숨쉬기(screen 합성)용.
상자(SX..)는 PrayerCrossLight.tsx 의 BOX 와 같아야 한다. 그림을 바꾸면 십자가 좌표부터 다시 잴 것.

  python scripts/gen-prayer-cross.py
"""
from pathlib import Path

import cv2
import numpy as np

ART = Path(__file__).resolve().parent.parent / 'src/assets/prayer-week'

# 잘라 낼 상자(원본 px) — PrayerCrossLight.tsx BOX 와 같아야 한다
SX, SY, SW, SH = 560, 300, 140, 200

# 십자가(원본 px에서 잰 값): 세로대 x 627~634, y 356~460 / 가로대 x 605~656, y 377~385
VERT = (626.5, 355.5, 634.5, 460.5)
HORZ = (604.5, 376.5, 656.5, 385.5)

# 꺼진 아크릴 — 벽 톤 대비 밝기 배율, 더하는 색(BGR: 살짝 따뜻한 우윳빛), 모서리 음영 세기, 테두리 하이라이트
BODY_MUL = 0.98
BODY_TINT = (10, 16, 20)
EDGE_LIGHT = 12
RIM = 12
# 벽에 드리운 그림자 — 빛줄기 반대(왼쪽 아래)로 dx·dy px, 번짐, 세기 / 벽에 닿는 접촉 그림자 세기
SHADOW = (-2.5, 3.5, 2.4, 0.45)
CONTACT = 0.25


def rect_mask(h: int, w: int, r: tuple[float, float, float, float], k: int = 4) -> np.ndarray:
    m = np.zeros((h * k, w * k), np.uint8)
    x0, y0, x1, y1 = (np.array(r) * k).round().astype(int)
    m[y0:y1, x0:x1] = 255
    return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def shift(a: np.ndarray, dx: float, dy: float) -> np.ndarray:
    h, w = a.shape[:2]
    return cv2.warpAffine(a, np.float32([[1, 0, dx], [0, 1, dy]]), (w, h), flags=cv2.INTER_LINEAR)


def main() -> None:
    src = ART / 'window-dark.webp'
    im = cv2.imread(str(src))
    h, w = im.shape[:2]
    assert (w, h) == (960, 848), f'{src.name}: 구도가 다르다 {w}x{h}'
    f = im.astype(np.float32)

    shape = np.maximum(rect_mask(h, w, VERT), rect_mask(h, w, HORZ))

    # ① 깨끗한 벽 — 빛 무리 자리는 '빛 영향 없는 둘레 벽'의 저주파 + 원본 고주파(먼지·빛 알갱이)로 메운다.
    #    밝기 흐름(창 빛줄기)은 둘레에서 이어 오고 질감은 원본 그대로라 얼룩·원판이 생기지 않는다.
    zone = np.clip(cv2.GaussianBlur(shape, (0, 0), 20) * 8.0, 0, 1)
    keep = 1 - np.clip(cv2.GaussianBlur(shape, (0, 0), 20) * 30, 0, 1)
    low = np.dstack([
        cv2.GaussianBlur(f[..., c] * keep, (0, 0), 18) / np.maximum(cv2.GaussianBlur(keep, (0, 0), 18), 1e-3)
        for c in range(3)
    ])
    hi = f - cv2.GaussianBlur(f, (0, 0), 3)
    hard = cv2.dilate((cv2.GaussianBlur(shape, (0, 0), 3) > 0.03).astype(np.uint8), np.ones((5, 5), np.uint8))
    hi = hi * (1 - cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 2))[..., None]  # 십자가 자리 질감(빛 번짐)은 버림
    wall = f * (1 - zone[..., None]) + (low + hi) * zone[..., None]

    # ② 벽에 드리운 그림자 + 접촉 그림자
    dx, dy, blur, amt = SHADOW
    cast = cv2.GaussianBlur(shift(shape, dx, dy), (0, 0), blur) * amt
    contact = cv2.GaussianBlur(shape, (0, 0), 2.2) * CONTACT
    off = wall * (1 - (np.clip(cast + contact, 0, 0.85) * (1 - shape))[..., None])

    # ③ 꺼진 아크릴 몸체 — 벽 톤을 받은 우윳빛, 위·오른쪽 모서리는 빛 받고 아래·왼쪽은 어둡게, 가는 테두리 하이라이트
    body = cv2.GaussianBlur(wall, (0, 0), 5) * BODY_MUL + np.array(BODY_TINT, np.float32)
    top = np.clip(shape - shift(shape, 0, 1.2), 0, 1)
    right = np.clip(shape - shift(shape, -1.2, 0), 0, 1)
    bot = np.clip(shape - shift(shape, 0, -1.2), 0, 1)
    left = np.clip(shape - shift(shape, 1.2, 0), 0, 1)
    body = body + ((top * 0.8 + right) * EDGE_LIGHT)[..., None] - ((bot + left * 0.7) * EDGE_LIGHT * 0.6)[..., None]
    rim = np.clip(cv2.GaussianBlur(shape, (0, 0), 0.6) - cv2.GaussianBlur(shape, (0, 0), 1.6), 0, 1) * RIM
    body = body + rim[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
    s = shape[..., None]
    off = np.clip(off * (1 - s) + body * s, 0, 255)

    # 조각 범위 — 빛 무리·그림자를 넉넉히 덮고 가장자리는 부드럽게(바깥은 원본과 같아 경계가 보이지 않는다)
    alpha = np.clip(np.maximum(zone * 1.15, cv2.GaussianBlur(shape, (0, 0), 6) * 6), 0, 1)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 2)

    # 빛 조각(번쩍임·숨쉬기) — 십자가와 둘레 빛 무리만
    near = np.clip(cv2.GaussianBlur(shape, (0, 0), 4) * 3.0, 0, 1)
    halo = np.clip(cv2.GaussianBlur(shape, (0, 0), 22) * 9.0, 0, 1)
    glow_alpha = np.clip(np.maximum(near, halo * 0.6), 0, 1)

    off_rgba = np.dstack([off, alpha * 255]).astype(np.uint8)
    glow_rgba = np.dstack([im, glow_alpha * 255]).astype(np.uint8)

    crop = (slice(SY, SY + SH), slice(SX, SX + SW))
    for suffix, rgba in (('off', off_rgba), ('glow', glow_rgba)):
        out = ART / f'window-dark-cross-{suffix}.webp'
        cv2.imwrite(str(out), rgba[crop], [cv2.IMWRITE_WEBP_QUALITY, 88])
        print(f'{out.name}  {out.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
