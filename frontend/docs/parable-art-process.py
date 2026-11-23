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


def clean(src, name, ref=None):
    dst = os.path.join(tmp, f'{name}.png')
    r = run(os.path.join(here, 'gemini-unwatermark.py'), src, dst)
    if r.returncode == 0:
        print(f'  {name}: ✦ 제거 (직접)')
        return dst
    if ref and Image.open(ref).size == Image.open(src).size:
        r = run(os.path.join(here, 'gemini-unwatermark-transfer.py'), ref, src, dst)
        if r.returncode == 0:
            print(f'  {name}: ✦ 제거 (다크에서 알파 옮김)')
            return dst
    print(f'  {name}: ✦ 없음 — 그대로 사용')
    return src


d = clean(dark, 'dark')
l = clean(light, 'light', ref=dark)
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
