"""필사 화면 배경 소리(빗소리 등) 굽기 — 이음매 없이 반복되는 MP3 + typingAmbients.ts.

  python -I frontend/scripts/gen-typing-ambient.py <원본 폴더>

끝 몇 초를 처음에 등전력으로 겹쳐 반복 구간을 만든다. MP3 는 디코더마다 앞 지연이 달라
파일 맨 앞에 2ms 표지음(marker)을 두고 그 뒤에 반복 구간을 싣는다 — 런타임은 표지음으로 지연을 재고
loopStart 부터 틀기 때문에 표지음은 들리지 않는다.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'src' / 'assets' / 'typing-sounds'
MANIFEST = ROOT / 'src' / 'pages' / 'Bible' / 'Typing' / 'typingAmbients.ts'
MARKER_AT, LOOP_AT = 0.05, 0.25

# 배경: 원본, 겹칠 길이(초), 목표 RMS
AMBIENTS = {
    'rain': dict(file='rain_on_window.wav', crossfade=3.0, rms=0.07),
}


def load_stereo(path: Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d) / 'a.wav'
        # 60Hz 아래 웅웅거림은 덜어 낸다(휴대폰 스피커에선 안 들리고 음량만 잡아먹음)
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-af', 'highpass=f=60', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', str(tmp)]
        subprocess.run(cmd, check=True)
        _, x = wavfile.read(tmp)
    x = x.astype(np.float64)
    return x - x.mean(axis=0)


def make_loop(x: np.ndarray, crossfade: float, rms: float) -> np.ndarray:
    """끝 crossfade 초를 처음에 겹쳐, 마지막 샘플 다음에 첫 샘플이 자연스럽게 오도록"""
    c = int(crossfade * SR)
    body = x[: len(x) - c].copy()
    t = np.linspace(0, np.pi / 2, c)[:, None]
    body[:c] = body[:c] * np.sin(t) + x[len(x) - c :] * np.cos(t)
    return body * (rms / np.sqrt((body**2).mean()))


def main() -> None:
    src_dir = Path(sys.argv[1])
    manifest = {}
    for name, cfg in AMBIENTS.items():
        loop = make_loop(load_stereo(src_dir / cfg['file']), cfg['crossfade'], cfg['rms'])
        head = np.zeros((int(LOOP_AT * SR), 2))
        head[int(MARKER_AT * SR) : int(MARKER_AT * SR) + int(0.002 * SR)] = 0.95
        # 반복 구간 뒤에 처음 1초를 한 번 더 — 디코더 끝 패딩이 반복 구간을 깎지 않게
        audio = np.concatenate([head, loop, loop[:SR]])
        out = OUT_DIR / f'ambient-{name}.mp3'
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d) / 'a.wav'
            wavfile.write(tmp, SR, (np.clip(audio, -1, 1) * 32767).astype(np.int16))
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-c:a', 'libmp3lame', '-b:a', '112k', str(out)], check=True)
        manifest[name] = dict(marker=MARKER_AT, loopStart=LOOP_AT, loopLength=round(len(loop) / SR, 5))
        print(f'ambient-{name}: loop {len(loop) / SR:.1f}s - {out.stat().st_size // 1024}KB')

    lines = ['  ' + k + ': { ' + ', '.join(f'{f}: {n}' for f, n in v.items()) + ' },' for k, v in manifest.items()]
    MANIFEST.write_text(
        '// scripts/gen-typing-ambient.py 가 만든다 — 손으로 고치지 말 것.\n'
        '// marker = 표지음 시각(디코더 지연 보정), loopStart·loopLength = 반복 구간(초)\n\n'
        'export const TYPING_AMBIENTS = {\n' + '\n'.join(lines) + '\n} as const\n',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
