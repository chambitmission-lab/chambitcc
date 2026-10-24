import { safeStorage } from '../../../../utils/safeStorage'

/**
 * 말씀 잇기 효과음 — 전부 Web Audio 합성(파일 없음).
 * 드롭은 장난스러운 소리(물방울 음계·양 "메에~?"·휘슬·관중·성가대), 아케이드는 탭·글자 소리만 8비트.
 * 모든 소리는 컴프레서 한 대를 지나 여러 소리가 겹쳐도 찢어지지 않는다.
 * 양·관중·성가대는 목소리를 흉내 낸 합성이라, 나중에 녹음 파일로 바꿀 자리다.
 */

const MUTE_KEY = 'verse-link-muted'
let muted = safeStorage.get(MUTE_KEY) === '1'
export const isLinkMuted = () => muted
export const setLinkMuted = (m: boolean) => {
  muted = m
  safeStorage.set(MUTE_KEY, m ? '1' : '0')
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** 시작 버튼 탭에서 깨운다 — iOS 는 사용자 동작 안에서만 소리가 풀린다 */
export const primeLinkSound = () => void getCtx()

const live = () => (muted ? null : getCtx())

const out = (c: AudioContext): AudioNode => {
  if (!master) {
    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    master = c.createGain()
    master.gain.value = 0.9
    master.connect(comp).connect(c.destination)
  }
  return master
}

const env = (c: AudioContext, t: number, { a = 0.005, peak = 0.2, hold = 0, d = 0.3 } = {}) => {
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + a)
  if (hold) g.gain.setValueAtTime(peak, t + a + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d)
  return g
}

interface ToneOpts {
  type?: OscillatorType
  vol?: number
  delay?: number
  end?: number
}
const tone = (f: number, d: number, { type = 'sine', vol = 0.15, delay = 0, end }: ToneOpts = {}) => {
  const c = live()
  if (!c) return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = env(c, t, { a: 0.004, peak: vol, d })
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (end) o.frequency.exponentialRampToValueAtTime(end, t + d)
  o.connect(g).connect(out(c))
  o.start(t)
  o.stop(t + d + 0.05)
}

const noiseSrc = (c: AudioContext) => {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const ch = noiseBuf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
  }
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  s.loop = true
  return s
}

interface NoiseOpts {
  vol?: number
  delay?: number
  type?: BiquadFilterType
  freq?: number
  q?: number
  a?: number
  sweep?: (p: AudioParam, t: number) => void
}
const nz = (d: number, { vol = 0.2, delay = 0, type = 'lowpass', freq = 900, q = 0.7, a = 0.002, sweep }: NoiseOpts = {}) => {
  const c = live()
  if (!c) return
  const t = c.currentTime + delay
  const s = noiseSrc(c)
  const f = c.createBiquadFilter()
  const g = env(c, t, { a, peak: vol, d })
  f.type = type
  f.frequency.setValueAtTime(freq, t)
  f.Q.value = q
  sweep?.(f.frequency, t)
  s.connect(f).connect(g).connect(out(c))
  s.start(t)
  s.stop(t + a + d + 0.05)
}

// 모음 포먼트 — 양·성가대·관중 목소리
const VOWEL = { a: [800, 1150, 2900], e: [450, 1900, 2600], o: [450, 800, 2830], u: [350, 700, 2700] } as const
type Vowel = keyof typeof VOWEL

