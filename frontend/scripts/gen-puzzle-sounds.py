"""말씀 퍼즐 효과음 스프라이트 굽기.

assets/puzzle-sounds 의 녹음 6개(snap-1~4 · pickup · complete-harp)를 MP3 한 장(sprite.mp3)으로
이어 붙이고, 조각 위치를 puzzleSprite.ts 로 쓴다. 번들엔 sprite.mp3 만 들어간다(원본은 이 스크립트의 입력).
요청 6번·디코딩 6번이 1번이 된다. 필사 타건음(gen-typing-sounds.py)과 같은 방식.

  python -I frontend/scripts/gen-puzzle-sounds.py

MP3 는 인코더 지연만큼 앞이 밀리므로, 런타임이 디코딩한 버퍼에서 첫 소리(anchor)를 다시 찾아 보정한다.
"""

import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'src' / 'assets' / 'puzzle-sounds'
OUT = SRC_DIR / 'sprite.mp3'
MANIFEST = ROOT / 'src' / 'components' / 'puzzle' / 'puzzleSprite.ts'
LEAD = 0.1  # 맨 앞 무음(anchor 자리)
GAP = 0.2  # 조각 사이 무음
ANCHOR_RATIO = 0.25  # 스프라이트 최대 진폭 대비 '첫 소리' 기준 — 런타임과 같은 값

KINDS = {
    'snap': ['snap-1.mp3', 'snap-2.mp3', 'snap-3.mp3', 'snap-4.mp3'],
    'pickup': ['pickup.mp3'],
    'complete': ['complete-harp.mp3'],
}


def load(path: Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d) / 'a.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_f32le', str(tmp)], check=True)
        _, x = wavfile.read(tmp)
    x = x.astype(np.float64)
    x -= x.mean()
    # 앞뒤의 완전한 무음은 잘라 둔다(조각 길이를 정확히 하려고)
    nz = np.flatnonzero(np.abs(x) > 1e-4)
    if len(nz):
        x = x[max(0, nz[0] - int(SR * 0.005)) : nz[-1] + int(SR * 0.02)]
    return x


def main() -> None:
    parts: list[np.ndarray] = [np.zeros(int(SR * LEAD))]
    manifest: dict[str, list[list[float]]] = {}
    t = LEAD
    for kind, files in KINDS.items():
        manifest[kind] = []
        for name in files:
            x = load(SRC_DIR / name)
            dur = len(x) / SR
            manifest[kind].append([round(t, 4), round(dur, 4)])
            parts.append(x)
            parts.append(np.zeros(int(SR * GAP)))
            t += dur + GAP
    y = np.concatenate(parts)
    y = y / max(np.abs(y).max(), 1e-9) * 0.9
    # anchor = 첫 소리 시각(LEAD 자리) — 런타임이 같은 기준으로 다시 찾는다
    first = int(np.argmax(np.abs(y) > ANCHOR_RATIO * np.abs(y).max()))
    anchor = round(first / SR, 4)
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d) / 'sprite.wav'
        wavfile.write(tmp, SR, y.astype(np.float32))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-codec:a', 'libmp3lame', '-q:a', '3', str(OUT)], check=True)
    lines = [
        '// scripts/gen-puzzle-sounds.py 가 만든다 — 손으로 고치지 말 것.',
        '// sprite.mp3 안 조각 위치 [시작초, 길이초]. anchor = 첫 소리 시각(인코더 지연 보정용)',
        '',
        f'export const PUZZLE_SPRITE_ANCHOR_RATIO = {ANCHOR_RATIO}',
        '',
        'export const PUZZLE_SPRITE = {',
        f'  anchor: {anchor},',
    ]
    for kind, segs in manifest.items():
        lines.append(f'  {kind}: {json.dumps(segs)},')
    lines += ['} as const', '']
    MANIFEST.write_text('\n'.join(lines), encoding='utf-8')
    print(f'{OUT.name}: {OUT.stat().st_size} bytes, {t:.2f}s, anchor {anchor}')


if __name__ == '__main__':
    main()
