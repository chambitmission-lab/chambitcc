"""필사 화면 '실제 녹음' 타건음 스프라이트 굽기.

긴 타이핑 녹음(Freesound CC0)에서 앞뒤가 조용한 한 타씩만 자동으로 골라
테마당 MP3 한 장(스프라이트)으로 이어 붙이고, 조각 위치를 typingSprites.ts 로 쓴다.

  python -I frontend/scripts/gen-typing-sounds.py <원본 폴더>

원본 폴더에 thocky.mp3 · typewriter.wav · buckling.ogg 가 있어야 한다.
MP3 는 인코더 지연만큼 앞이 밀리므로, 런타임이 디코딩한 버퍼에서 첫 소리(anchor)를 다시 찾아 어긋남을 보정한다.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'src' / 'assets' / 'typing-sounds'
MANIFEST = ROOT / 'src' / 'pages' / 'Bible' / 'Typing' / 'typingSprites.ts'
GAP = 0.2  # 조각 사이 무음
ANCHOR_RATIO = 0.25  # 스프라이트 최대 진폭 대비 '첫 소리' 기준 — 런타임과 같은 값

# theme: 원본, 일반 키 개수, 스페이스 개수, 완료음 구간(초)
SOURCES = {
    'typewriter': dict(file='typewriter.wav', keys=10, space=0, done=[(20.03, 20.75), (17.85, 19.55)]),
    'real-custom': dict(file='thocky.mp3', keys=10, space=3),
    'real-ibm': dict(file='buckling.ogg', keys=10, space=3),
}


def load(path: Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d) / 'a.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_f32le', str(tmp)], check=True)
        _, x = wavfile.read(tmp)
    x = x.astype(np.float64)
    return x - x.mean()


def envelope(x: np.ndarray, hop: int) -> np.ndarray:
    return np.sqrt(np.convolve(x**2, np.ones(hop * 2) / (hop * 2), 'same'))[::hop]


def centroid(seg: np.ndarray) -> float:
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
    freqs = np.fft.rfftfreq(len(seg), 1 / SR)
    return float((spec * freqs).sum() / max(spec.sum(), 1e-12))


def strokes(x: np.ndarray) -> list[dict]:
    """앞 100ms 가 조용하고, 다음 강한 타건과 겹치지 않는 한 타들"""
    hop = int(SR * 0.002)
    env = envelope(x, hop)
    floor, peak = np.percentile(env, 20), np.percentile(env, 99.5)
    hi, lo = floor + (peak - floor) * 0.12, floor + (peak - floor) * 0.04
    quiet = floor + (peak - floor) * 0.03
    onsets, armed = [], True
    for i, v in enumerate(env):
        if armed and v > hi:
            onsets.append(i)
            armed = False
        elif not armed and v < lo:
            armed = True
    t = np.array(onsets) * hop / SR
    pk = np.array([np.abs(x[int(s * SR) : int(s * SR) + int(0.05 * SR)]).max() for s in t])
    out = []
    for k, s in enumerate(t):
        i = int(s * SR / hop)
        pre = env[max(0, i - 50) : max(0, i - 2)]
        if len(pre) < 40 or pre.max() > quiet * 1.5:
            continue
        end = s + 0.30
        for j in range(k + 1, len(t)):
            if t[j] - s > 0.30:
                break
            if t[j] - s > 0.03 and pk[j] >= 0.6 * pk[k]:
                end = t[j] - 0.004
                break
        loud = np.where(env[i : int(end * SR / hop)] > quiet)[0]
        if len(loud) == 0:
            continue
        dur = (loud[-1] + 5) * hop / SR
        if not 0.05 <= dur <= 0.3:
            continue
        a = max(0, int((s - 0.002) * SR))
        seg = x[a : a + int(dur * SR)]
        # 한 조각 안에 다른 키가 세게 한 번 더 눌렸으면 버린다(뗄 때 소리는 이보다 약하다)
        if np.abs(seg[int(0.04 * SR) :]).max(initial=0) > 0.55 * np.abs(seg).max():
            continue
        out.append(dict(t=float(s), dur=dur, pk=float(pk[k]), c=centroid(seg[: int(0.04 * SR)]), seg=seg))
    return out


def shape(seg: np.ndarray) -> np.ndarray:
    y = seg.copy()
    fi = int(0.0008 * SR)
    y[:fi] *= np.linspace(0, 1, fi)
    fo = min(int(0.015 * SR), len(y) // 3)
    y[-fo:] *= np.linspace(1, 0, fo) ** 2
    return y


def pick(cands: list[dict], n_keys: int, n_space: int) -> tuple[list[dict], list[dict]]:
    c = np.array([q['c'] for q in cands])
    pk = np.array([q['pk'] for q in cands])
    space: list[dict] = []
    if n_space:
        # 스페이스바 = 확연히 낮게 울리고 세게 눌린 타
        low = [q for q in cands if q['c'] < np.percentile(c, 20) and q['pk'] >= np.median(pk)]
        low.sort(key=lambda q: q['c'])
        if len(low) >= 2 and np.median([q['c'] for q in low]) < np.median(c) * 0.75:
            space = low[:n_space]
    rest = [q for q in cands if q not in space and np.percentile(c, 20) <= q['c'] <= np.percentile(c, 90)]
    med = np.median(pk)
    rest.sort(key=lambda q: abs(np.log(q['pk'] / med)))  # 세기가 고른 것부터
    keys = sorted(rest[:n_keys], key=lambda q: q['t'])
    return keys, space


def level(clips: list[np.ndarray], target: float) -> list[np.ndarray]:
    """조각 세기를 맞추되 자연스러운 강약은 조금 남긴다"""
    peaks = np.array([np.abs(y).max() for y in clips])
    med = np.median(peaks)
    return [y * (target * (p / med) ** 0.3 / p) for y, p in zip(clips, peaks)]


def main() -> None:
    src_dir = Path(sys.argv[1])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for theme, cfg in SOURCES.items():
        x = load(src_dir / cfg['file'])
        keys, space = pick(strokes(x), cfg['keys'], cfg['space'])
        groups: dict[str, list[np.ndarray]] = {
            'key': level([shape(q['seg']) for q in keys], 0.6),
            'space': level([shape(q['seg']) for q in space], 0.7) if space else [],
        }
        if 'done' in cfg:
            parts = [shape(x[int(a * SR) : int(b * SR)]) for a, b in cfg['done']]
            parts[0] *= 0.55 / np.abs(parts[0]).max()
            parts[1] *= 0.35 / np.abs(parts[1]).max()
            # 종이 울리고 조금 뒤 줄이 넘어간다
            gap = np.zeros(int(0.25 * SR))
            groups['done'] = [np.concatenate([parts[0], gap, parts[1]])]
        buf = [np.zeros(int(0.1 * SR))]
        pos = len(buf[0]) / SR
        entry: dict[str, list[list[float]]] = {}
        for name, clips in groups.items():
            if not clips:
                continue
            entry[name] = []
            for y in clips:
                entry[name].append([round(pos, 4), round(len(y) / SR, 4)])
                buf += [y, np.zeros(int(GAP * SR))]
                pos += (len(y) + int(GAP * SR)) / SR
        sprite = np.concatenate(buf)
        first = int(np.argmax(np.abs(sprite) > np.abs(sprite).max() * ANCHOR_RATIO))
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d) / 's.wav'
            wavfile.write(tmp, SR, (np.clip(sprite, -1, 1) * 32767).astype(np.int16))
            out = OUT_DIR / f'{theme}.mp3'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-c:a', 'libmp3lame', '-b:a', '96k', str(out)], check=True)
        manifest[theme] = dict(anchor=round(first / SR, 4), **entry)
        counts = ', '.join(f'{k} {len(v)}' for k, v in entry.items())
        print(f'{theme}: {counts} - {out.stat().st_size // 1024}KB')

    lines = []
    for theme, m in manifest.items():
        lines.append(f"  '{theme}': {{")
        lines.append(f"    anchor: {m['anchor']},")
        for k in ('key', 'space', 'done'):
            if k in m:
                lines.append(f"    {k}: {json.dumps(m[k], separators=(', ', ': '))},")
        lines.append('  },')
    body = '{\n' + '\n'.join(lines) + '\n}'
    MANIFEST.write_text(
        '// scripts/gen-typing-sounds.py 가 만든다 — 손으로 고치지 말 것.\n'
        '// 스프라이트(MP3) 안 조각 위치 [시작초, 길이초]. anchor = 첫 소리 시각(인코더 지연 보정용)\n\n'
        f'export const SPRITE_ANCHOR_RATIO = {ANCHOR_RATIO}\n\n'
        f'export const TYPING_SPRITES = {body} as const\n',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