interface VoiceOpts {
  freqs: number[]
  dur: number
  vowel?: Vowel
  vol?: number
  vib?: number
  glide?: (p: AudioParam, t: number, f: number) => void
  /** 떨림(Hz) — 양 울음의 "에-에-에" */
  bleat?: number
  saw?: number
}
const voice = (c: AudioContext, t: number, { freqs, dur, vowel = 'a', vol = 0.12, vib = 0, glide, bleat = 0, saw = 2 }: VoiceOpts) => {
  const sum = c.createGain()
  const oscs: OscillatorNode[] = []
  const lfo = (freq: number, depth: number, target: AudioParam) => {
    const l = c.createOscillator()
    const lg = c.createGain()
    l.frequency.value = freq
    lg.gain.value = depth
    l.connect(lg).connect(target)
    l.start(t)
    l.stop(t + dur + 0.1)
  }
  freqs.forEach((f) => {
    for (let k = 0; k < saw; k++) {
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(f, t)
      o.detune.value = (k - (saw - 1) / 2) * 14
      glide?.(o.frequency, t, f)
      if (vib) lfo(5.5 + Math.random(), f * vib, o.frequency)
      o.connect(sum)
      oscs.push(o)
    }
  })
  let src: AudioNode = sum
  if (bleat) {
    const am = c.createGain()
    am.gain.value = 0.55
    lfo(bleat, 0.45, am.gain)
    sum.connect(am)
    src = am
  }
  const g = env(c, t, { a: 0.05, peak: vol, hold: dur * 0.6, d: dur * 0.4 })
  VOWEL[vowel].forEach((fr, i) => {
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = fr
    bp.Q.value = i ? 8 : 4
    const bg = c.createGain()
    bg.gain.value = [1, 0.6, 0.25][i]
    src.connect(bp).connect(bg).connect(g)
  })
  g.connect(out(c))
  oscs.forEach((o) => {
    o.start(t)
    o.stop(t + dur + 0.15)
  })
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.3]

