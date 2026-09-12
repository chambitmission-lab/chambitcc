# -*- coding: utf-8 -*-
"""제미나이 원본 삽화의 ✦ 워터마크 제거 (2026-09-12, `1.png`/`2.png` 실측으로 만듦)

    python docs/gemini-unwatermark.py 입력.png [출력.png]
    python docs/gemini-unwatermark.py ~/Downloads/2.png          # → 2-clean.png

인페인트가 **아니다**. ✦ 는 순수 흰색(255)을 일정 알파로 올린 하드 글리프라
`I = bg(1-a) + 255a` 가 정확히 성립하고, 모양·알파만 알면 `bg = (I - 255a)/(1-a)` 로
아래 그림의 결(옷 주름·꽃·풀)이 그대로 되살아난다. 하모닉 인페인트로 지우면 별 자리가
매끈한 판이 돼 새끼양 털결이나 들꽃이 통째로 사라진다.

─── 이 스크립트가 아는 것 ──────────────────────────────────────────────
★ 위치는 **오른쪽 아래에서 고정 오프셋**이다: 중심 = (W-120.5, H-120.5).
  1759x592 → (1638.5, 471.5). 예전 캡슐 히어로 1792x592 → (1671.5, 471.5). 둘 다 오프셋 120.5.
★ 모양·알파는 **그림마다 재야 한다**. 제미나이 버전에 따라 다르다 —
  이 두 장(1759x592): astroid S=27.9 P=0.62 (반폭 24px) · 코어 알파 0.286 · 글로우 없음
  2026-09 캡슐 히어로: `(|x|/36)^0.62 = 0.83` (반폭 27px) · 코어 알파 0.432 · 바깥 13px 글로우
  ☠ 예전 값을 그대로 쓰면 과보정으로 **검은 얼룩**이 남는다. 그래서 여기서는 매번 실측한다.

─── 검증 ──────────────────────────────────────────────────────────────
결과물에 ✦ 를 다시 합성해 스크립트를 돌리는 왕복 시험: 복원 오차 평균 0.11 레벨(최대 3)로
양자화 잡음 수준. 끝에 찍는 '링 잔차 초과분'은 원본 +17 → 결과 +0.7 (0 근처면 자국 없음).

─── 하면 안 되는 것 (다 해 보고 버린 길) ───────────────────────────────
☠ 라플라시안 에너지 최소화로 알파 찾기 — 알파가 낮을수록 1/(1-a) 증폭이 줄어 에너지도 줄기
  때문에 최적점이 **항상 하한으로 흘러내린다**. 지표로 쓰면 안 된다.
☠ 넓은 구멍(반폭의 1.3배)으로 하모닉 인페인트해서 bg 추정 — 옷자락 주름을 못 맞춰 알파가
  음수로 샌다. 구멍은 글리프 + 6px 까지만.
☠ 경계에 3x3 중앙값 — 1px 실선이 **링 방향으로는 3픽셀 연속**이라 중앙값이 살려 버린다.
  알파를 제대로 맞추면 필터가 아예 필요 없다.
☠ 거리(sd) 램프만으로 경계 처리 — astroid 는 팔 끝과 평평한 변의 |∇d| 가 달라 같은 거리라도
  픽셀 안 면적이 다르다. **면적 피복률**(슈퍼샘플링)이 곧 안티앨리어싱 알파다.
"""
import os
import sys

import numpy as np
import scipy.ndimage as nd
from scipy.sparse import csr_matrix, lil_matrix
from scipy.sparse.linalg import spsolve
from PIL import Image

WM_OFFSET = 120.5      # 오른쪽/아래 가장자리로부터 ✦ 중심까지 (제미나이 고정값)
SS = 8                 # 피복률 슈퍼샘플링 격자 (8x8)


# ── 1. 글리프 대략 위치 잡기 ──────────────────────────────────────────
def rough_mask(gray, x1, x2, y1, y2, M=81):
    """✦ 가 덮는 자리를 거칠게 표시한다 (정확한 모양은 3단계에서 알파 값으로 맞춘다).

    ☠ 행마다 밝기 계단으로 좌우 끝을 찾는 방식은 쓰면 안 된다 — 별 오른쪽에 걸친 들꽃·풀이
      계단을 만들어 중심이 8px 씩 밀린다(실측: 중심 1646, 반폭 31.5 로 오검출).
    중심은 **고정 오프셋으로 이미 안다**는 점을 쓴다. 중앙값을 뺀 고역 성분을 중심 기준 네
    반사로 평균 내면 대칭인 글리프만 남고 비대칭인 그림 내용은 1/4 로 죽는다.
    ★ 중앙값 창은 글리프(48px)보다 넉넉히 커야 한다 — 창이 글리프만 해지면 중앙값이 글리프에
      끌려가 테두리에 헤일로가 남는다.
    ★ ✦ 는 아래 가장자리에서 120px 라 창 반경이 그림 밖으로 나간다 → 미리 edge 패딩.
    """
    g = np.pad(gray, M, mode="edge")
    crop = g[y1:y2+2*M, x1:x2+2*M]                     # 원본 (y1-M … y2+M) 구간
    hp = (crop - nd.median_filter(crop, size=M))[M:-M, M:-M]
    sym = (hp + hp[:, ::-1] + hp[::-1, :] + hp[::-1, ::-1])/4.0
    cy, cx = sym.shape[0]//2, sym.shape[1]//2
    plateau = float(np.median(sym[cy-4:cy+4, cx-4:cx+4]))
    if plateau < 12.0:
        raise SystemExit("✦ 를 못 찾았다 — 이미 지웠거나 워터마크가 없는 그림이다.")
    # ★ 중심에 붙은 덩어리만 남긴다 — 대칭화해도 밝은 들꽃이 문턱을 넘는 자리가 남고,
    #   그게 마스크에 섞이면 하모닉 구멍이 상자 가장자리까지 번져 터진다.
    lab, _ = nd.label(sym > 0.5*plateau)
    return lab == lab[cy, cx], plateau


