// 타건음 테마 — 만년필·기계식 키보드는 Web Audio 로 합성하고(번들·네트워크 0),
// 타자기·실제 키보드는 녹음한 음원(assets/typing-sounds, 테마당 10~80KB)을 그 테마를 고를 때만 받아 디코딩한다.
// 긴 녹음에서 한 타씩 잘라 붙인 스프라이트는 scripts/gen-typing-sounds.py 가 굽고 위치는 typingSprites.ts 에 있다.
// 설정은 기기별 편의라 localStorage 에 두고, 패드는 이 모듈의 현재 테마만 본다(prop 을 내리지 않는다).
// 오디오 컨텍스트는 첫 소리 때(=사용자 입력 안에서) 만든다 — 자동 재생 정책 때문.

import clickUrl from '../../../assets/typing-sounds/click.wav'
import thockDownUrl from '../../../assets/typing-sounds/thock-down.wav'
import thockUpUrl from '../../../assets/typing-sounds/thock-up.wav'
import typewriterUrl from '../../../assets/typing-sounds/typewriter.mp3'
import customUrl from '../../../assets/typing-sounds/real-custom.mp3'
import ibmUrl from '../../../assets/typing-sounds/real-ibm.mp3'
import rainUrl from '../../../assets/typing-sounds/ambient-rain.mp3'
import { SPRITE_ANCHOR_RATIO, TYPING_SPRITES } from './typingSprites'
import { TYPING_AMBIENTS } from './typingAmbients'

export type SoundTheme = 'off' | 'pen' | 'typewriter' | 'keys' | 'real-thock' | 'real-click' | 'real-custom' | 'real-ibm'
export type SoundKind = 'key' | 'space' | 'back' | 'done'

export const SOUND_THEMES: { key: SoundTheme; label: string; desc: string }[] = [
  // 가장 반응이 좋은 소리라 맨 위에
  { key: 'real-custom', label: '커스텀 키보드', desc: '깊게 울리는 도독도독' },
  { key: 'off', label: '소리 끄기', desc: '조용히' },
  { key: 'pen', label: '만년필', desc: '종이 위 사각사각' },
  { key: 'typewriter', label: '타자기', desc: '진짜 타자기 녹음, 다 쓰면 종소리' },
  { key: 'keys', label: '기계식 키보드', desc: '낮고 둥근 타건음' },
  { key: 'real-thock', label: '실제 키보드 · 도각', desc: '녹음한 묵직한 타건음' },
  { key: 'real-click', label: '실제 키보드 · 찰칵', desc: '녹음한 가볍고 맑은 타건음' },
  { key: 'real-ibm', label: '옛날 IBM 키보드', desc: '스프링이 철컥철컥' },
]

const THEME_KEY = 'bt-sound'
const AMBIENT_KEY = 'bt-ambient'

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}

const isTheme = (v: string | null): v is SoundTheme => SOUND_THEMES.some((t) => t.key === v)

let theme: SoundTheme = (() => {
  const v = read(THEME_KEY)
  return isTheme(v) ? v : 'off'
})()
let ambientOn = read(AMBIENT_KEY) === '1'

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())
export const subscribeSound = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export const getSoundTheme = () => theme
export const isAmbientOn = () => ambientOn

export const setSoundTheme = (t: SoundTheme) => {
  theme = t
  write(THEME_KEY, t)
  emit()
  if (isRecorded(t)) {
    // 미리 듣기는 음원이 준비된 뒤에 — 처음 고를 땐 받는 동안 잠깐 비어도 합성음으로 새지 않게
    void loadSamples(t).then(() => theme === t && playTypingSound('key'))
  } else if (t !== 'off') playTypingSound('key')
}

// ── 오디오 ───────────────────────────────────────────
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

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

