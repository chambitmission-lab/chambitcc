#!/usr/bin/env python3
"""구절 알람 히어로 삽화 — 모바일용 띠(band) 굽기.

왜 따로 굽는가
--------------
PC(≥1440px)에서는 hero-{light,dark}.webp 한 장을 카드에 `cover` 로 깐다. 그림 한가운데의
빈 원이 다이얼(320px) 자리라, 카드가 588px 이상일 때만 배율이 맞으면서 좌우 양도 살아남는다.

폰에서는 그 정렬이 성립하지 않는다. 카드가 ~330~430px 인데 다이얼은 260px 이라
원/다이얼 비율이 원본(폭의 43%)의 두 배 가까이(≈73%) 된다. 원에 맞춰 cover 를 걸면
배율이 600px 을 넘어 좌우 양이 통째로 잘려 나가고(가운데 빈 원만 남는다), 반대로
장면 전체를 넣으면 양이 손톱만 해진다.

그래서 모바일은 정렬을 포기하고 **장면 전체를 카드 폭에 맞춰 아래쪽에 깐다**.
다이얼은 그 위 하늘에 뜬다. 조각을 두 개로 잘라 양쪽 구석에 세워도 봤는데, 사각 색면
두 덩이가 붙은 것처럼 보여서 버렸다 — 땅선·빛무리가 이어지는 한 장이 훨씬 자연스럽다.

굽는 것 두 가지
---------------
1) 다크 전용 원 자국 지우기.
   원본의 빈 원은 "다이얼이 앉을 자리"라 아주 옅은 음영으로 그려져 있다(실측 2~5레벨).
   PC 는 그 위에 다이얼이 정확히 포개져 안 보이지만, 모바일은 원이 다이얼보다 작고
   아래로 밀려나 허공에 뜬 검은 원처럼 보인다. 라이트는 원이 페인트로 부드럽게 칠해져
   있어 상수 보정으로 지워지지 않고(여러 값으로 확인) 은은한 후광처럼 읽혀 그대로 둔다.
   다크만 반경 방향 스무스스텝으로 +(4,5,1) 을 더해 평평하게 만든다.
2) 위쪽 알파 페이드.
   띠 위쪽 하늘이 카드 배경과 만나는 가로 경계를 지운다. CSS mask 로도 되지만
   에셋에 구워 두면 브라우저 편차가 없다. 카드 색이 무엇이든 녹아들도록 투명으로 뺀다.

출력은 716px 폭 — 카드 폭 358px 의 2배(레티나). 폭에 맞춰 100% 로 깔린다(VerseAlarmPage.css).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "public" / "images" / "verse-alarm"

# 빈 원 — 1376×768 원본 기준 실측 (지름 = 폭의 43%)
DISC = dict(cx=688, cy=384, r=296)
DISC_EDGE = 0.20          # 원 가장자리 페더 폭(반지름 대비)
DISC_FIX = {"dark": (4.0, 5.0, 1.0), "light": (0.0, 0.0, 0.0)}

OUT_W = 716               # 카드 폭 358 의 2배
FADE = 0.42               # 위에서 이 비율까지 알파 0 → 1


def flatten_disc(img: np.ndarray, amp) -> np.ndarray:
    if not any(amp):
        return img
    h, w, _ = img.shape
    ys, xs = np.mgrid[0:h, 0:w]
    r = np.hypot(xs - DISC["cx"], ys - DISC["cy"]) / DISC["r"]
    t = np.clip((1.0 + DISC_EDGE / 2 - r) / DISC_EDGE, 0.0, 1.0)
    s = (t * t * (3.0 - 2.0 * t))[..., None]
    return np.clip(img + np.array(amp) * s, 0, 255)


def main() -> None:
    for theme in ("light", "dark"):
        src = Image.open(SRC / f"hero-{theme}.webp").convert("RGB")
        fixed = flatten_disc(np.asarray(src, dtype=float), DISC_FIX[theme])
        band = Image.fromarray(fixed.astype(np.uint8)).resize(
            (OUT_W, round(OUT_W * src.height / src.width)), Image.LANCZOS
        )
        rgb = np.asarray(band, dtype=np.uint8)
        h, w, _ = rgb.shape
        fade = np.clip(np.linspace(0.0, 1.0 / FADE, h), 0.0, 1.0)
        alpha = (fade[:, None] * 255).round().astype(np.uint8).repeat(w, axis=1)
        path = SRC / f"mobile-band-{theme}.webp"
        Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(path, "WEBP", quality=82, method=6)
        print(f"{path.name}: {w}x{h}  {path.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
