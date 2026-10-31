// 주간 기도 스토리 전용 사운드 — Web Audio 즉석 합성(음원 파일 없음).
//
// A안 "키네틱 랩드": 92BPM 루프 한 곡이 스토리 내내 흐르고, 장이 넘어갈수록
// 악기가 한 겹씩 쌓여 마지막 장에서 완성된다(킥·하이햇 → 마림바 → 베이스 → 패드).
// 장 넘김·숫자 카운트업·응답 도장·마무리 화음은 루프 위에 얹는 효과음.
//
// 필사 게임용 useSfx 와 음색을 섞지 않으려고 따로 둔다. 음소거는 별도 키로 기억한다.
import { safeStorage } from '../../utils/safeStorage'

const MUTE_KEY = 'ws-beat-muted'
const BPM = 92

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let verb: GainNode | null = null

const getCtx = (): Ctx | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      ctx = new AC()
    } catch {
      return null
    }
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
    // 짧은 피드백 딜레이 — 화음·종소리에만 살짝 공간감
    const delay = ctx.createDelay()
    delay.delayTime.value = 0.23
    const fb = ctx.createGain()
    fb.gain.value = 0.32
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200
    verb = ctx.createGain()
    verb.gain.value = 0.5
    verb.connect(delay)
    delay.connect(lp)
    lp.connect(fb)
    fb.connect(delay)
    lp.connect(master)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

interface ToneOpts {
  f: number
  type?: OscillatorType
  v?: number
  a?: number
  r?: number
  d?: number
  wet?: number
  glide?: number
}

const tone = (c: Ctx, { f, type = 'sine', v = 0.15, a = 0.008, r = 0.3, d = 0, wet = 0, glide }: ToneOpts) => {
  if (!master) return
  const t = c.currentTime + Math.max(0, d)
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + r)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(v, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + r)
  o.connect(g)
  g.connect(master)
  if (wet && verb) {
    const w = c.createGain()
    w.gain.value = wet
    g.connect(w)
    w.connect(verb)
  }
  o.start(t)
  o.stop(t + a + r + 0.05)
}

let noiseBuf: AudioBuffer | null = null
const noise = (
  c: Ctx,
  { dur = 0.3, v = 0.1, f0 = 400, f1 = 2400, q = 1.2, d = 0, type = 'bandpass' as BiquadFilterType },
) => {
  if (!master) return
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const x = noiseBuf.getChannelData(0)
    for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1
  }
  const t = c.currentTime + Math.max(0, d)
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const fl = c.createBiquadFilter()
  fl.type = type
  fl.Q.value = q
  fl.frequency.setValueAtTime(f0, t)
  fl.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(v, t + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(fl)
  fl.connect(g)
  g.connect(master)
  s.start(t)
  s.stop(t + dur + 0.02)
}

// I – vi – IV – V (C 장조), 8분음표 8개씩 한 마디
const PROG = [
  [60, 64, 67],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
]

class Beat {
  private timer: number | null = null
  private step = 0
  private next = 0
  /** 1~5 — 높을수록 악기가 더 쌓인다 */
  layer = 1
  muted = typeof window !== 'undefined' && safeStorage.get(MUTE_KEY) === '1'

  setMuted(m: boolean) {
    this.muted = m
    safeStorage.set(MUTE_KEY, m ? '1' : '0')
    if (m) this.stop()
  }

  start() {
    if (this.muted || this.timer != null) return
    const c = getCtx()
    if (!c) return
    this.next = c.currentTime + 0.06
    this.step = 0
    this.timer = window.setInterval(() => this.tick(), 25)
  }

  stop() {
    if (this.timer != null) window.clearInterval(this.timer)
    this.timer = null
  }

  get running() {
    return this.timer != null
  }

  private tick() {
    const c = ctx
    if (!c) return
    const spb = 60 / BPM / 2
    while (this.next < c.currentTime + 0.12) {
      this.playStep(c, this.step, this.next - c.currentTime)
      this.next += spb
      this.step = (this.step + 1) % 32
    }
  }

  private playStep(c: Ctx, s: number, d: number) {
    const L = this.layer
    const chord = PROG[Math.floor(s / 8) % 4]
    if (s % 4 === 0) tone(c, { f: 110, v: 0.2, r: 0.18, d, glide: 45 })
    if (s % 2 === 1) noise(c, { dur: 0.05, v: 0.022, f0: 7000, f1: 9000, q: 0.7, d, type: 'highpass' })
    if (L >= 2 && [0, 3, 5, 6].includes(s % 8)) {
      tone(c, { f: midi(chord[(s * 7) % 3] + 12), type: 'triangle', v: 0.065, a: 0.002, r: 0.16, d })
    }
    if (L >= 3 && s % 8 === 0) tone(c, { f: midi(chord[0] - 24), v: 0.13, a: 0.01, r: 0.5, d })
    if (L >= 5 && s % 8 === 0) {
      chord.forEach((m) => tone(c, { f: midi(m), v: 0.032, a: 0.2, r: 1.2, d, wet: 0.4 }))
    }
  }

  private fx(play: (c: Ctx) => void) {
    if (this.muted) return
    const c = getCtx()
    if (c) play(c)
  }

  /** 장 넘김 — 바람 소리 뒤 낮은 북 */
  riser() {
    this.fx((c) => {
      noise(c, { dur: 0.42, v: 0.1, f0: 300, f1: 5000, q: 0.8 })
      tone(c, { f: midi(48), v: 0.26, r: 0.32, d: 0.38, glide: midi(36) })
    })
  }

  /** 숫자 카운트업 — 음이 한 칸씩 올라간다 */
  count(steps = 14) {
    this.fx((c) => {
      for (let i = 0; i < steps; i++) tone(c, { f: midi(72 + i), type: 'triangle', v: 0.05, r: 0.05, d: i * 0.055 })
      tone(c, { f: midi(72 + steps + 2), v: 0.1, r: 0.6, d: steps * 0.055 + 0.03, wet: 0.5 })
    })
  }

  /** 응답 도장 — 쿵 + 밝은 세 음 */
  stamp(delay = 0) {
    this.fx((c) => {
      tone(c, { f: 120, v: 0.34, r: 0.25, d: delay, glide: 50 })
      noise(c, { dur: 0.12, v: 0.13, f0: 1500, f1: 600, d: delay, type: 'lowpass' })
      ;[76, 79, 84].forEach((m, i) => tone(c, { f: midi(m), type: 'triangle', v: 0.09, r: 0.3, d: delay + 0.12 + i * 0.06, wet: 0.4 }))
    })
  }

  /** 마무리 화음 */
  chord() {
    this.fx((c) => {
      ;[60, 64, 67, 71, 74].forEach((m, i) => tone(c, { f: midi(m), type: 'triangle', v: 0.08, a: 0.03, r: 2.2, d: i * 0.03, wet: 0.6 }))
      tone(c, { f: midi(36), v: 0.22, r: 1.6 })
    })
  }

  /** 버튼 누름 — 아주 짧은 틱 */
  tap() {
    this.fx((c) => {
      tone(c, { f: 1900, v: 0.06, a: 0.002, r: 0.03 })
      tone(c, { f: 950, v: 0.03, a: 0.002, r: 0.04, d: 0.01 })
    })
  }
}

export const storyBeat = new Beat()