const noiseBuffer = (ac: AudioContext): AudioBuffer => {
  if (noise && noise.sampleRate === ac.sampleRate) return noise
  const len = Math.floor(ac.sampleRate * 2)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

/** 짧은 노이즈 한 조각 — 필터 종류·대역·길이로 질감을 낸다 */
const burst = (
  ac: AudioContext,
  { type, freq, q = 1, dur, gain, at = 0 }: { type: BiquadFilterType; freq: number; q?: number; dur: number; gain: number; at?: number },
) => {
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const f = ac.createBiquadFilter()
  f.type = type
  f.frequency.value = freq * (0.9 + Math.random() * 0.2)
  f.Q.value = q
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(ac.destination)
  src.start(t, Math.random() * 1.5, dur + 0.02)
}

/** 짧은 사인 톤 — 몸통 울림·종소리 */
const tone = (ac: AudioContext, { freq, dur, gain, at = 0, type = 'sine' }: { freq: number; dur: number; gain: number; at?: number; type?: OscillatorType }) => {
  const t = ac.currentTime + at
  const o = ac.createOscillator()
  o.type = type
  o.frequency.value = freq
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(ac.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

// ── 녹음 음원 ─────────────────────────────────────────
type RecordedTheme = 'typewriter' | 'real-thock' | 'real-click' | 'real-custom' | 'real-ibm'
const isRecorded = (t: SoundTheme): t is RecordedTheme =>
  t === 'typewriter' || t === 'real-thock' || t === 'real-click' || t === 'real-custom' || t === 'real-ibm'

// 누를 때 소리 여러 벌(돌려 가며) · 뗄 때 · 스페이스 · 완료음. 없는 건 합성/변주로 대신한다
type SampleSet = { key: AudioBuffer[]; up?: AudioBuffer[]; space?: AudioBuffer[]; done?: AudioBuffer }
type SpriteMap = { anchor: number; key: readonly (readonly number[])[]; space?: readonly (readonly number[])[]; done?: readonly (readonly number[])[] }

const decode = async (ac: AudioContext, url: string) => {
  const res = await fetch(url)
  const data = await res.arrayBuffer()
  // 옛 Safari 는 Promise 형 decodeAudioData 가 없다
  return new Promise<AudioBuffer>((resolve, reject) => ac.decodeAudioData(data, resolve, reject))
}

const slice = (ac: AudioContext, buf: AudioBuffer, start: number, dur: number) => {
  const from = Math.max(0, Math.round(start * buf.sampleRate))
  const len = Math.max(1, Math.min(buf.length - from, Math.round(dur * buf.sampleRate)))
  const out = ac.createBuffer(1, len, buf.sampleRate)
  out.copyToChannel(buf.getChannelData(0).subarray(from, from + len), 0)
  return out
}

/** 스프라이트를 조각으로 — MP3 디코더마다 앞 지연이 달라 첫 소리 위치(anchor)로 어긋남을 맞춘다 */
const loadSprite = async (ac: AudioContext, url: string, map: SpriteMap): Promise<SampleSet> => {
  const buf = await decode(ac, url)
  const data = buf.getChannelData(0)
  let max = 0
  for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i]))
  let first = 0
  while (first < data.length && Math.abs(data[first]) <= max * SPRITE_ANCHOR_RATIO) first++
  const shift = first / buf.sampleRate - map.anchor
  const cut = (list: readonly (readonly number[])[]) => list.map(([a, d]) => slice(ac, buf, a + shift, d))
  return { key: cut(map.key), space: map.space && cut(map.space), done: map.done && cut(map.done)[0] }
}

const LOADERS: Record<RecordedTheme, (ac: AudioContext) => Promise<SampleSet>> = {
  'real-thock': async (ac) => {
    const [down, up] = await Promise.all([decode(ac, thockDownUrl), decode(ac, thockUpUrl)])
    return { key: [down], up: [up] }
  },
  'real-click': async (ac) => ({ key: [await decode(ac, clickUrl)] }),
  typewriter: (ac) => loadSprite(ac, typewriterUrl, TYPING_SPRITES.typewriter),
  'real-custom': (ac) => loadSprite(ac, customUrl, TYPING_SPRITES['real-custom']),
  'real-ibm': (ac) => loadSprite(ac, ibmUrl, TYPING_SPRITES['real-ibm']),
}

const samples: Partial<Record<RecordedTheme, SampleSet>> = {}
const loading: Partial<Record<RecordedTheme, Promise<void>>> = {}

const loadSamples = (t: RecordedTheme): Promise<void> => {
  const ac = audio()
  if (!ac) return Promise.resolve()
  loading[t] ??= LOADERS[t](ac)
    .then((set) => {
      samples[t] = set
    })
    .catch(() => {
      delete loading[t] // 다음 입력 때 다시 시도
    })
  return loading[t]!
}

