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
1) 빈 원 자국 지우기.
   원본의 빈 원은 "다이얼이 앉을 자리"다. PC 는 그 위에 다이얼이 정확히 포개져 안 보이지만,
   모바일은 원이 다이얼보다 작고 아래로 밀려나 다이얼과 따로 노는 동그라미로 보인다
   ("동그란 게 시계 안으로 들어가야 하는데 아래에 걸쳐만 있다"는 피드백, 2026-09).
   그래서 띠에서는 원을 완전히 지우고, 다이얼 뒤 후광은 CSS 로 다시 그린다
   (한때 CSS 후광 `.va-dial-wrap::before` 을 덧그렸으나 눈금 아래로 삐져나와 제거).
   - 라이트: 원 안쪽이 주변보다 어둡고(휘도 231 vs 테두리 237) 가장자리에 흰 빛띠가
     r≈1.0~1.3 까지 번져 있어 상수 보정으로는 안 지워진다. 원 바깥 고리(r 1.32~2.0)의
     화소로 3차 다항식 색면을 로버스트 피팅(양·시계 화소는 잔차 컷으로 제외)해서
     원 안을 그 색면으로 채우고 r 1.15~1.32 에서 페더링한다.
   - 다크: 원이 아주 옅은 음영(2~5레벨)이라 반경 방향 스무스스텝으로 +(4,5,1) 을 더해
     평평하게 만든다. 다항식 피팅은 오른쪽 양의 따뜻한 빛무리에 끌려 원 자리에 밝은
     얼룩을 만들기 때문에(확인함) 다크에는 쓰지 않는다.
2) 원 둘레의 빛무리 지우기.
   원 자국을 지워도 그 둘레에 깔린 넓은 후광(반지름 2배 남짓의 부드러운 밝은 원)은
   그대로 남는다. PC 에선 다이얼이 정확히 그 위에 앉아 "시계를 비추는 빛"으로 읽히지만,
   모바일은 다이얼이 위로 떠 있어 다이얼 아래쪽을 가리는 둥근 형체로 보인다
   ("알람시계 가리고 있는 둥근 원, 안 될 거면 없애 달라", 2026-09).
   원 바깥 하늘·땅에 맞춘 2차 다항식 색면 대비 편차를 반지름별로 재서(위쪽 하늘 기준)
   그 프로파일을 전체에서 뺀다. 사물 마스크로 보정 범위를 가르면 마스크 경계에 얼룩이
   생기므로(확인함) 보정은 마스크 없이 매끈한 함수로만 건다.
3) 위쪽 알파 페이드.
   띠 위쪽 하늘이 카드 배경과 만나는 가로 경계를 지운다. CSS mask 로도 되지만
   에셋에 구워 두면 브라우저 편차가 없다. 카드 색이 무엇이든 녹아들도록 투명으로 뺀다.

출력은 716px 폭 — 카드 폭 358px 의 2배(레티나). 폭에 맞춰 100% 로 깔린다(VerseAlarmPage.css).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(__file__).resolve().parent.parent / "public" / "images" / "verse-alarm"

# 빈 원 — 1376×768 원본 기준 실측 (지름 = 폭의 43%)
DISC = dict(cx=688, cy=384, r=296)
DISC_EDGE = 0.20          # 다크 상수 보정의 가장자리 페더 폭(반지름 대비)
DISC_FIX = {"dark": (4.0, 5.0, 1.0)}

# 라이트 다항식 인페인팅 — 반지름 배수
FILL_R = 1.15             # 여기까지는 피팅한 색면으로 완전히 대체
FEATHER_R = 1.32          # 여기서 원본으로 완전히 복귀(빛띠가 끝나는 곳)
FIT_R = (1.32, 2.0)       # 색면을 피팅할 고리
FIT_DEG = 3

# 빛무리 평탄화 — 반지름 배수
GLOW_KEEP_R = 1.4         # 여기까지는 프로파일을 전부 뺀다
GLOW_FADE_R = 2.2         # 여기서 원본으로 완전히 복귀
GLOW_FIT_R = (2.0, 6.0)   # "빛무리 없는 하늘·땅" 색면을 맞출 바깥 영역
GLOW_FIT_DEG = 2

OUT_W = 716               # 카드 폭 358 의 2배
FADE = 0.42               # 위에서 이 비율까지 알파 0 → 1


def _radius(shape) -> np.ndarray:
    h, w = shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    return np.hypot(xs - DISC["cx"], ys - DISC["cy"]) / DISC["r"]


def flatten_disc(img: np.ndarray, amp) -> np.ndarray:
    """다크용 — 원 안쪽을 상수만큼 밝혀 주변과 평평하게."""
    r = _radius(img.shape)
    t = np.clip((1.0 + DISC_EDGE / 2 - r) / DISC_EDGE, 0.0, 1.0)
    s = (t * t * (3.0 - 2.0 * t))[..., None]
    return np.clip(img + np.array(amp) * s, 0, 255)


