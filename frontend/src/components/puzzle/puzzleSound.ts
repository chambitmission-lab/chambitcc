// 말씀 퍼즐 효과음 — 실제 녹음을 한 장(assets/puzzle-sounds/sprite.mp3, ~64KB)으로 이어 붙인 스프라이트를
// 퍼즐 판을 열 때 한 번만 받아 두고, 첫 터치 때 디코딩한다. 조각 위치는 puzzleSprite.ts(scripts/gen-puzzle-sounds.py).
// snap = 제자리에 붙는 나무 조각 "톡"(한 벌에서 4타를 잘라 번갈아 — 매번 같은 소리면 기계 같다)
// pickup = 보관함에서 조각을 집을 때 · complete = 다 맞춰 그림이 드러날 때 하프 아르페지오
// 오디오 컨텍스트는 첫 소리 때(=사용자 입력 안에서) 만든다 — 자동 재생 정책 때문.
// 켜고 끄기는 기기별 편의라 localStorage(safeStorage)에 둔다. 기본은 켬.
import spriteUrl from '../../assets/puzzle-sounds/sprite.mp3'
import { PUZZLE_SPRITE, PUZZLE_SPRITE_ANCHOR_RATIO } from './puzzleSprite'
import { safeStorage } from '../../utils/safeStorage'

export type PuzzleSoundKind = 'snap' | 'pickup' | 'complete'

const MUTE_KEY = 'pz-sound-off'
const GAIN: Record<PuzzleSoundKind, number> = { snap: 0.85, pickup: 0.45, complete: 0.6 }

/** 스프라이트 안 조각 [시작초, 길이초] — 디코딩 뒤 인코더 지연만큼 옮긴 값 */
type Clips = Record<PuzzleSoundKind, Array<[start: number, dur: number]>>

let muted = safeStorage.get(MUTE_KEY) === '1'
let ctx: AudioContext | null = null
let sprite: { buf: AudioBuffer; clips: Clips } | null = null
/** 파일 바이트 — 판을 열 때 받아 두고 디코딩 때 그대로 쓴다(두 번 받지 않게) */
let bytes: Promise<ArrayBuffer> | null = null
let loading: Promise<void> | null = null
let lastSnap = -1

export const isPuzzleSoundOn = () => !muted
export const setPuzzleSoundOn = (on: boolean) => {
  muted = !on
  safeStorage.set(MUTE_KEY, on ? '0' : '1')
}

const audio = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    try {
      ctx = new C()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const fetchBytes = () => {
  bytes ??= fetch(spriteUrl)
    .then((r) => r.arrayBuffer())
    .catch((e) => {
      bytes = null // 네트워크가 끊겼으면 다음 기회에 다시
      throw e
    })
  return bytes
}

const decode = async (ac: AudioContext) => {
  const data = (await fetchBytes()).slice(0) // decodeAudioData 가 버퍼를 분리(detach)하므로 복사본을 준다
  // 옛 Safari 는 Promise 형 decodeAudioData 가 없다
  const buf = await new Promise<AudioBuffer>((resolve, reject) => ac.decodeAudioData(data, resolve, reject))
  // MP3 인코더 지연 보정 — 첫 소리 시각을 다시 찾아 매니페스트의 anchor 와 맞춘다(필사 타건음과 같은 방식)
  const pcm = buf.getChannelData(0)
  let max = 0
  for (let i = 0; i < pcm.length; i++) max = Math.max(max, Math.abs(pcm[i]))
  let first = 0
  while (first < pcm.length && Math.abs(pcm[first]) <= max * PUZZLE_SPRITE_ANCHOR_RATIO) first++
  const shift = first / buf.sampleRate - PUZZLE_SPRITE.anchor
  const move = (list: readonly (readonly [number, number])[]): Array<[number, number]> =>
    list.map(([a, d]) => [Math.max(0, a + shift), d])
  sprite = {
    buf,
    clips: { snap: move(PUZZLE_SPRITE.snap), pickup: move(PUZZLE_SPRITE.pickup), complete: move(PUZZLE_SPRITE.complete) },
  }
}

const load = (ac: AudioContext) => {
  loading ??= decode(ac).catch(() => {
    loading = null
  })
  return loading
}

/** 판을 열 때 — 파일만 미리 받아 둔다(디코딩은 컨텍스트가 생긴 뒤) */
export const prefetchPuzzleSounds = () => {
  if (muted || sprite || typeof fetch === 'undefined') return
  void fetchBytes().catch(() => undefined)
}

/** 첫 터치 때 — 사용자 입력 안에서 컨텍스트를 깨우고 디코딩 */
export const primePuzzleSounds = () => {
  if (muted) return
  const ac = audio()
  if (ac && !sprite) void load(ac)
}

export const playPuzzleSound = (kind: PuzzleSoundKind) => {
  if (muted) return
  const ac = audio()
  if (!ac) return
  if (!sprite) {
    // 아직 디코딩 전 — 붙는 순간을 놓쳤으면 소리는 건너뛴다(늦게 나면 더 어색하다)
    void load(ac)
    return
  }
  const list = sprite.clips[kind]
  let i = 0
  if (list.length > 1) {
    // 바로 앞과 다른 타로
    i = Math.floor(Math.random() * (list.length - 1))
    if (i >= lastSnap) i += 1
    lastSnap = i
  }
  const [start, dur] = list[i]
  const src = ac.createBufferSource()
  src.buffer = sprite.buf
  // 같은 소리라도 살짝씩 다르게 — 손으로 놓는 느낌
  if (kind === 'snap') src.playbackRate.value = 0.94 + Math.random() * 0.12
  const g = ac.createGain()
  g.gain.value = GAIN[kind]
  src.connect(g).connect(ac.destination)
  src.start(0, start, dur)
}
