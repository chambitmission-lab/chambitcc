# -*- coding: utf-8 -*-
"""밝은 그림의 옅은 ✦ 지우기 — gemini-unwatermark.py 가 "못 찾았다"로 빠질 때.

    python docs/gemini-unwatermark-transfer.py 어두운.png 밝은.png 출력.png

같은 대화·같은 크기로 뽑은 다크 그림(✦ 가 또렷함)에서 모양·알파를 재서 라이트 그림에 그대로 적용한다.
제미나이 워터마크는 크기만 같으면 위치·모양·알파가 같다 (2026-11-23 비유 그림 잃은 양 1376x768 로 확인).
"""
import sys, importlib.util, numpy as np, scipy.ndimage as nd
from PIL import Image
spec = importlib.util.spec_from_file_location('wm', 'docs/gemini-unwatermark.py'); wm = importlib.util.module_from_spec(spec); spec.loader.exec_module(wm)
ref, tgt, out = sys.argv[1:4]
def measure(path):
    full = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
    H, W = full.shape[:2]; gray0 = full[:, :, :3].mean(2)
    cx, cy = W - wm.WM_OFFSET, H - wm.WM_OFFSET; R = 45
    x1, x2 = int(cx-0.5)-R+1, int(cx+0.5)+R; y1, y2 = int(cy-0.5)-R+1, int(cy+0.5)+R
    img = full[y1:y2, x1:x2, :3].copy()
    rough, _ = wm.rough_mask(gray0, x1, x2, y1, y2)
    S_, P, ac = wm.fit_shape(img, rough, cx, cy, x1, x2, y1, y2)
    cov = wm.coverage(cx, cy, S_, P, x1, x2, y1, y2)
    alpha = ac*cov
    band = nd.binary_dilation(cov > 0.02, iterations=2) & ~nd.binary_erosion(cov > 0.98, iterations=1)
    alpha = wm.solve_edge_alpha(img, alpha, band)
    return alpha, (x1, x2, y1, y2), (cx, cy)
alpha, (x1, x2, y1, y2), (cx, cy) = measure(ref)
full = np.asarray(Image.open(tgt).convert('RGBA')).astype(np.float64)
img = full[y1:y2, x1:x2, :3].copy(); al = alpha[:, :, None]
full[y1:y2, x1:x2, :3] = np.clip((img - 255.0*al)/(1.0-al), 0, 255)
Image.fromarray(full.astype(np.uint8), 'RGBA').save(out)
print('done', alpha.max())
