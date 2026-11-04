// 말씀 퍼즐 효과음 — 실제 녹음(assets/puzzle-sounds, 합계 ~65KB)을 퍼즐 판을 열 때만 받아 디코딩한다.
// snap = 제자리에 붙는 나무 조각 "톡"(녹음 한 벌에서 4타를 잘라 번갈아 — 매번 같은 소리면 기계 같다)
// pickup = 보관함에서 조각을 집을 때 · complete = 다 맞춰 그림이 드러날 때 하프 아르페지오
// 오디오 컨텍스트는 첫 소리 때(=사용자 입력 안에서) 만든다 — 자동 재생 정책 때문.
// 켜고 끄기는 기기별 편의라 localStorage(safeStorage)에 둔다. 기본은 켬.
import snap1Url from '../../assets/puzzle-sounds/snap-1.mp3'
import snap2Url from '../../assets/puzzle-sounds/snap-2.mp3'
import snap3Url from '../../assets/puzzle-sounds/snap-3.mp3'
import snap4Url from '../../assets/puzzle-sounds/snap-4.mp3'
import pickupUrl from '../../assets/puzzle-sounds/pickup.mp3'
import completeUrl from '../../assets/puzzle-sounds/complete-harp.mp3'
import { safeStorage } from '../../utils/safeStorage'

export type PuzzleSoundKind = 'snap' | 'pickup' | 'complete'

const MUTE_KEY = 'pz-sound-off'
const URLS: Record<PuzzleSoundKind, string[]> = {
  snap: [snap1Url, snap2Url, snap3Url, snap4Url],
  pickup: [pickupUrl],
  complete: [completeUrl],
}
const GAIN: Record<PuzzleSoundKind, number> = { snap: 0.85, pickup: 0.45, complete: 0.6 }

let muted = safeStorage.get(MUTE_KEY) === '1'
let ctx: AudioContext | null = null
let buffers: Partial<Record<PuzzleSoundKind, AudioBuffer[]>> = {}
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

const decode = async (ac: AudioContext, url: string) => {
  const res = await fetch(url)
  const data = await res.arrayBuffer()
  // 옛 Safari 는 Promise 형 decodeAudioData 가 없다
  return new Promise<AudioBuffer>((resolve, reject) => ac.decodeAudioData(data, resolve, reject))
}

const load = (ac: AudioContext) => {
  if (!loading) {
    loading = Promise.all(
      (Object.keys(URLS) as PuzzleSoundKind[]).map(async (k) => {
        buffers[k] = await Promise.all(URLS[k].map((u) => decode(ac, u)))
      }),
    )
      .then(() => undefined)
      .catch(() => {
      // 네트워크가 끊겼으면 다음 기회에 다시
      buffers = {}
      loading = null
    })
  }
  return loading
}

/** 판을 열 때 — 파일만 미리 받아 둔다(디코딩은 컨텍스트가 생긴 뒤) */
export const prefetchPuzzleSounds = () => {
  if (muted || typeof fetch === 'undefined') return
  for (const list of Object.values(URLS)) for (const u of list) void fetch(u).catch(() => undefined)
}

/** 첫 터치 때 — 사용자 입력 안에서 컨텍스트를 깨우고 디코딩 */
export const primePuzzleSounds = () => {
  if (muted) return
  const ac = audio()
  if (ac) void load(ac)
}

export const playPuzzleSound = (kind: PuzzleSoundKind) => {
  if (muted) return
  const ac = audio()
  if (!ac) return
  const list = buffers[kind]
  if (!list?.length) {
    // 아직 디코딩 전 — 붙는 순간을 놓쳤으면 소리는 건너뛴다(늦게 나면 더 어색하다)
    void load(ac)
    return
  }
  let i = 0
  if (list.length > 1) {
    // 바로 앞과 다른 타로
    i = Math.floor(Math.random() * (list.length - 1))
    if (i >= lastSnap) i += 1
    lastSnap = i
  }
  const src = ac.createBufferSource()
  src.buffer = list[i]
  // 같은 소리라도 살짝씩 다르게 — 손으로 놓는 느낌
  if (kind === 'snap') src.playbackRate.value = 0.94 + Math.random() * 0.12
  const g = ac.createGain()
  g.gain.value = GAIN[kind]
  src.connect(g).connect(ac.destination)
  src.start()
}
