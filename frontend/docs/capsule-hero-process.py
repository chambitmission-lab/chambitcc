# -*- coding: utf-8 -*-
"""타임캡슐 히어로 삽화 후처리 (docs/capsule-hero-bg-prompts.md 참고)

Gemini 원본 2장(1.png 라이트 / 2.png 다크, 1792x592)을 받아
  1) 워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산' (plan-hero-process.py 의 2판 로직 재사용)
  2) 위쪽 알파 페이드를 굽는다 — 삽화는 카드 **아래쪽 띠**로 앉고 위는 카드 그라데이션이다
  3) 1200 폭 RGBA webp 로 저장
까지 한 번에 한다.

    python docs/capsule-hero-process.py [원본폴더]

★ 플랜·묵상방 히어로와 배치 방식이 다르다.
  저쪽은 `cover` 라 카드 높이가 배율을 정하고, 주인공이 오른쪽 25% 안에 들어가야만 성립한다.
  이 그림은 주인공 덩어리가 **폭의 44%**(양 x56% ~ 우체통 x96%)라 `cover` 로 깔면
  모바일에서 양이 안내 문구 위로 올라온다(실측: 양 왼쪽 끝이 카드 x 99px, 글씨는 202px 까지).
  그래서 `background-size: 100% auto` + `bottom` — **삽화 폭 = 카드 폭**으로 고정한다.
  이러면 양의 왼쪽 끝이 어느 폭에서나 `0.566 × 카드폭`(모바일 203px · PC 308px)에 떨어져
  글씨와 절대 겹치지 않고, 글씨는 항상 평평한 카드 그라데이션 위에 앉는다.
"""
import os
import sys

import numpy as np
import scipy.ndimage as nd
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "images", "capsule")

WIDTH = 1200          # 최종 폭 (PC 카드 544px 의 2.2배)
FADE_SKY = 0.42       # 하늘 알파: y=0 투명 → 0.42H 에서 불투명
FADE_OBJ = 0.14       # 물체 알파: 훨씬 빨리 불투명해진다.
                      #   ★ 물체도 페이드에 태우는 게 핵심이다. 원본 윗변에 편지 한 통이
                      #   잘린 채 걸려 있어서(양쪽 다 x1444~1520, row 0~90) salience 로
                      #   통째로 지켜 주면 **카드 위에 직각으로 잘린 봉투**가 뜬다.
                      #   0.14H 램프면 그 편지만 스르르 사라지고 나머지는 그대로 남는다.
SKY_WIN = (0.03, 0.30)  # 하늘 모델을 맞출 깨끗한 열. ★다크는 x33% 부터 언덕이라 58% 는 못 쓴다.

WM_C = (1671.5, 471.5)   # ✦ 중심 (1792x592 기준). 제미나이는 우하단에서 고정 오프셋으로 찍는다
WM_D = 0.83              # 하드 글리프 경계 — astroid `(|x|/36)^0.62 + (|y|/36)^0.62 = 0.83`
# 알파는 **경계로부터의 부호 있는 거리(px)** 의 함수다. 안쪽은 0.432 로 평평하고,
# 바깥으로 13px 에 걸쳐 옅은 글로우가 깔린다 — 이 글로우를 안 빼면 별 자국이 남는다.
#   측정법: 별 자리를 하모닉 인페인트로 복원해 `(I-bg)/(255-bg)` 를 sd 1px 빈으로 중앙값.
#   ★ 반지름(d) 기준으로 재면 안 된다 — astroid 는 팔과 끝점의 |∇d| 가 달라 같은 d 라도
#     물리적 폭이 다르다. d 기준으로 맞췄더니 경계 안쪽에 **검은 링**(잔차 -34)이 남았다.
#   ★ 경계 1px(sd=-1)만 0.31 로 낮춰 잡는다(측정값 0.381). 서브픽셀 위치가 곳마다 달라
#     측정 중앙값을 그대로 쓰면 다크에서 잔차 -10 의 어두운 테두리가 생긴다.
WM_SD = (-14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 40)
WM_AL = (0.000, 0.014, 0.030, 0.040, 0.060, 0.082, 0.090, 0.092, 0.110,
         0.140, 0.152, 0.170, 0.190, 0.310, 0.400, 0.432, 0.432)