# ── 2. 하모닉 채우기 ───────────────────────────────────────────────────
def harmonic(a, hole):
    """hole 자리를 주변 실측 픽셀에서 라플라스=0 으로 메운다.

    구멍은 상자 가장자리에 닿으면 안 된다(경계조건이 없어진다) — 테두리 2px 은 강제로 뺀다.
    """
    hole = hole.copy()
    hole[:2, :] = hole[-2:, :] = hole[:, :2] = hole[:, -2:] = False
    idx = -np.ones(hole.shape, int)
    idx[hole] = np.arange(hole.sum())
    ys, xs = np.nonzero(hole)
    n = hole.sum()
    out = a.copy()
    for c in range(a.shape[2]):
        A = lil_matrix((n, n))
        b = np.zeros(n)
        for k, (yi, xi) in enumerate(zip(ys, xs)):
            A[k, k] = 4.0
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = yi+dy, xi+dx
                if hole[ny, nx]:
                    A[k, idx[ny, nx]] = -1.0
                else:
                    b[k] += a[ny, nx, c]
        out[ys, xs, c] = spsolve(csr_matrix(A), b)
    return out


def coverage(cx, cy, S, P, x1, x2, y1, y2):
    """픽셀마다 astroid 가 덮는 **면적 비율** — 이게 곧 안티앨리어싱 알파의 모양이다."""
    off = (np.arange(SS) + 0.5)/SS - 0.5
    cov = np.zeros((y2-y1, x2-x1))
    for oy in off:
        for ox in off:
            cov += (((np.abs(np.arange(x1, x2)+ox-cx)/S)**P)[None, :] +
                    ((np.abs(np.arange(y1, y2)+oy-cy)/S)**P)[:, None]) <= 1.0
    return cov/(SS*SS)


# ── 3. 알파 맵 실측 + 모양 적합 ───────────────────────────────────────
def fit_shape(img, rough, cx, cy, x1, x2, y1, y2):
    """글리프 자리를 좁게 인페인트해 bg 를 만들고 알파 맵을 실측한 뒤, 거기에 astroid 를 맞춘다.

    ★ 이진 마스크에 모양을 맞추면 안 된다(넓이 XOR 최소화는 경계 1px 을 못 가른다 — 실측
      불일치 512px/1324px). 알파 **값**에 최소제곱으로 맞춰야 안티앨리어싱 띠까지 맞는다.
    ★ 구멍을 넓게 잡으면 안 된다 — 경계조건이 멀어져 옷자락 주름을 못 맞추고 알파가 음수로 샌다.
      글리프 + 6px 까지만.
    """
    hole = nd.binary_dilation(rough, iterations=6)
    bg = harmonic(img, hole)
    meas = ((img - bg)/np.clip(255.0 - bg, 12.0, None)).mean(2)
    meas = (meas + meas[:, ::-1] + meas[::-1, :] + meas[::-1, ::-1])/4.0   # 글리프는 4중 대칭
    fitreg = nd.binary_dilation(rough, iterations=8)

    best = None
    for S in np.arange(20.0, 40.01, 0.1):
        for P in np.arange(0.45, 1.00, 0.01):
            cov = coverage(cx, cy, S, P, x1, x2, y1, y2)
            c = cov[fitreg]
            ac = float((c*meas[fitreg]).sum()/max((c*c).sum(), 1e-9))      # 최적 코어 알파
            err = float((((ac*cov - meas)[fitreg])**2).mean())
            if best is None or err < best[0]:
                best = (err, S, P, ac)
    _, S, P, ac = best
    glow = float(np.median(meas[nd.binary_dilation(rough, iterations=6) & ~nd.binary_dilation(rough, iterations=3)]))
    print(f"  astroid S={S:.1f} P={P:.2f}  코어 알파 {ac:.4f}  (RMS {best[0]**0.5:.4f})")
    print(f"  글로우 점검: 경계 바깥 3~6px 알파 중앙값 {glow:+.4f}  (≈0 이어야 한다)")
    return S, P, ac


