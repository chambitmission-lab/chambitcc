# -*- coding: utf-8 -*-
"""읽기 플랜 히어로 삽화 밝기 검수 (docs/plan-hero-bg-prompts.md "밝기 합격선" 참고)

에셋 자체를 재면 안 된다 — `cover` + `right bottom` 매핑을 그대로 흉내 내
**카드 위 글자 사각형 3개**만 봐야 실제 값이 나온다.

합격선: 라이트(남색 글씨) 평균 ≥205 · 하위5% ≥170 / 다크(흰 글씨) 평균 ≤60 · 상위5% ≤110

    python docs/plan-hero-check.py        # frontend/ 에서 실행
"""
import numpy as np
from PIL import Image

RECTS = {'라벨': (24, 32, 204, 46), '제목': (24, 58, 224, 124), '안내문': (24, 140, 264, 186)}

def sample(name, card_w, card_h=216):
    a = np.asarray(Image.open(f'public/images/plans/hero-{name}.webp').convert('RGBA')).astype(float)
    H, W = a.shape[:2]
    s = max(card_w/W, card_h/H)                            # cover
    ox, oy = W*s-card_w, H*s-card_h                        # right bottom
    yy, xx = np.mgrid[0:card_h, 0:card_w].astype(float)
    ax = np.clip(((xx+ox)/s).astype(int), 0, W-1)
    ay = np.clip(((yy+oy)/s).astype(int), 0, H-1)
    rgb = a[..., :3].mean(2)[ay, ax]; al = a[..., 3][ay, ax]/255
    return rgb*al + (226 if name == 'light' else 16)*(1-al)  # 카드 그라데이션 대표 밝기

for name in ('light', 'dark'):
    for cw, tag in ((358, '모바일'), (632, 'PC   ')):
        v = sample(name, cw)
        cells = []
        for k, (x0, y0, x1, y1) in RECTS.items():
            r = v[y0:y1, x0:x1]
            cells.append(f'{k} 평균{r.mean():4.0f} p5{np.percentile(r,5):4.0f} p95{np.percentile(r,95):4.0f}')
        print(f'{name:5s} {tag} | ' + ' | '.join(cells))