def inpaint_disc(img: np.ndarray) -> np.ndarray:
    """라이트용 — 원 바깥 고리에 맞춘 매끈한 색면으로 원 안을 다시 칠한다."""
    h, w, _ = img.shape
    r = _radius(img.shape)
    ys, xs = np.mgrid[0:h, 0:w]
    X, Y = xs / w - 0.5, ys / h - 0.5
    basis = np.stack(
        [(X**i) * (Y**j) for i in range(FIT_DEG + 1) for j in range(FIT_DEG + 1 - i)], -1
    )
    ring = (r > FIT_R[0]) & (r < FIT_R[1])
    surface = np.empty_like(img)
    for c in range(3):
        keep = ring.copy()
        for _ in range(4):  # 양·시계·거품 화소를 잔차로 걸러 내며 다시 맞춘다
            coef, *_ = np.linalg.lstsq(basis[keep], img[..., c][keep], rcond=None)
            pred = (basis.reshape(-1, basis.shape[-1]) @ coef).reshape(h, w)
            resid = np.abs(img[..., c] - pred)
            keep = ring & (resid < 2.0 * resid[ring].std())
        surface[..., c] = pred
    t = np.clip((r - FILL_R) / (FEATHER_R - FILL_R), 0.0, 1.0)
    s = (t * t * (3.0 - 2.0 * t))[..., None]
    return np.clip(img * s + surface * (1.0 - s), 0, 255)


def _foreground_mask(img: np.ndarray, theme: str) -> np.ndarray:
    """양·이불·시계 같은 사물 화소 — 색면 피팅과 프로파일 측정에서만 제외한다
    (보정 자체는 마스크 없이 전체에 건다 — 마스크 경계에서 얼룩이 생기는 걸 봤다)."""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    lum = img.mean(axis=2)
    if theme == "light":
        mask = ((r - b) > 22) | (lum < 195)
    else:
        mask = (lum > 60) | (np.abs(r - b) > 15)
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0


def flatten_glow(img: np.ndarray, theme: str) -> np.ndarray:
    """원 둘레 후광을 반지름 방향 프로파일로 걷어 낸다.

    1) 원 바깥(r 2~6, 사물 제외)에 2차 다항식 색면을 맞춘다 = 후광 없는 하늘·땅.
    2) 위쪽 반원(하늘)의 사물 아닌 화소에서 (원본 - 색면) 을 반지름별 중앙값으로 잰다
       = 후광의 대칭 성분. 채널별로 재서 색조(따뜻한 빛)까지 같이 빠진다.
    3) 그 프로파일을 매끈하게 다듬어 모든 화소에서 뺀다. 마스크가 없으니 경계 얼룩이
       없고, 양은 r 1.3~2 에 있어 몇 레벨만 고르게 어두워질 뿐이다.
    """
    h, w, _ = img.shape
    r = _radius(img.shape)
    fg = _foreground_mask(img, theme)
    ys, xs = np.mgrid[0:h, 0:w]
    X, Y = xs / w - 0.5, ys / h - 0.5
    basis = np.stack(
        [(X**i) * (Y**j) for i in range(GLOW_FIT_DEG + 1) for j in range(GLOW_FIT_DEG + 1 - i)], -1
    )
    ring = (r > GLOW_FIT_R[0]) & (r < GLOW_FIT_R[1]) & ~fg
    upper = (ys < DISC["cy"]) & ~fg
    edges = np.arange(0.0, GLOW_FADE_R + 0.15, 0.1)
    centers = (edges[:-1] + edges[1:]) / 2
    fade_t = np.clip((r - GLOW_KEEP_R) / (GLOW_FADE_R - GLOW_KEEP_R), 0.0, 1.0)
    fade = 1.0 - fade_t * fade_t * (3.0 - 2.0 * fade_t)
    out = img.copy()
    for c in range(3):
        ch = img[..., c]
        keep = ring.copy()
        for _ in range(4):
            coef, *_ = np.linalg.lstsq(basis[keep], ch[keep], rcond=None)
            pred = (basis.reshape(-1, basis.shape[-1]) @ coef).reshape(h, w)
            resid = np.abs(ch - pred)
            keep = ring & (resid < 2.0 * resid[ring].std())
        dev = ch - pred
        prof = np.array([
            np.median(dev[upper & (r >= a) & (r < b)]) if np.any(upper & (r >= a) & (r < b)) else 0.0
            for a, b in zip(edges[:-1], edges[1:])
        ])
        prof = np.convolve(np.pad(prof, 2, mode="edge"), np.ones(5) / 5, mode="valid")
        amp = np.interp(r, centers, prof, left=prof[0], right=0.0)
        out[..., c] = ch - amp * fade
    return np.clip(out, 0, 255)


def main() -> None:
    for theme in ("light", "dark"):
        src = Image.open(SRC / f"hero-{theme}.webp").convert("RGB")
        arr = np.asarray(src, dtype=float)
        fixed = inpaint_disc(arr) if theme == "light" else flatten_disc(arr, DISC_FIX[theme])
        fixed = flatten_glow(fixed, theme)
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
