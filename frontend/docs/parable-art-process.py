# -*- coding: utf-8 -*-
"""비유 그림 적용 — 제미나이 원본 두 장에서 ✦ 만 지우고(자르지 않음) WebP 4장으로 굽는다.

    python3 docs/parable-art-process.py lost-coin ~/Downloads/3.png ~/Downloads/4.png
                                        (id)      (라이트)            (다크)

- 다크: gemini-unwatermark.py 로 직접.
- 라이트: 먼저 직접 시도 → 밝아서 ✦ 를 못 찾으면 같은 크기 다크에서 잰 알파를 옮긴다(gemini-unwatermark-transfer.py).
  크기가 다르면(제미나이 편집본 등) 워터마크가 없는 경우가 많아 그대로 쓴다.
- 결과: src/assets/parables/{id}-{light|dark}.webp (긴 변 1200) + -sm.webp (720). 원본 비율 그대로.
"""
import os, subprocess, sys, tempfile
from PIL import Image

pid, light, dark = sys.argv[1], os.path.expanduser(sys.argv[2]), os.path.expanduser(sys.argv[3])
here = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.join(here, '..', 'src', 'assets', 'parables')
tmp = tempfile.mkdtemp()


def run(*args):
    return subprocess.run([sys.executable, *args], capture_output=True, text=True)


def residual(out):
    # gemini-unwatermark.py 출력의 '링 잔차 … → 결과 X' — 0 근처면 깨끗, 원본보다 커지면 테두리 자국(과잉 제거)
    import re
    m = re.search(r'원본 ([+-][\d.]+)\s+→\s+결과 ([+-][\d.]+)', out)
    return (float(m.group(1)), float(m.group(2))) if m else None


def clean(src, name, ref=None):
    dst = os.path.join(tmp, f'{name}.png')
    r = run(os.path.join(here, 'gemini-unwatermark.py'), src, dst)
    same = ref and Image.open(ref).size == Image.open(src).size
    # ★오탐 막기 — 로고 없는 편집본(1672×941 등)에서도 거친 모양이 잡히면 '제거'로 돈다(2026-11-24 충성된 종).
    #   진짜 ✦ 는 코어 알파가 0.2~0.35, 오탐은 0 근처·음수 → 0.08 미만이면 원본 그대로.
    import re
    m = re.search(r'코어 알파 ([+-]?[\d.]+)', r.stdout)
    if r.returncode == 0 and m and float(m.group(1)) < 0.08:
        print(f'  {name}: ✦ 없음 (코어 알파 {float(m.group(1)):+.3f}, 오탐) — 그대로 사용')
        return src
    if r.returncode == 0:
        res = residual(r.stdout)
        # ★지운 뒤 잔차가 원본보다 오히려 커지면 ✦ 가 아니라 그림의 밝은 선을 잘못 잡은 것
        #   (2026-11-24 바리새인과 세리 — 돌 이음선이 어둡게 패였다). 옮길 다크 알파도 없으면 원본 그대로.
        if res and res[1] > res[0] + 1.0 and not same:
            print(f'  {name}: ✦ 없음 (잔차 {res[0]:+.1f}→{res[1]:+.1f} 악화, 오탐) — 그대로 사용')
            return src
        # ★옅은 라이트 ✦ 는 직접 제거가 모양을 잘못 잡아 갈색 테두리 자국을 남기기도 한다(2026-11-24 무화과나무)
        #   → 잔차가 2.5 를 넘으면 다크에서 잰 알파로 다시
        if not (res and abs(res[1]) > 2.5 and same):
            print(f'  {name}: ✦ 제거 (직접)')
            return dst
        print(f'  {name}: 직접 제거 잔차 {res[1]:+.1f} — 다크 알파로 재시도')
    if same:
        r = run(os.path.join(here, 'gemini-unwatermark-transfer.py'), ref, src, dst)
        if r.returncode == 0:
            print(f'  {name}: ✦ 제거 (다크에서 알파 옮김)')
            return dst
    print(f'  {name}: ✦ 없음 — 그대로 사용')
    return src


d = clean(dark, 'dark')
# 다크에 진짜 ✦ 가 있을 때만 그 알파를 라이트로 옮긴다 (없는 다크에서 잰 '알파'는 허상)
l = clean(light, 'light', ref=dark if d != dark else None)
for theme, path in (('light', l), ('dark', d)):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    for suffix, width, q in (('', 1200, 74), ('-sm', 720, 72)):
        png = os.path.join(tmp, f'{theme}{suffix}.png')
        im.resize((width, round(h * width / w)), Image.LANCZOS).save(png)
        out = os.path.join(out_dir, f'{pid}-{theme}{suffix}.webp')
        subprocess.run(['cwebp', '-quiet', '-q', str(q), '-m', '6', png, '-o', out], check=True)
        # 결이 세밀한 그림(편집본 1672×941 등)은 100KB 를 넘는다 — 화질을 낮춰 한 번 더
        if os.path.getsize(out) > (80 if suffix == '' else 36) * 1024:
            subprocess.run(['cwebp', '-quiet', '-q', '64', '-m', '6', png, '-o', out], check=True)
        print(f'  → {os.path.relpath(out)}  {os.path.getsize(out) // 1024}KB')