def unwatermark(a):
    """✦ 를 지운다 — 인페인트가 아니라 '알파 역산'.

    ✦ 는 순수 흰색(255)을 일정한 알파로 올린 하드 글리프라 `I = bg(1-a) + 255a` 가 정확히 성립한다.
    모양과 알파만 알면 `bg = (I - 255a)/(1-a)` 로 **아래 그림의 결이 그대로 살아난다**.
    (하모닉 인페인트로 지우면 별 자리가 매끈한 판이 돼 새끼양 배의 털 결이 사라진다.)

    라이트에도 **같은 자리에 같은 알파로** 찍혀 있다 — 배경이 밝아 눈에 잘 안 띌 뿐이라 둘 다 지운다."""
    H, W, _ = a.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = (np.abs(xx-WM_C[0])/36)**0.62 + (np.abs(yy-WM_C[1])/36)**0.62
    core = d <= WM_D
    sd = nd.distance_transform_edt(core) - nd.distance_transform_edt(~core)   # 안쪽이 +
    al = np.interp(sd, WM_SD, WM_AL)[:, :, None]
    out = np.clip((a - 255.0*al)/(1.0-al), 0, 255)

    # 경계 2~3px 에 남는 **1px 하이라이트 실선**을 3x3 중앙값으로 지운다. 중앙값은 계단(진짜 엣지)은
    # 보존하고 1px 선만 골라 없앤다 — 새끼양 실루엣·다리·언덕 경계는 그대로다.
    ring = (sd > -3.5) & (sd < 2.5)
    med = np.dstack([nd.median_filter(out[:, :, c], size=3) for c in range(3)])
    return np.where(ring[:, :, None], med, out)


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t*t*(3-2*t)


def sky_model(a):
    """행마다 x 에 대한 1차식으로 맞춘 '빈 하늘' 색 (깨끗한 왼쪽 열만 보고 오른쪽으로 외삽)."""
    H, W, _ = a.shape
    lo, hi = int(W*SKY_WIN[0]), int(W*SKY_WIN[1])
    xs = np.arange(lo, hi, dtype=np.float32)
    A = np.stack([np.ones_like(xs), xs], axis=1)
    coef = np.linalg.lstsq(A, a[:, lo:hi, :].transpose(1, 0, 2).reshape(len(xs), -1), rcond=None)[0]
    x = np.arange(W, dtype=np.float32)
    return (coef[0][None, :] + np.outer(x, coef[1])).reshape(W, H, 3).transpose(1, 0, 2)


def bake_alpha(a):
    """위쪽 알파 페이드. 하늘은 길게, 그려진 것은 짧게 — 둘 중 큰 값을 쓴다."""
    H, W, _ = a.shape
    y = np.arange(H, dtype=np.float32)
    ay_sky = smoothstep(y/(FADE_SKY*H))[:, None]
    ay_obj = smoothstep(y/(FADE_OBJ*H))[:, None]

    dist = np.abs(a - sky_model(a)).mean(2)
    salience = nd.gaussian_filter(smoothstep((dist-5.0)/12.0), 1.2)

    al = np.maximum(ay_sky, salience*ay_obj)
    band = int(FADE_SKY*H)
    print(f"   페이드 띠 salience 평균={salience[:band].mean():.3f}  알파 평균={al[:band].mean():.3f}")
    return np.clip(al, 0, 1)


