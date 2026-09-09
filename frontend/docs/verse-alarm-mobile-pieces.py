#!/usr/bin/env python3
"""구절 알람 히어로 삽화 — 모바일용 두 조각 잘라내기.

왜 조각을 따로 굽는가
---------------------
PC(≥1440px)에서는 hero-{light,dark}.webp 한 장을 카드에 통째로 깐다. 그림 한가운데의
빈 원이 다이얼(320px) 자리라, 카드가 588px 이상일 때만 좌우 양이 살아남는다.

폰 폭에서는 그 배치가 성립하지 않는다. 카드가 ~330~430px 인데 다이얼은 260px 이라
원/다이얼 비율이 원본(43%)의 두 배 가까이(≈73%) 된다. 원에 맞춰 cover 를 걸면 배율이
600~700px 로 올라가 좌우 양이 화면 밖으로 통째로 잘리고(가운데 빈 원만 남는다),
반대로 그림 전체를 넣으면 양이 손톱만 해진다. 어느 쪽도 배경이 "있는" 그림이 아니다.

그래서 모바일은 장면을 두 조각으로 나눠 카드 양쪽 바닥에 세운다 —
왼쪽엔 자는 새끼양+자명종, 오른쪽엔 종 치는 양. 가운데는 비워 다이얼에 내준다.

가장자리 처리
-------------
CSS mask 로 흐리려면 가로·세로 두 방향 그라디언트를 합성해야 해서(mask-composite)
브라우저 편차가 생긴다. 조각 자체에 알파를 구워 두면 그런 것 없이 어디서나 같다.
  · 바깥쪽(왼 조각의 왼/아래, 오른 조각의 오른/아래)은 불투명 — 카드 모서리에 붙는다.
  · 안쪽·위쪽은 스무스스텝으로 0 까지 흐려 카드 배경으로 녹아든다.

원본은 1376×768. 아래 좌표는 그 기준 실측이다(캐릭터 bbox: 새끼양 x59~479·y510~689,
종 치는 양 x1039~1315·y232~613).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "public" / "images" / "verse-alarm"
OUT = SRC

# 조각 = (crop box, 안쪽 페이드 폭, 위쪽 페이드 폭, 안쪽이 어느 변인지)
#   fade 폭은 crop 좌표 기준. 캐릭터 bbox 바로 앞에서 알파 1 이 되도록 잡았다.
PIECES = {
    # 자는 새끼양 + 자명종 + 꿈 방울(y380~470) — 위 페이드는 방울을 살짝만 먹는다
    "lamb": dict(box=(0, 250, 560, 768), fade_in=130, fade_top=150, inner="right"),
    # 종 치는 양 + 언덕 + 뒤쪽 빛무리 — 왼쪽 페이드는 양(x1039) 앞에서 끝난다
    "sheep": dict(box=(940, 120, 1376, 768), fade_in=85, fade_top=110, inner="left"),
}


def smoothstep(t: np.ndarray) -> np.ndarray:
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def alpha_for(w: int, h: int, fade_in: int, fade_top: int, inner: str) -> np.ndarray:
    """안쪽 변과 윗변만 흐려지는 알파 맵(0~1)."""
    x = np.arange(w, dtype=float)
    ax = smoothstep((w - 1 - x) / fade_in) if inner == "right" else smoothstep(x / fade_in)
    y = np.arange(h, dtype=float)
    ay = smoothstep(y / fade_top)
    return np.outer(ay, ax)


def main() -> None:
    for theme in ("light", "dark"):
        base = Image.open(SRC / f"hero-{theme}.webp").convert("RGB")
        for name, spec in PIECES.items():
            crop = base.crop(spec["box"])
            w, h = crop.size
            alpha = alpha_for(w, h, spec["fade_in"], spec["fade_top"], spec["inner"])
            rgba = np.dstack([np.asarray(crop, dtype=np.uint8),
                              (alpha * 255).round().astype(np.uint8)])
            path = OUT / f"mobile-{name}-{theme}.webp"
            Image.fromarray(rgba, "RGBA").save(path, "WEBP", quality=80, method=6)
            print(f"{path.name}: {w}x{h}  {path.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
