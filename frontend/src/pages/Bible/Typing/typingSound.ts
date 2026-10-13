// 타건음 테마 — 음원 파일 없이 Web Audio 로 합성한다(번들·네트워크 0).
// 설정은 기기별 편의라 localStorage 에 두고, 패드는 이 모듈의 현재 테마만 본다(prop 을 내리지 않는다).
// 오디오 컨텍스트는 첫 소리 때(=사용자 입력 안에서) 만든다 — 자동 재생 정책 때문.

export type SoundTheme = 'off' | 'pen' | 'typewriter' | 'keys'
export type SoundKind = 'key' | 'space' | 'back' | 'done'

export const SOUND_THEMES: { key: SoundTheme; label: string; desc: string }[] = [
  { key: 'off', label: '소리 끄기', desc: '조용히' },
  { key: 'pen', label: '만년필', desc: '종이 위 사각사각' },
  { key: 'typewriter', label: '타자기', desc: '탁탁, 줄 끝엔 종소리' },
  { key: 'keys', label: '기계식 키보드', desc: '낮고 둥근 타건음' },
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

const isTheme = (v: string | null): v is SoundTheme => v === 'pen' || v === 'typewriter' || v === 'keys' || v === 'off'

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
  if (t !== 'off') playTypingSound('key')
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

export const playTypingSound = (kind: SoundKind) => {
  if (theme === 'off') return
  const ac = audio()
  if (!ac) return
  try {
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
let rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null

const startRain = () => {
  const ac = audio()
  if (!ac || rain) return
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
  const src = ac.createBufferSource()
  src.buffer = buf
  src.loop = true
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 1400
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.22, ac.currentTime + 1.2)
  src.connect(f).connect(gain).connect(ac.destination)
  src.start()
  rain = { src, gain }
}

const stopRain = () => {
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