def card_gradient(a):
    """카드 그라데이션 색 — 삽화 윗변의 하늘을 그대로 읽는다.

    삽화 폭 = 카드 폭이라 x 매핑이 어느 화면에서나 같다. 그래서 **가로에 가까운**
    그라데이션(100deg)이면 이음매가 어디서도 안 보인다."""
    sky = sky_model(a)[:24].mean(0)
    hexes = []
    for f in (0.0, 0.5, 1.0):
        c = sky[min(int(f*(sky.shape[0]-1)), sky.shape[0]-1)]
        hexes.append("#%02x%02x%02x" % tuple(int(round(v)) for v in np.clip(c, 0, 255)))
    return hexes


def check(rgba, grad_rgb, card_w, card_h):
    """글자 사각형 밝기 — 삽화를 카드 그라데이션 위에 얹은 뒤 실제로 보이는 값을 잰다."""
    H, W = rgba.shape[:2]
    band = card_w*H/W
    y0 = card_h - band
    yy, xx = np.mgrid[0:card_h, 0:card_w].astype(float)
    ax = np.clip((xx/card_w*W).astype(int), 0, W-1)
    ay = np.clip(((yy-y0)/band*H).astype(int), 0, H-1)
    rgb = rgba[..., :3].mean(2)[ay, ax]
    al = np.where(yy < y0, 0.0, rgba[..., 3][ay, ax]/255.0)
    base = np.interp(xx/card_w, [0, 0.55, 1], [g.mean() for g in grad_rgb])
    return rgb*al + base*(1-al)


# 글자 사각형 — 제목 1줄 + 안내 2줄로 어느 폭에서나 같다(카드 높이 214px).
#   ★ 삽화 띠 높이는 카드 폭으로만 정해진다(카드 높이와 무관) — 카드가 낮으니 글씨가 삽화 위로
#     가장 많이 올라온 상태다. 안내문 끝자락(x 313)은 모바일에서 편지 줄과 겹친다(아래 수치).
#     문구를 더 늘리면 양 머리에 올라탄다 — 늘릴 거면 이 검사를 반드시 다시 돌릴 것.
CASES = (
    ('모바일', 382, 214, {'라벨': (24, 28, 194, 46), '제목': (24, 52, 334, 80),
                         '안내문': (24, 88, 313, 128)}),
    ('PC   ', 544, 214, {'라벨': (24, 28, 194, 46), '제목': (24, 52, 334, 80),
                         '안내문': (24, 88, 313, 128)}),
)


def main():
    os.makedirs(OUT, exist_ok=True)
    imgs = {}
    for src, name in (("1.png", "light"), ("2.png", "dark")):
        imgs[name] = np.asarray(Image.open(os.path.join(SRC, src)).convert("RGB")).astype(np.float32)

    for name in ("light", "dark"):
        a = unwatermark(imgs[name])
        grad = card_gradient(a)
        al = bake_alpha(a)
        rgba = np.dstack([np.clip(a, 0, 255), al*255]).astype(np.uint8)

        H, W = rgba.shape[:2]
        im = Image.fromarray(rgba, "RGBA").resize((WIDTH, int(round(H*WIDTH/W))), Image.LANCZOS)
        p = os.path.join(OUT, f"hero-{name}.webp")
        im.save(p, "WEBP", quality=82, method=6, alpha_quality=92)
        print(f"hero-{name}.webp  {im.size}  {os.path.getsize(p)/1024:.1f}KB   카드 그라데이션 {grad}")

        arr = np.asarray(Image.open(p).convert("RGBA")).astype(float)
        grad_rgb = [np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float) for h in grad]
        for tag, cw, ch, rects in CASES:
            v = check(arr, grad_rgb, cw, ch)
            cells = [f'{k} 평균{v[y0:y1, x0:x1].mean():4.0f} p5{np.percentile(v[y0:y1, x0:x1], 5):4.0f}'
                     f' p95{np.percentile(v[y0:y1, x0:x1], 95):4.0f}'
                     for k, (x0, y0, x1, y1) in rects.items()]
            print(f'   {tag} | ' + ' | '.join(cells))


if __name__ == "__main__":
    main()
