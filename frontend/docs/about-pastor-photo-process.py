# -*- coding: utf-8 -*-
"""/about 담임목사 사진 굽기 (2026-09-17)

    python docs/about-pastor-photo-process.py ~/Downloads/1-clean.png

원본은 제미나이 인물 삽화 894x1200 — 워터마크는 docs/gemini-unwatermark.py 로 먼저 지운다.

★ 라이트/다크 한 쌍을 굽던 시절이 있었는데 버렸다. 어두운 배경 판은 카드 안에서
  "무섭게" 보인다는 확인을 받았다. 밝은 배경 한 장을 두 테마가 같이 쓴다.
★ 비율별로 **두 장**을 굽는다. PC 소개 타일(.pastor-photo-slot)은 4:5 로 크고 모바일은
  84px 정사각 아바타다. 4:5 한 장을 정사각으로 잘라 쓰면 얼굴이 타일의 1/3 밖에 안 돼
  누구인지 안 보인다 — 정사각은 얼굴 중심으로 따로 잡는다. <picture> 가 골라 간다.
★ 원본은 정수리 위 여백이 53px 뿐이라 어떻게 잘라도 머리가 아슬아슬하게 닿는다.
  그래서 **위를 먼저 늘린 다음** 자른다(PAD). 배경이 거의 균일한 밝은 판이라 맨 윗줄을
  복제해 이어 붙이면 티가 안 난다. 이 단계를 빼면 머리가 잘린다.
★ src/assets 로 간다 — public/ 은 서비스워커 stale-while-revalidate 라 다시 구워도
  화면이 안 바뀐다.
"""
import os
import sys

import numpy as np
from PIL import Image

PAD = 120                  # 위로 늘릴 여백(px) — 정수리 위 53px 만으로는 부족하다
# 늘린 뒤(894x1320) 좌표 기준 크롭 박스 → 출력 크기. 정수리는 y=173 에 있다.
VARIANTS = {
    "": ((40, 61, 854, 1079), (720, 900)),      # PC 4:5 타일(≈278x348)의 2.5배
    "-sq": ((120, 107, 780, 767), (336, 336)),  # 모바일 84px 아바타의 4배, 얼굴·어깨
}
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "about-pastor")


def pad_top(im: Image.Image) -> Image.Image:
    """맨 윗줄을 PAD 만큼 복제해 캔버스를 위로 늘린다."""
    a = np.asarray(im)
    return Image.fromarray(np.vstack([np.repeat(a[:1], PAD, axis=0), a]))


def main() -> None:
    src = os.path.expanduser(sys.argv[1])
    im = Image.open(src).convert("RGB")
    if im.size != (894, 1200):
        raise SystemExit(f"{src}: 예상과 다른 크기 {im.size} — 크롭 박스를 다시 재야 한다")
    im = pad_top(im)

    os.makedirs(OUT, exist_ok=True)
    for suffix, (crop, size) in VARIANTS.items():
        dst = os.path.join(OUT, f"pastor{suffix}.webp")
        im.crop(crop).resize(size, Image.LANCZOS).save(dst, "WEBP", quality=88, method=6)
        print(f"→ {os.path.normpath(dst)}  ({os.path.getsize(dst)/1024:.0f}KB)")


if __name__ == "__main__":
    main()