export const linkSfx = {
  /** 조각 탭 — 드롭은 물방울 "뽁·뾱·뿅"이 음계로, 아케이드는 8비트 */
  tap(i: number, arcade: boolean) {
    const f = SCALE[i % SCALE.length]
    if (arcade) {
      tone(f, 0.12, { type: 'square', vol: 0.06 })
      tone(f * 2, 0.08, { type: 'square', vol: 0.025, delay: 0.04 })
      return
    }
    const c = live()
    if (!c) return
    const t = c.currentTime
    const o = c.createOscillator()
    const g = env(c, t, { a: 0.003, peak: 0.32, d: 0.16 })
    o.type = 'sine'
    o.frequency.setValueAtTime(f * 0.55, t)
    o.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.05)
    o.frequency.exponentialRampToValueAtTime(f, t + 0.12)
    o.connect(g).connect(out(c))
    o.start(t)
    o.stop(t + 0.25)
    nz(0.015, { vol: 0.08, type: 'highpass', freq: 3000 })
  },
  /** 양이 "메에~?" 하고 갸웃 / 슬프면 "메헹…" */
  sheep(sad = false) {
    const c = live()
    if (!c) return
    const base = sad ? 330 : 440
    const dur = sad ? 0.85 : 0.62
    voice(c, c.currentTime, {
      freqs: [base], dur, vowel: 'e', vol: 0.5, bleat: sad ? 11 : 15, saw: 1, vib: 0.03,
      glide: (p, t0, f) => {
        p.setValueAtTime(f * 0.9, t0)
        p.linearRampToValueAtTime(f, t0 + 0.08)
        if (sad) {
          p.linearRampToValueAtTime(f * 0.92, t0 + dur * 0.5)
          p.linearRampToValueAtTime(f * 0.68, t0 + dur)
        } else {
          p.linearRampToValueAtTime(f * 0.96, t0 + dur * 0.55)
          p.linearRampToValueAtTime(f * 1.4, t0 + dur)
        }
      },
    })
  },
  /** 쨍그랑! */
  crash() {
    tone(160, 0.18, { vol: 0.25, end: 60 })
    for (let k = 0; k < 7; k++)
      nz(0.06 + Math.random() * 0.08, { vol: 0.22, delay: Math.random() * 0.22, type: 'bandpass', freq: 2500 + Math.random() * 5000, q: 2 })
    for (let k = 0; k < 6; k++) tone(2400 + Math.random() * 3200, 0.18, { type: 'triangle', vol: 0.05, delay: 0.02 + Math.random() * 0.3 })
  },
  /** 항아리가 깨질 때 — 쨍그랑 뒤에 양. 마지막 항아리면 "메헹…" */
  crack(last: boolean) {
    linkSfx.crash()
    setTimeout(() => linkSfx.sheep(last), 260)
  },
  /** 휘리릭↑ 슬라이드 휘슬 */
  slide() {
    const c = live()
    if (!c) return
    const t = c.currentTime
    const o = c.createOscillator()
    const g = env(c, t, { a: 0.03, peak: 0.14, hold: 0.25, d: 0.12 })
    o.type = 'sine'
    o.frequency.setValueAtTime(520, t)
    o.frequency.exponentialRampToValueAtTime(1900, t + 0.38)
    const l = c.createOscillator()
    const lg = c.createGain()
    l.frequency.value = 11
    lg.gain.value = 28
    l.connect(lg).connect(o.frequency)
    o.connect(g).connect(out(c))
    ;[o, l].forEach((x) => {
      x.start(t)
      x.stop(t + 0.5)
    })
  },
  /** 관중 "오~ / 오오~! / 와아아!!" — 1~3단계 */
  crowd(level: 1 | 2 | 3) {
    const c = live()
    if (!c) return
    const t = c.currentTime
    const n = [0, 5, 9, 16][level]
    const dur = 0.7 + level * 0.35
    for (let k = 0; k < n; k++) {
      const f = 140 + Math.random() * 190
      voice(c, t + Math.random() * 0.12, {
        freqs: [f], dur: dur * (0.7 + Math.random() * 0.3), vowel: level >= 3 ? 'a' : 'o', vol: 0.6 / Math.sqrt(n), saw: 1, vib: 0.02,
        glide: (p, t0, ff) => {
          p.setValueAtTime(ff * 0.8, t0)
          p.exponentialRampToValueAtTime(ff * (level >= 2 ? 1.35 : 1.12), t0 + dur * 0.5)
          p.exponentialRampToValueAtTime(ff * 0.9, t0 + dur)
        },
      })
    }
    if (level >= 2) nz(dur, { vol: 0.05 * level, type: 'bandpass', freq: 1200, q: 0.6, a: 0.15 })
    if (level >= 3) [0, 0.25].forEach((d) => tone(900, 0.35, { vol: 0.05, delay: d + 0.1, end: 1800 }))
  },
  /** 째깍째깍 */
  tick(alt: boolean) {
    tone(alt ? 1500 : 1150, 0.03, { type: 'square', vol: 0.05 })
    nz(0.01, { vol: 0.08, type: 'highpass', freq: 4000 })
  },
  /** 탬버린 짤랑 */
  tamb(delay = 0) {
    ;[0, 0.07, 0.13].forEach((d, k) => {
      nz(0.12, { vol: 0.16 - k * 0.03, delay: delay + d, type: 'highpass', freq: 6500 })
      ;[5100, 7300, 9200].forEach((f) => tone(f, 0.09, { type: 'triangle', vol: 0.012, delay: delay + d }))
    })
  },
  /** 도장 쾅! + 짤랑 */
  stamp() {
    tone(140, 0.4, { vol: 0.55, end: 38 })
    nz(0.22, { vol: 0.4, freq: 700 })
    linkSfx.tamb(0.08)
  },
  /** 하프 띠리리링~ */
  harp(delay = 0) {
    ;[60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86].forEach((m, i) => {
      const f = NOTE(m + 12)
      tone(f, 0.9, { type: 'triangle', vol: 0.07, delay: delay + i * 0.035 })
      tone(f * 2, 0.4, { vol: 0.02, delay: delay + i * 0.035 })
    })
  },
  /** 성가대 "할-렐-루-야~" */
  hallelujah(delay = 0) {
    const c = live()
    if (!c) return
    let t = c.currentTime + delay
    const syl: { v: Vowel; d: number; ch: number[] }[] = [
      { v: 'a', d: 0.24, ch: [48, 60, 64, 67, 72] },
      { v: 'e', d: 0.24, ch: [53, 60, 65, 69, 72] },
      { v: 'u', d: 0.24, ch: [55, 59, 62, 67, 74] },
      { v: 'a', d: 1.3, ch: [48, 60, 64, 67, 72] },
    ]
    syl.forEach((s, i) => {
      voice(c, t, { freqs: s.ch.map(NOTE), dur: s.d + 0.06, vowel: s.v, vol: 0.22, vib: i === 3 ? 0.012 : 0 })
      t += s.d
    })
  },
  /** 구절 완성 — 하프 뒤에 할렐루야 */
  complete() {
    linkSfx.harp(0.15)
    linkSfx.hallelujah(0.75)
  },
  /** 부웅~ 휙! 순위 추월 */
  vroom() {
    const c = live()
    if (!c) return
    const t = c.currentTime
    const lp = c.createBiquadFilter()
    const g = c.createGain()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(500, t)
    lp.frequency.linearRampToValueAtTime(1600, t + 0.22)
    lp.frequency.linearRampToValueAtTime(400, t + 0.5)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.22)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    ;([['sawtooth', 1], ['square', 0.5]] as const).forEach(([ty, m]) => {
      const o = c.createOscillator()
      o.type = ty
      o.frequency.setValueAtTime(90 * m, t)
      o.frequency.linearRampToValueAtTime(190 * m, t + 0.22)
      o.frequency.exponentialRampToValueAtTime(70 * m, t + 0.55)
      o.connect(lp)
      o.start(t)
      o.stop(t + 0.6)
    })
    lp.connect(g).connect(out(c))
    nz(0.4, {
      vol: 0.12, delay: 0.08, type: 'bandpass', freq: 500, q: 1.5, a: 0.12,
      sweep: (p, t0) => {
        p.exponentialRampToValueAtTime(3000, t0 + 0.2)
        p.exponentialRampToValueAtTime(500, t0 + 0.4)
      },
    })
  },
  /** 두구두구두구… */
  drumroll(sec: number) {
    const n = Math.floor(sec / 0.045)
    for (let k = 0; k < n; k++) {
      const v = 0.05 + 0.22 * (k / n)
      nz(0.05, { vol: v, delay: k * 0.045, type: 'bandpass', freq: 1800, q: 0.8 })
      tone(190, 0.04, { vol: v * 0.5, delay: k * 0.045, type: 'triangle' })
    }
  },
  /** 챙! */
  cymbal(delay = 0) {
    tone(60, 0.35, { vol: 0.5, delay, end: 40 })
    nz(1.6, { vol: 0.25, delay, type: 'highpass', freq: 5000 })
    nz(0.5, { vol: 0.15, delay, type: 'bandpass', freq: 3200, q: 1 })
  },
  /** 뿌-뿌-뿌-뿌우~ 슬픈 트롬본 */
  sadTrombone() {
    const c = live()
    if (!c) return
    let t = c.currentTime + 0.1
    ;[[233.08, 0.38], [220, 0.38], [207.65, 0.38], [196, 1.3]].forEach(([f, d], i) => {
      const o = c.createOscillator()
      const lp = c.createBiquadFilter()
      const g = env(c, t, { a: 0.03, peak: 0.2, hold: d * 0.7, d: d * 0.3 })
      o.type = 'sawtooth'
      o.frequency.value = f
      lp.type = 'lowpass'
      lp.Q.value = 4
      lp.frequency.setValueAtTime(300, t)
      lp.frequency.linearRampToValueAtTime(1300, t + 0.12)
      lp.frequency.linearRampToValueAtTime(700, t + d)
      if (i === 3) {
        const l = c.createOscillator()
        const lg = c.createGain()
        l.frequency.value = 5
        lg.gain.value = 5
        l.connect(lg).connect(o.frequency)
        l.start(t + 0.25)
        l.stop(t + d)
      }
      o.connect(lp).connect(g).connect(out(c))
      o.start(t)
      o.stop(t + d + 0.05)
      t += d
    })
  },
  /** 결과 팡파레 */
  fanfare(arcade: boolean) {
    ;[523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) =>
      tone(f, 0.3, { type: arcade ? 'square' : 'triangle', vol: arcade ? 0.05 : 0.09, delay: i * 0.12 }),
    )
  },
  /** 완성 카드의 단어가 하나씩 켜질 때 — 아케이드만(드롭은 성가대가 노래한다) */
  word(i: number, arcade: boolean) {
    if (arcade) tone(SCALE[(i + 4) % 12], 0.05, { type: 'square', vol: 0.03 })
  },
  click(arcade: boolean) {
    tone(arcade ? 660 : 880, 0.06, { type: arcade ? 'square' : 'triangle', vol: 0.05 })
  },
}
