#!/usr/bin/env python3
"""구절 알람 히어로 삽화 후처리 — ~/Downloads/1.png(라이트) 2.png(다크) → public/images/verse-alarm/

하는 일:
  1) 제미나이 워터마크 ✦ 제거 — 알파 역산이 아니라 '라플라스 채우기'.
     ★ 여기선 알파 역산(capsule-banner-process.py 방식)이 안 통한다. ✦ 가 앉은 바닥이
       평평해 보여도 바로 위에 큰 양의 그림자 경계가 걸쳐 있어서, 배경을 다항식으로
       맞추면 별 자리를 1~2 어긋나게 잡고 → 지운 자리에 별 모양 윤곽이 그대로 남는다
       (실측: 가장자리 밴드가 둘레보다 8 어두웠다).
     별이 앉은 자리는 디테일이 전혀 없는 빈 바닥이라, 마스크를 통째로 이웃값 평균으로
     확산시켜(디리클레 경계 라플라스) 메우는 쪽이 훨씬 깨끗하다. 그림자 경계도
     좌우 경계값을 타고 자연스럽게 이어진다.
     마스크 위쪽은 y>=622 로 자른다 — 그 위는 양의 뒷발굽이라 건드리면 안 된다.
     TELEA 인페인트는 발굽을 빨아들이므로 금지.
  2) webp 저장. 알파는 쓰지 않는다 — 카드 전체를 덮는 배경이라 투명 구간이 없다.

원본은 1376×768(16:9). 그대로 저장한다 — 카드는 최대 876×392 라 2배 해상도가 나온다.
"""
import numpy as np
from PIL import Image
from pathlib import Path


SRC = {"light": Path.home() / "Downloads" / "1.png", "dark": Path.home() / "Downloads" / "2.png"}
OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "verse-alarm"

# 워터마크 ✦ — 1376×768 원본 기준 실측 (우/하단 모서리에서 각각 120.5px)
WM_C = (1255.5, 647.5)     # 중심
WM_R = (24.0, 24.0)        # 다이아몬드 반폭·반높이 (x 1232~1279, y 624~671)
WM_PAD = 1.45              # 마스크는 별 외곽선보다 조금 넉넉하게 (안티에일리어싱 여유)
WM_TOP = 622               # 이 위는 손대지 않는다 (양 뒷발굽)
ITERS = 900                # 라플라스 반복 — 마스크가 50px 남짓이라 이 정도면 수렴한다


def watermark_mask(shape):
    ys, xs = np.mgrid[0:shape[0], 0:shape[1]]
    dia = np.abs(xs - WM_C[0]) / WM_R[0] + np.abs(ys - WM_C[1]) / WM_R[1]
    return (dia <= WM_PAD) & (ys >= WM_TOP)


def inpaint(img, mask):
    """마스크 안을 이웃값 평균으로 확산시켜 메운다(디리클레 경계 라플라스 방정식).
    작업은 마스크 둘레 패치에서만 한다 — 전체 이미지를 900번 돌릴 이유가 없다."""
    ys, xs = np.nonzero(mask)
    y0, y1 = ys.min() - 2, ys.max() + 3
    x0, x1 = xs.min() - 2, xs.max() + 3
    patch = img[y0:y1, x0:x1].copy()
    m = mask[y0:y1, x0:x1]

    # 초기값: 마스크 둘레 평균으로 채워 두면 반복 횟수가 확 줄어든다
    patch[m] = patch[~m].mean(axis=0)
    for _ in range(ITERS):
        nb = np.zeros_like(patch)
        nb[1:-1, 1:-1] = (patch[:-2, 1:-1] + patch[2:, 1:-1]
                          + patch[1:-1, :-2] + patch[1:-1, 2:]) / 4.0
        patch[m] = nb[m]

    out = img.copy()
    out[y0:y1, x0:x1] = patch
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    dark = np.asarray(Image.open(SRC["dark"]).convert("RGB"), dtype=float)
    light = np.asarray(Image.open(SRC["light"]).convert("RGB"), dtype=float)

    mask = watermark_mask(dark.shape[:2])
    print(f"watermark mask: {int(mask.sum())}px")

    for name, img in (("light", light), ("dark", dark)):
        out = inpaint(img, mask)
        path = OUT / f"hero-{name}.webp"
        Image.fromarray(out.astype(np.uint8)).save(path, "WEBP", quality=82, method=6)
        print(f"{path.name}: {out.shape[1]}x{out.shape[0]}  {path.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
