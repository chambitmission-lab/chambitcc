# -*- coding: utf-8 -*-
"""좌석 예약 삽화 후처리 (docs/seats-hero-bg-prompts.md)

plan-hero-process.py 는 위쪽 하늘 띠를 먼저 잘라낸 뒤 고정 좌표(1671.5, 471.5)에서 워터마크를 찾는다.
이번 원본들은 위에 ~50px 띠가 있어 그 순서면 좌표가 어긋난다 → **원본 좌표에서 워터마크를 먼저 지우고**,
위 52줄을 직접 잘라낸 뒤(다크는 띠 대비가 작아 자동으로 안 잘려 별이 세로 줄무늬로 번졌다)
plan-hero-process 의 띠 정리(load)를 그대로 쓴다. FADE 는 쓰지 않는다(의자 줄이 반투명해진다).

    python docs/seats-hero-process.py hero     # ~/Downloads/1.png 2.png → public/images/seats/hero-{light,dark}.webp (2.2:1 로 위 확장)
    python docs/seats-hero-process.py detail   # ~/Downloads/3.png 4.png → public/images/seats/detail-{light,dark}.webp (확장 없음, 표지 띠용)
"""
import sys, os, importlib.util, tempfile
import numpy as np
from PIL import Image

FE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RAW = os.path.expanduser('~/Downloads')
CLEAN = tempfile.mkdtemp(prefix='seats-hero-')
TOP_CUT = 52

JOBS = {
    # 목록 히어로 — 카드 214px 고정, cover 높이맞춤이라 2.2:1 로 위를 늘린다
    'hero': {'files': ('1.png', '2.png'), 'prefix': 'hero', 'extend': True, 'saved_alpha': True},
    # 상세 정보 카드 위 표지 띠 — 띠 높이가 폭보다 훨씬 작아 늘리지 않는다
    # ★4.png 는 ✦ 가 밝은 양 다리 위에 떨어져 알파 추정에 다리 테두리가 섞인다(다리에 별 모양 구멍).
    #   ✦ 모양·자리는 세대마다 같으므로 평평한 배경에서 깨끗이 뜬 알파(docs/gemini-wm-alpha.npz)를 쓴다.
    'detail': {'files': ('3.png', '4.png'), 'prefix': 'detail', 'extend': False, 'saved_alpha': True},
}
job = JOBS[sys.argv[1] if len(sys.argv) > 1 else 'hero']

sys.argv = ['x', CLEAN, 'seats']
spec = importlib.util.spec_from_file_location('php', f'{FE}/docs/plan-hero-process.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

raw = lambda n: np.asarray(Image.open(os.path.join(RAW, n)).convert('RGB')).astype(np.float32)
light_name, dark_name = job['files']
if job.get('saved_alpha'):
    # 1792x592 · 중심 (1671.5, 471.5) · 피크 0.294 · 면적 984 — 시안 B 다크 원본(평평한 배경)에서 떴다
    saved = np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gemini-wm-alpha.npz'))
    A, box = saved['A'], tuple(int(v) for v in saved['box'])
else:
    A, box = m.watermark_alpha(raw(dark_name))  # 다크에서 알파를 떠서 두 장에 같이 먹인다
print(f'watermark alpha peak {A.max():.3f} area {(A>0).sum()}')
for n in job['files']:
    a = m.despeckle(m.unwatermark(raw(n), A, box), A, box)
    a = a[TOP_CUT:]
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(CLEAN, n))

os.makedirs(m.OUT, exist_ok=True)
for n, theme in ((light_name, 'light'), (dark_name, 'dark')):
    a = m.load(n)
    if job['extend']:
        a = m.extend_top(a, m.RATIO)
    H, W, _ = a.shape
    rgba = np.dstack([np.clip(a, 0, 255), np.full((H, W), 255.0)]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA').resize((m.WIDTH, int(round(H*m.WIDTH/W))), Image.LANCZOS)
    p = os.path.join(m.OUT, f"{job['prefix']}-{theme}.webp")
    im.save(p, 'WEBP', quality=80, method=6, alpha_quality=92)
    print(os.path.basename(p), im.size, f'{os.path.getsize(p)/1024:.1f}KB')
