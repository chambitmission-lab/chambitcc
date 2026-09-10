#!/usr/bin/env python3
"""구절 알람 히어로 삽화 — 모바일·태블릿용 띠(band) 굽기.

왜 따로 굽는가
--------------
PC(≥1440px)에서는 hero-{light,dark}.webp 한 장을 카드에 `cover` 로 깐다. 그림 한가운데의
빈 원이 다이얼(320px) 자리라, 카드가 588px 이상일 때만 배율이 맞으면서 좌우 양도 살아남는다.

그 아래 폭에서는 정렬이 성립하지 않는다. 카드가 ~330~430px 인데 다이얼은 260px 이라
원/다이얼 비율이 원본(폭의 43%)의 두 배 가까이(≈73%) 된다. 다이얼은 그림 위 하늘에 뜨고,
빈 원과 그 둘레 후광은 다이얼과 따로 노는 "둥근 얼룩"으로 남는다.

무엇을 하는가 — 하늘을 통째로 뺀다
----------------------------------
양·시계만 남기고 하늘·언덕 색면을 투명으로 만든다. 카드 배경(--surface-container)이
그대로 비치므로 **둥근 자국이 있을 자리 자체가 없어진다.**

한때는 그 원을 그림에서 "지우려" 했다 — 원 안을 다항식 색면으로 다시 칠하고(라이트),
상수로 밝히고(다크), 둘레 후광은 반지름 프로파일로 빼는 식으로. 전부 실패했다.
보정 구간이 끝나는 반지름에서 새 경계가 생겨, 지운 원 대신 **더 큰 원**이 나타났다
(2026-09, 여러 차례). 회전대칭 성분을 페이드 없이 통째로 빼 봐도 밝은 원반이 생겼다.
원이 그림에 칠해져 있는 한, 평면 비트맵에서 빼내는 방식은 링을 만든다. 되살리지 말 것.

매트 만드는 법
--------------
하늘은 매끈한 저주파다. 큰 반경 중앙값 + 다운스케일로 "하늘만" 추정한 뒤 원본과의
채널 최대 차이를 재면 사물만 도드라진다. 그 차이를 부드러운 알파로 쓰되,
그대로 쓰면 양의 몸통 안쪽처럼 넓고 평평한 곳이 하늘로 오인돼 뚫린다(확인함).
그래서 임계값으로 코어를 만들고 테두리에서 흘려 채워 내부 구멍을 메운 뒤,
부드러운 알파와 합쳐 가장자리만 페더링한다.

양 주변의 따뜻한 빛(깨우는 양의 종 빛)과 언덕 능선은 하늘과 다르므로 매트에 남는다 —
큰 원은 사라지고 장면의 온기는 남는다.

출력은 716px 폭 — 카드 폭 358px 의 2배(레티나). 폭에 맞춰 100% 로 깔린다(VerseAlarmPage.css).

에셋은 src/assets 에 있다 — 번들러가 콘텐츠 해시를 붙여 주는 자리다.
public/ 로 되돌리면 URL 이 고정되어 서비스 워커가 옛 그림을 계속 내주고,
다시 구워도 화면이 안 바뀐다(heroPrefetch.ts 주석 참고).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(__file__).resolve().parent.parent / "src" / "assets" / "verse-alarm"

# 하늘 추정 — 중앙값 반경과 다운스케일 배수. 양(가장 큰 사물)보다 훨씬 거칠어야 한다.
SKY_MEDIAN = 9
SKY_SHRINK = 16

# 알파 임계 — 하늘 추정과의 채널 최대 차이가 LO 면 완전 투명, HI 면 완전 불투명.
# 다크는 대비가 좁아 조금 낮게 잡는다.
THRESH = {"light": (10.0, 34.0), "dark": (8.0, 26.0)}

CORE_AT = 0.25   # 이 알파 이상을 "사물 코어" 씨앗으로 본다
CORE_CLOSE = 11  # 씨앗을 닫는(팽창→침식) 반경 — 이불의 어두운 무늬처럼 사물 안쪽의
                 # 하늘색 틈을 메워 둘러막는다. 이게 작으면 플러드필이 새어
                 # 이불에 구멍이 뚫린다(확인함, 다크 1100px).
CORE_GROW = 5    # 메운 코어를 이만큼 부풀려 가장자리 반투명 띠를 덮는다
FEATHER = 1.6    # 최종 알파 페더(px)

OUT_W = 716      # 카드 폭 358 의 2배


def _fill_holes(mask: np.ndarray) -> np.ndarray:
    """테두리에서 배경을 흘려 채운 뒤 남은 것 = 사물 내부 구멍 → 불투명으로 메운다."""
    h, w = mask.shape
    padded = Image.new("L", (w + 2, h + 2), 0)
    padded.paste(Image.fromarray(np.where(mask, 255, 0).astype(np.uint8), "L"), (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 128)
    outside = np.asarray(padded)[1 : h + 1, 1 : w + 1] == 128
    return ~outside


def sky_matte(img: np.ndarray, theme: str) -> np.ndarray:
    """하늘 0 · 사물 1 의 알파."""
    h, w, _ = img.shape
    sky = np.asarray(
        Image.fromarray(img.astype(np.uint8))
        .filter(ImageFilter.MedianFilter(SKY_MEDIAN))
        .resize((w // SKY_SHRINK, h // SKY_SHRINK), Image.BILINEAR)
        .resize((w, h), Image.BICUBIC),
        dtype=float,
    )
    lo, hi = THRESH[theme]
    soft = np.clip((np.abs(img - sky).max(axis=2) - lo) / (hi - lo), 0.0, 1.0)

    seed = Image.fromarray(((soft > CORE_AT) * 255).astype(np.uint8), "L")
    seed = seed.filter(ImageFilter.MaxFilter(CORE_CLOSE)).filter(ImageFilter.MinFilter(CORE_CLOSE))
    core = _fill_holes(np.asarray(seed) > 127)
    core = (
        np.asarray(
            Image.fromarray((core * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(CORE_GROW))
        ).astype(float)
        / 255.0
    )

    alpha = np.maximum(soft, core)
    return (
        np.asarray(
            Image.fromarray((alpha * 255).astype(np.uint8)).filter(
                ImageFilter.GaussianBlur(FEATHER)
            )
        ).astype(float)
        / 255.0
    )


def main() -> None:
    for theme in ("light", "dark"):
        src = Image.open(SRC / f"hero-{theme}.webp").convert("RGB")
        arr = np.asarray(src, dtype=float)
        alpha = sky_matte(arr, theme)

        out_h = round(OUT_W * src.height / src.width)
        rgb = Image.fromarray(arr.astype(np.uint8)).resize((OUT_W, out_h), Image.LANCZOS)
        a = Image.fromarray((alpha * 255).astype(np.uint8), "L").resize(
            (OUT_W, out_h), Image.LANCZOS
        )
        band = Image.merge("RGBA", (*rgb.split(), a))

        path = SRC / f"mobile-band-{theme}.webp"
        band.save(path, "WEBP", quality=88, method=6)
        opaque = (np.asarray(a) > 8).mean() * 100
        print(f"{path.name}: {OUT_W}x{out_h}  불투명 {opaque:.1f}%  {path.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
