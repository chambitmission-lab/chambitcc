#!/usr/bin/env python3
"""홈 우측 '이번주 기도' 카드(다크) 본당 십자가 점등 레이어 — 2026-11-16

src/assets/prayer-week/window-dark.webp(960x848) 강단 벽의 빛나는 십자가를 '꺼진 상태'로 만든 조각 두 장:
  window-dark-cross-off.webp   꺼진 십자가 — 십자가·둘레 빛 무리를 벽으로 메우고, 불 꺼진 십자가 모양만 살짝 남김.
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


def rect_mask(h: int, w: int, r: tuple[float, float, float, float], k: int = 4) -> np.ndarray:
    m = np.zeros((h * k, w * k), np.uint8)
    x0, y0, x1, y1 = (np.array(r) * k).round().astype(int)
    m[y0:y1, x0:x1] = 255
    return cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def main() -> None:
    src = ART / 'window-dark.webp'
    im = cv2.imread(str(src))
    h, w = im.shape[:2]
    assert (w, h) == (960, 848), f'{src.name}: 구도가 다르다 {w}x{h}'
    f = im.astype(np.float32)

    shape = np.maximum(rect_mask(h, w, VERT), rect_mask(h, w, HORZ))
    # 빛 무리 — 십자가 둘레로 번진 따뜻한 빛(반경 ~40px)
    halo = np.clip(cv2.GaussianBlur(shape, (0, 0), 16) * 5.0, 0, 1)
    near = np.clip(cv2.GaussianBlur(shape, (0, 0), 4) * 3.0, 0, 1)

    # ① 십자가와 바로 옆 번짐은 벽으로 메운다(inpaint)
    hard = (cv2.dilate((near > 0.05).astype(np.uint8), np.ones((5, 5), np.uint8)) * 255).astype(np.uint8)
    off = cv2.inpaint(im, hard, 9, cv2.INPAINT_TELEA).astype(np.float32)
    off = cv2.GaussianBlur(off, (0, 0), 1.5) * (hard[..., None] / 255) + off * (1 - hard[..., None] / 255)

    # ② 빛 무리는 '따뜻한 성분'만 덜어 낸다 — 벽은 찬 청회색(B>R)이라 R-B 가 둘레보다 높은 만큼이 십자가 빛.
    #    밝기 구조(창 빛줄기)는 그대로 두므로 메운 자리가 얼룩지지 않는다(정규화 블러로 통째 메우면 어두운 원판이 됐다)
    zone = np.clip(cv2.GaussianBlur(shape, (0, 0), 22) * 9.0, 0, 1)
    warm = off[..., 2] - off[..., 0]
    lum = off.mean(axis=2)
    keep = 1 - zone
    nb = lambda v: cv2.GaussianBlur(v * keep, (0, 0), 26) / np.maximum(cv2.GaussianBlur(keep, (0, 0), 26), 1e-3)
    warm_x = np.clip(warm - nb(warm), 0, None) * zone
    lum_x = np.clip(lum - nb(lum), 0, None) * zone
    # 빛 색(BGR) 방향으로 덜어 냄 — R 를 가장 많이, B 는 조금
    # 색은 밝기와 따로 — 색 벡터에서 평균을 빼 '색만' 돌리고(R-B 차이를 warm_x 만큼 줄임), 밝기는 lum_x 만큼만 낮춘다
    off = off - warm_x[..., None] * np.array([-0.5, 0.0, 0.5], np.float32)
    off = off - (lum_x * 0.9)[..., None]

    # ② 꺼진 십자가 — 벽과 거의 같은 톤의 무광 판, 살짝 어둡고 아랫변에 옅은 그림자
    base = cv2.GaussianBlur(off, (0, 0), 6)
    body = base * 0.86
    s = shape[..., None]
    off = off * (1 - s) + body * s
    top_edge = np.clip(shape - np.roll(shape, 1, axis=0), 0, 1)[..., None]
    shadow = np.clip(np.roll(shape, 2, axis=0) - shape, 0, 1)[..., None]
    off = off + top_edge * 10 - shadow * 10
    halo = zone

    alpha = np.clip(np.maximum(zone * 1.15, hard / 255.0), 0, 1)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 2)

    off_rgba = np.dstack([np.clip(off, 0, 255), alpha * 255]).astype(np.uint8)
    glow_alpha = np.clip(np.maximum(near, halo * 0.6), 0, 1)
    glow_rgba = np.dstack([im, glow_alpha * 255]).astype(np.uint8)

    crop = (slice(SY, SY + SH), slice(SX, SX + SW))
    for suffix, rgba in (('off', off_rgba), ('glow', glow_rgba)):
        out = ART / f'window-dark-cross-{suffix}.webp'
        cv2.imwrite(str(out), rgba[crop], [cv2.IMWRITE_WEBP_QUALITY, 88])
        print(f'{out.name}  {out.stat().st_size // 1024}KB')

if __name__ == '__main__':
    main()