# ── 4. 경계 알파 per-pixel 역산 ────────────────────────────────────────
def solve_edge_alpha(img, alpha, band, iters=10):
    """경계 픽셀만 비워 두고 주변(바깥 실측 + 보정된 코어)에서 메우면 그 자리의 '진짜 배경'이
    나온다 → `a = (I - target)/(255 - target)`. 반복하면 수렴한다.

    ★ 매 반복 **글리프의 상하·좌우 대칭을 강제**한다. 네 반사를 평균 내면 한 픽셀의 알파를
      서로 다른 네 배경에서 추정한 값으로 섞게 돼, '경계를 매끈하게 만들려는' 하모닉 편향이
      상쇄된다. 이게 없으면 진짜 경계(예: 별을 가로지르는 어두운 타원)가 뭉개진다.
      → 그래서 박스는 중심에 **정확히** 대칭이어야 한다(짝수 폭). 0.5px 어긋나면 역효과.
    """
    ac = alpha.max()
    for it in range(iters):
        al = alpha[:, :, None]
        out = np.clip((img - 255.0*al)/(1.0-al), 0, 255)
        target = harmonic(out, band)
        den = np.clip(255.0 - target, 12.0, None)     # 흰 들꽃 위 분모 폭주 방지
        est = np.clip(((img - target)/den).mean(2), 0.0, ac)
        est = (est + est[:, ::-1] + est[::-1, :] + est[::-1, ::-1])/4.0
        new = alpha.copy()
        new[band] = 0.5*alpha[band] + 0.5*est[band]
        delta = np.abs(new[band] - alpha[band]).mean()
        alpha = new
        if delta < 1e-4:
            break
    print(f"  경계 알파 수렴 ({it+1}회, 마지막 변화 {delta:.5f})")
    return alpha


# ── 5. 검증 ────────────────────────────────────────────────────────────
def ring_excess(gray, sd, cx, cy):
    """'별 자국이 남았는가' 지표 — 경계 링의 |고역통과 잔차| 에서 바로 옆 고리의 값을 뺀다.

    0 근처면 그림 자체의 결과 구분이 안 된다는 뜻. 원본은 15 안팎이 나온다.
    """
    H, W = gray.shape
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.abs(gray - nd.gaussian_filter(gray, 6))
    box = (np.abs(xx-cx) < 42) & (np.abs(yy-cy) < 42)
    ring = (sd > -2.5) & (sd < 2.5) & box
    near = (((sd > 4) & (sd < 9)) | ((sd > -9) & (sd < -4))) & box
    return r[ring].mean() - r[near].mean()


def main():
    src = os.path.expanduser(sys.argv[1])
    dst = (os.path.expanduser(sys.argv[2]) if len(sys.argv) > 2
           else os.path.splitext(src)[0] + "-clean.png")

    full = np.asarray(Image.open(src).convert("RGBA")).astype(np.float64)
    H, W = full.shape[:2]
    gray0 = full[:, :, :3].mean(2)
    print(f"{os.path.basename(src)}  {W}x{H}")

    cx, cy = W - WM_OFFSET, H - WM_OFFSET     # ★ 제미나이 고정 오프셋

    # 중심에 정확히 대칭인 짝수 폭 박스 (네 반사 평균이 0.5px 어긋나지 않게)
    R = 45
    x1, x2 = int(cx-0.5)-R+1, int(cx+0.5)+R
    y1, y2 = int(cy-0.5)-R+1, int(cy+0.5)+R
    img = full[y1:y2, x1:x2, :3].copy()

    rough, plateau = rough_mask(gray0, x1, x2, y1, y2)
    print(f"  ✦ 중심 ({cx}, {cy})  거친 넓이 {rough.sum()}px  단차 {plateau:.0f}")
    S, P, ac = fit_shape(img, rough, cx, cy, x1, x2, y1, y2)

    cov = coverage(cx, cy, S, P, x1, x2, y1, y2)
    sd = nd.distance_transform_edt(cov > 0.5) - nd.distance_transform_edt(cov <= 0.5)
    alpha = ac*cov
    band = nd.binary_dilation(cov > 0.02, iterations=2) & ~nd.binary_erosion(cov > 0.98, iterations=1)
    alpha = solve_edge_alpha(img, alpha, band)

    al = alpha[:, :, None]
    full[y1:y2, x1:x2, :3] = np.clip((img - 255.0*al)/(1.0-al), 0, 255)
    Image.fromarray(full.astype(np.uint8), "RGBA").save(dst)

    sdf = np.zeros((H, W)) - 99
    sdf[y1:y2, x1:x2] = sd
    print(f"  링 잔차 초과분: 원본 {ring_excess(gray0, sdf, cx, cy):+.2f}"
          f"  →  결과 {ring_excess(full[:, :, :3].mean(2), sdf, cx, cy):+.2f}  (0 근처면 깨끗)")
    print(f"→ {dst}  ({os.path.getsize(dst)/1024:.0f}KB)")


if __name__ == "__main__":
    main()