const playBuffer = (ac: AudioContext, buf: AudioBuffer, { rate, gain, at = 0 }: { rate: number; gain: number; at?: number }) => {
  const src = ac.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = rate
  const g = ac.createGain()
  g.gain.value = gain
  src.connect(g).connect(ac.destination)
  src.start(ac.currentTime + at)
}

// 같은 조각이 연달아 나오지 않게 고른다
let lastPick = -1
const pickOne = (list: AudioBuffer[]) => {
  if (list.length === 1) return list[0]
  let i = Math.floor(Math.random() * list.length)
  if (i === lastPick) i = (i + 1) % list.length
  lastPick = i
  return list[i]
}

/** 녹음을 돌려 가며 쓰고 음높이·세기도 조금씩 흔든다. 스페이스 녹음이 없으면 낮고 크게, 지우기는 살짝 높고 작게 */
const playRecorded = (ac: AudioContext, s: SampleSet, kind: SoundKind) => {
  const ownSpace = kind === 'space' && s.space?.length ? s.space : null
  const jitter = () => 0.96 + Math.random() * 0.08
  const base = ownSpace ? 1 : kind === 'space' ? 0.84 : kind === 'back' ? 1.06 : 1
  const vol = (kind === 'space' ? 0.95 : kind === 'back' ? 0.6 : 0.8) * (0.85 + Math.random() * 0.15)
  playBuffer(ac, pickOne(ownSpace ?? s.key), { rate: base * jitter(), gain: vol })
  // 실제 타건처럼 손을 떼는 소리는 조금 뒤에 — 키업 이벤트를 기다리지 않는다(모바일 키보드는 키업 시점이 부정확)
  if (s.up) playBuffer(ac, pickOne(s.up), { rate: base * jitter(), gain: vol * 0.75, at: 0.07 + Math.random() * 0.04 })
}

/** 필사 화면에 들어올 때 — 녹음 테마를 골라 둔 사람은 첫 글자부터 소리가 나도록 미리 받아 둔다 */
export const preloadTypingSound = () => {
  if (isRecorded(theme)) void loadSamples(theme)
}

export const playTypingSound = (kind: SoundKind) => {
  if (theme === 'off') return
  const ac = audio()
  if (!ac) return
  try {
    if (isRecorded(theme)) {
      const set = samples[theme]
      if (!set) void loadSamples(theme)
      if (set?.done && kind === 'done') {
        playBuffer(ac, set.done, { rate: 1, gain: 0.9 })
        return
      }
      if (set && kind !== 'done') {
        playRecorded(ac, set, kind)
        return
      }
      // 아직 받는 중이면 타자기만 아래 합성음으로 잇고, 나머지는 완료음만 합성 종소리로
      if (theme !== 'typewriter') {
        if (kind === 'done') {
          tone(ac, { freq: 660, dur: 0.35, gain: 0.05 })
          tone(ac, { freq: 990, dur: 0.45, gain: 0.04, at: 0.08 })
        }
        return
      }
    }
    if (theme === 'pen') {
      if (kind === 'done') {
        tone(ac, { freq: 880, dur: 0.5, gain: 0.05 })
        tone(ac, { freq: 1320, dur: 0.6, gain: 0.035, at: 0.09 })
        return
      }
      // 사각 — 높은 대역 노이즈를 길게 두 번 긁는다
      const dur = kind === 'space' ? 0.09 : 0.05 + Math.random() * 0.03
      burst(ac, { type: 'bandpass', freq: 3800, q: 0.9, dur, gain: kind === 'back' ? 0.02 : 0.045 })
      if (kind !== 'back') burst(ac, { type: 'bandpass', freq: 5200, q: 1.2, dur: dur * 0.6, gain: 0.02, at: dur * 0.5 })
      return
    }
    if (theme === 'typewriter') {
      if (kind === 'done') {
        tone(ac, { freq: 2093, dur: 1.1, gain: 0.08 })
        tone(ac, { freq: 4186, dur: 0.7, gain: 0.025 })
        return
      }
      burst(ac, { type: 'highpass', freq: 1800, dur: 0.03, gain: kind === 'space' ? 0.12 : 0.18 })
      tone(ac, { freq: kind === 'space' ? 90 : 140, dur: 0.05, gain: 0.12, type: 'triangle' })
      return
    }
    // keys — 낮고 둥근 '도각'
    if (kind === 'done') {
      tone(ac, { freq: 660, dur: 0.35, gain: 0.05 })
      tone(ac, { freq: 990, dur: 0.45, gain: 0.04, at: 0.08 })
      return
    }
    burst(ac, { type: 'lowpass', freq: kind === 'space' ? 600 : 1100, dur: 0.04, gain: kind === 'back' ? 0.08 : 0.16 })
    tone(ac, { freq: kind === 'space' ? 110 : 190 + Math.random() * 30, dur: 0.035, gain: 0.08 })
  } catch {
    /* 오디오 실패는 조용히 */
  }
}

