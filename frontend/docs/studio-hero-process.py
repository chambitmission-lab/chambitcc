#!/usr/bin/env python3
"""설교 준비실 히어로 삽화 후처리 — ~/Downloads/1.png(다크) · 2.png(라이트) → src/assets/studio/*.webp

    PYTHONUTF8=1 python docs/studio-hero-process.py

- 다크(1.png): ✦ 워터마크를 docs/gemini-unwatermark.py 로 알파 역산해 지운다(인페인트 아님 — 러그 술 무늬가 되살아난다).
  실측(2026-10-20): 중심 (1255.5, 647.5) · astroid S=28.5 P=0.61 · 코어 알파 0.307 · 링 잔차 +12.3 → +1.4.
- 라이트(2.png): 밝은 바닥 위라 ✦ 가 거의 보이지 않아 그대로 쓴다(사용자 결정).
- 프롬프트·구도는 docs/studio-hero-bg-prompts.md. 장면은 오른쪽 40%, 왼쪽 55% 는 글자 자리.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = Path.home() / "Downloads"
OUT = HERE.parent / "src" / "assets" / "studio"
QUALITY = 80


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        clean = Path(tmp) / "dark-clean.png"
        subprocess.run([sys.executable, str(HERE / "gemini-unwatermark.py"), str(SRC / "1.png"), str(clean)], check=True)
        for theme, path in (("dark", clean), ("light", SRC / "2.png")):
            out = OUT / f"hero-{theme}.webp"
            Image.open(path).convert("RGB").save(out, "WEBP", quality=QUALITY, method=6)
            print(f"{path.name} → {out.relative_to(HERE.parent)}  {out.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