// ── 빗소리(배경) ─────────────────────────────────────
// 창에 듣는 실제 빗소리 녹음(scripts/gen-typing-ambient.py). 못 받으면 예전 갈색 잡음으로 대신한다
const RAIN_GAIN = 0.55
let rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null
let rainBuffer: AudioBuffer | null = null
let rainLoading: Promise<AudioBuffer | null> | null = null
let rainToken = 0 // 받는 사이 껐다 켰다 해도 마지막 요청만 소리 나게

const loadRain = (ac: AudioContext) => {
  rainLoading ??= decode(ac, rainUrl)
    .then((buf) => (rainBuffer = buf))
    .catch(() => {
      rainLoading = null
      return null
    })
  return rainLoading
}

const synthRain = (ac: AudioContext) => {
  // 갈색 잡음 — 낮게 깔리는 빗소리
  const len = ac.sampleRate * 4
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.035 * w) / 1.035
      d[i] = last * 3.2
    }
  }
  return buf
}

/** 표지음으로 디코더 지연을 재서 반복 구간을 잡는다 — 표지음은 loopStart 앞이라 들리지 않는다 */
const rainLoop = (buf: AudioBuffer) => {
  const { marker, loopStart, loopLength } = TYPING_AMBIENTS.rain
  const d = buf.getChannelData(0)
  const limit = Math.min(d.length, Math.round(buf.sampleRate * (loopStart - 0.02)))
  let i = 0
  while (i < limit && Math.abs(d[i]) < 0.5) i++
  const shift = i < limit ? i / buf.sampleRate - marker : 0
  return { start: loopStart + shift, end: loopStart + shift + loopLength }
}

const playRain = (ac: AudioContext, buf: AudioBuffer | null) => {
  const src = ac.createBufferSource()
  const gain = ac.createGain()
  let target = RAIN_GAIN
  let offset = 0
  if (buf) {
    const { start, end } = rainLoop(buf)
    src.buffer = buf
    src.loopStart = start
    src.loopEnd = end
    offset = start + Math.random() * (end - start) // 매번 같은 자리에서 시작하지 않게
    src.connect(gain)
  } else {
    src.buffer = synthRain(ac)
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 1400
    src.connect(f).connect(gain)
    target = 0.22
  }
  src.loop = true
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(target, ac.currentTime + 1.5)
  gain.connect(ac.destination)
  src.start(0, offset)
  rain = { src, gain }
}

const startRain = () => {
  const ac = audio()
  if (!ac || rain) return
  const token = ++rainToken
  if (rainBuffer) {
    playRain(ac, rainBuffer)
    return
  }
  void loadRain(ac).then((buf) => {
    if (token !== rainToken || rain || !ambientOn) return
    playRain(ac, buf)
  })
}

const stopRain = () => {
  rainToken++
  if (!rain || !ctx) return
  const { src, gain } = rain
  rain = null
  gain.gain.cancelScheduledValues(ctx.currentTime)
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
  src.stop(ctx.currentTime + 0.7)
}

export const setAmbient = (on: boolean) => {
  ambientOn = on
  write(AMBIENT_KEY, on ? '1' : '0')
  emit()
  if (on) startRain()
  else stopRain()
}

/** 필사 화면에 들어왔을 때 켜 둔 빗소리를 다시 튼다(첫 입력 때 — 자동 재생 정책) */
export const resumeAmbient = () => {
  if (ambientOn) startRain()
}
export const pauseAmbient = () => stopRain()
