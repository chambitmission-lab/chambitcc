// 만나 내리기 — 게임 한 판의 규칙과 떨어지는 만나(DOM)를 맡는 엔진.
// React 는 머리(점수·항아리)·말씀 줄·새김 카드·결과만 그리고, 무대 위 만나는 매 프레임 바뀌어 엔진이 직접 움직인다.
//
// 규칙(출애굽기 16장)
// - 말씀 단어가 첫 단어부터 순서대로, 읽는 방향(왼→오)으로 내려온다. 지금 '차례'인 단어부터 거둔다.
// - 놓친 단어는 다시 내려오지 않는다 — 말씀 줄에 흐린 취소선으로 남고, 오멜 항아리 하나가 빈다.
// - 한 절을 다 지나면 새겨지고(한 단어도 안 놓쳤으면 '온전히 새김' 보너스) 다음 노정으로. 여덟 절이면 가나안.
// - 사이사이 벌레 먹은 만나(치면 감점, 두면 +20)와 아이템(메추라기·반석·구름기둥·불기둥)이 끼어든다.
// - 세 절마다 '여섯째 날' 10초 — 말씀이 촘촘히, 점수 두 배.
// 오늘의 만나는 서버가 준 seed 로 끼어드는 만나·자리까지 같게 굴려 모두가 같은 판을 친다.

import { getSoundTheme, playTypingSound } from '../typingSound'

export type MannaMode = 'easy' | 'normal' | 'hard'

export const MANNA_MODES: { key: MannaMode; label: string; desc: string }[] = [
  { key: 'easy', label: '쉬움', desc: '천천히 · 글자 힌트' },
  { key: 'normal', label: '보통', desc: '벌레 먹은 만나 조금' },
  { key: 'hard', label: '어려움', desc: '빠르게 · 함정 많이' },
]

// 출애굽 노정 — 판의 여덟 절을 새길 때마다 한 곳씩, 마지막이 가나안
export const PLACES = ['라암셋', '숙곳', '마라', '엘림', '신 광야', '르비딤', '시내산', '가데스', '가나안']

// 광야에서 이스라엘이 품었던 것들 — 거두면 안 되는 만나
const DECOYS = ['원망', '불평', '욕심', '염려', '교만', '시기', '거짓', '게으름']

type ItemKey = 'quail' | 'water' | 'cloud' | 'fire'
export const ITEMS: Record<ItemKey, { text: string; tag: string; desc: string }> = {
  quail: { text: '메추라기', tag: '+300', desc: '큰 점수' },
  water: { text: '반석', tag: '항아리 +1', desc: '생수로 항아리 하나 채움' },
  cloud: { text: '구름기둥', tag: '천천히', desc: '6초 동안 천천히' },
  fire: { text: '불기둥', tag: '한 번에', desc: '화면의 말씀을 한 번에' },
}

// fall = 무대 높이 대비 초당 낙하 비율, spawn = 다음 말씀 단어까지 초, ramp = 한 절마다 빨라지는 비율
// decoy·item = 끼어드는 만나를 한 번 굴릴 때의 확률
const MODES: Record<MannaMode, { fall: number; spawn: number; decoy: number; item: number; ramp: number }> = {
  easy: { fall: 0.05, spawn: 2.4, decoy: 0, item: 0.12, ramp: 0.06 },
  normal: { fall: 0.08, spawn: 1.7, decoy: 0.18, item: 0.1, ramp: 0.08 },
  hard: { fall: 0.115, spawn: 1.2, decoy: 0.32, item: 0.08, ramp: 0.1 },
}

export const MAX_JARS = 5
const FEVER_EVERY = 3
const FEVER_SECONDS = 10
const SLOW_SECONDS = 6
const HOLD_SECONDS = 2.8 // 새김 카드를 보여 주는 동안 만나를 멈춘다
const PERFECT_BONUS = 500
const QUAIL_POINTS = 300
const DECOY_PENALTY = 50
const DECOY_AVOID = 20
const GROUND_OFFSET = 30 // 무대 바닥에서 모래 언덕 윗면까지

/** 판에 쓸 단어 — 문장부호는 떼어 내고(치기 어렵다) 빈 조각은 버린다 */
export const splitWords = (text: string): string[] =>
  text
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)

export interface MannaHud {
  score: number
  combo: number
  mult: number
  jars: number
  /** 새긴 절 수 = 지금 노정 인덱스 */
  done: number
  fever: boolean
  slow: boolean
}

export type WordState = 'got' | 'miss' | 'blank'

export interface MannaVerseView {
  index: number
  ref: string
  words: string[]
  states: WordState[]
  /** 지금 차례 단어(-1 이면 모두 지남) */
  turn: number
  /** 방금 거둔 단어 — 반짝 효과 */
  fresh: number
}

export interface MannaBanner {
  ref: string
  text: string
  perfect: boolean
  missed: number
  bonus: number
  nextPlace: string
  last: boolean
}

export interface MannaResult {
  score: number
  versesDone: number
  perfectVerses: number
  wordsCaught: number
  wordsMissed: number
  maxCombo: number
  durationMs: number
  reachedCanaan: boolean
  refs: string[]
}

export interface MannaCallbacks {
  onHud: (hud: MannaHud) => void
  onVerse: (view: MannaVerseView) => void
  onBanner: (banner: MannaBanner | null) => void
  onToast: (text: string) => void
  onShake: () => void
  onOver: (result: MannaResult) => void
}

interface Falling {
  kind: 'word' | 'decoy' | 'item'
  text: string
  item?: ItemKey
  idx: number
  el: HTMLDivElement
  w: number
  h: number
  x: number
  y: number
  spd: number
  ph: number
  seed: number
  p: string | null
}

/** 시드 고정 난수(mulberry32) — 같은 seed 면 같은 판 */
const seeded = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 효과음(거둠·놓침·벌레·아이템) — 타건음을 '끄기'로 두면 함께 조용히 ──
let ac: AudioContext | null = null
let noiseBuf: AudioBuffer | null = null
const audio = (): AudioContext | null => {
  if (getSoundTheme() === 'off' || typeof window === 'undefined') return null
  if (!ac) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    try {
      ac = new C()
    } catch {
      return null
    }
  }
  if (ac.state === 'suspended') void ac.resume()
  return ac
}
const tone = (f: number, d: number, g: number, at = 0, type: OscillatorType = 'sine') => {
  const a = audio()
  if (!a) return
  const t = a.currentTime + at
  const o = a.createOscillator()
  const G = a.createGain()
  o.type = type
  o.frequency.value = f
  G.gain.setValueAtTime(0.0001, t)
  G.gain.exponentialRampToValueAtTime(g, t + 0.006)
  G.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(G).connect(a.destination)
  o.start(t)
  o.stop(t + d + 0.02)
}
const thud = () => {
  const a = audio()
  if (!a) return
  if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate)
    const ch = noiseBuf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
  }
  const t = a.currentTime
  const s = a.createBufferSource()
  const F = a.createBiquadFilter()
  const G = a.createGain()
  s.buffer = noiseBuf
  F.type = 'lowpass'
  F.frequency.value = 260
  G.gain.setValueAtTime(0.0001, t)
  G.gain.exponentialRampToValueAtTime(0.3, t + 0.004)
  G.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
  s.connect(F).connect(G).connect(a.destination)
  s.start(t, Math.random() * 0.5, 0.22)
}
const sfx = {
  catch: (streak: boolean) => {
    tone(740, 0.12, 0.1)
    tone(1110, 0.18, 0.07, 0.05)
    if (streak) tone(1480, 0.25, 0.05, 0.1)
  },
  miss: thud,
  bad: () => tone(130, 0.24, 0.09, 0, 'sawtooth'),
  item: () => [880, 1100, 1320, 1760].forEach((f, i) => tone(f, 0.22, 0.06, i * 0.05)),
}

export class MannaGame {
  private stage: HTMLElement
  private verses: { ref: string; text: string; words: string[] }[]
  private mode: MannaMode
  private cb: MannaCallbacks
  private rand: () => number

  private raf = 0
  private running = false
  private paused = false
  private last = 0
  private clock = 0
  private W = 0
  private H = 0
  private groundY = 0
  private resizeObs: ResizeObserver | null = null

  private score = 0
  private combo = 0
  private maxCombo = 0
  private jars = MAX_JARS
  private done = 0
  private perfect = 0
  private wordsCaught = 0
  private wordsMissed = 0
  private refs: string[] = []

  private vi = 0
  private caught = new Set<number>()
  private missed = new Set<number>()
  private seq = 0
  private cursorX = 8
  private fresh = -1
  private falling: Falling[] = []
  private lastSpawn = -10
  private lastExtra = -10
  private holdUntil = 0
  private pendingNext = false
  private finishing = false
  private slowUntil = 0
  private feverStart = Infinity
  private feverUntil = 0
  private feverShown = true
  private aimValue = ''
  private hudKey = ''

  constructor(opts: { stage: HTMLElement; verses: { ref: string; text: string }[]; mode: MannaMode; seed: number; callbacks: MannaCallbacks }) {
    this.stage = opts.stage
    this.verses = opts.verses.map((v) => ({ ...v, words: splitWords(v.text) })).filter((v) => v.words.length > 0)
    this.mode = opts.mode
    this.cb = opts.callbacks
    // 난이도마다 다른 흐름 — 같은 날 같은 난이도면 모두 같은 판
    this.rand = seeded(opts.seed * 31 + MANNA_MODES.findIndex((m) => m.key === opts.mode) + 1)
  }

  get verseCount() {
    return this.verses.length
  }

  start() {
    this.measure()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => this.measure())
      this.resizeObs.observe(this.stage)
    }
    this.loadVerse(0)
    this.emitHud(true)
    this.running = true
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.resizeObs?.disconnect()
    this.falling.forEach((f) => f.el.remove())
    this.falling = []
    this.stage.querySelectorAll('.mn-pop, .mn-splat').forEach((el) => el.remove())
  }

  setPaused(p: boolean) {
    if (!this.running) return
    this.paused = p
    if (!p) this.last = 0
  }

  /** 그만두기 — 지금까지로 결과를 낸다 */
  quit() {
    if (!this.running) return
    this.end(false)
  }

  // ── 무대 ──
  private measure() {
    this.W = this.stage.clientWidth
    this.H = this.stage.clientHeight
    this.groundY = this.H - GROUND_OFFSET
  }

  private loadVerse(vi: number) {
    this.vi = vi
    this.caught = new Set()
    this.missed = new Set()
    this.seq = 0
    this.fresh = -1
    this.cursorX = 8 + this.rand() * 40
    this.emitVerse()
  }

  private get words() {
    return this.verses[this.vi]?.words ?? []
  }

  private turnIdx() {
    const w = this.words
    for (let i = 0; i < w.length; i++) if (!this.caught.has(i) && !this.missed.has(i)) return i
    return -1
  }

  private comboMult() {
    return 1 + Math.min(3, Math.floor(this.combo / 4)) * 0.5
  }

  private isFever() {
    return this.clock >= this.feverStart && this.clock < this.feverUntil
  }

  private emitVerse() {
    const v = this.verses[this.vi]
    if (!v) return
    this.cb.onVerse({
      index: this.vi,
      ref: v.ref,
      words: v.words,
      states: v.words.map((_, i) => (this.caught.has(i) ? 'got' : this.missed.has(i) ? 'miss' : 'blank')),
      turn: this.turnIdx(),
      fresh: this.fresh,
    })
    this.markTurn()
  }

  private emitHud(force = false) {
    const hud: MannaHud = {
      score: this.score,
      combo: this.combo,
      mult: this.comboMult(),
      jars: this.jars,
      done: this.done,
      fever: this.isFever(),
      slow: this.clock < this.slowUntil,
    }
    const key = `${hud.score}|${hud.combo}|${hud.jars}|${hud.done}|${hud.fever}|${hud.slow}`
    if (!force && key === this.hudKey) return
    this.hudKey = key
    this.cb.onHud(hud)
  }

  // ── 떨어지는 만나 ──
  private make(kind: Falling['kind'], text: string, item?: ItemKey, idx = -1) {
    const el = document.createElement('div')
    el.className = `mn-m${kind === 'decoy' ? ' mn-m--decoy' : ''}${kind === 'item' ? ` mn-m--item mn-m--${item}` : ''}`
    if (kind === 'item' && item) el.dataset.tag = ITEMS[item].tag
    el.textContent = text
    this.stage.appendChild(el)
    const w = el.offsetWidth
    const h = el.offsetHeight
    let x: number
    if (kind === 'word') {
      // 말씀은 읽는 방향대로 — 앞 단어 오른쪽에 이어 놓고, 끝에 닿으면 왼쪽으로 줄을 바꾼다
      if (this.cursorX + w > this.W - 8) this.cursorX = 8 + this.rand() * 24
      x = this.cursorX
      this.cursorX += w + 10 + this.rand() * 18
    } else {
      // 끼어드는 만나는 위쪽 말씀과 가장 먼 자리에
      let bestD = -1
      x = 8
      const near = this.falling.filter((f) => f.y < 110)
      for (let k = 0; k < 7; k++) {
        const cx = 8 + this.rand() * Math.max(1, this.W - w - 16)
        const d = near.length ? Math.min(...near.map((f) => Math.abs(f.x + f.w / 2 - (cx + w / 2)))) : 999
        if (d > bestD) {
          bestD = d
          x = cx
        }
      }
    }
    const f: Falling = {
      kind,
      text,
      item,
      idx,
      el,
      w,
      h,
      x,
      y: -h - 4,
      // 말씀 단어는 같은 속도로 — 순서가 뒤집혀 떨어지지 않게
      spd: kind === 'word' ? 1 : 0.85 + this.rand() * 0.3,
      ph: 0,
      seed: this.rand() * 6,
      p: null,
    }
    el.style.transform = `translate(${x}px, ${f.y}px)`
    this.falling.push(f)
    this.aimOne(f)
    this.markTurn()
  }

  private spawnWord() {
    const w = this.words
    if (this.seq >= w.length) return
    this.make('word', w[this.seq], undefined, this.seq)
    this.seq++
  }

  private spawnExtra() {
    const m = MODES[this.mode]
    const r = this.rand()
    if (r < m.item && !this.falling.some((f) => f.kind === 'item')) {
      const keys = (Object.keys(ITEMS) as ItemKey[]).filter((k) => !(k === 'water' && this.jars >= MAX_JARS))
      const k = keys[Math.floor(this.rand() * keys.length)]
      this.make('item', ITEMS[k].text, k)
    } else if (r < m.item + m.decoy) {
      const free = DECOYS.filter((d) => !this.falling.some((f) => f.text === d))
      if (free.length) this.make('decoy', free[Math.floor(this.rand() * free.length)])
    }
  }

  private markTurn() {
    const t = this.turnIdx()
    this.falling.forEach((f) => f.el.classList.toggle('is-turn', f.kind === 'word' && f.idx === t))
  }

  private remove(f: Falling, caught: boolean) {
    this.falling = this.falling.filter((g) => g !== f)
    if (caught) {
      f.el.classList.add('is-gone')
      f.el.style.transform = `translate(${f.x}px, ${f.y - 24}px) scale(1.25)`
      setTimeout(() => f.el.remove(), 260)
    } else f.el.remove()
  }

  private pop(x: number, y: number, main: string, sub?: string, tone = '') {
    const el = document.createElement('div')
    el.className = `mn-pop${tone ? ` mn-pop--${tone}` : ''}`
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.append(main)
    if (sub) {
      const s = document.createElement('small')
      s.textContent = sub
      el.appendChild(s)
    }
    this.stage.appendChild(el)
    setTimeout(() => el.remove(), 1000)
  }
  private popAt(f: Falling, main: string, sub?: string, tone?: string) {
    this.pop(f.x + f.w / 2, f.y, main, sub, tone)
  }

  private splat(f: Falling, dark: boolean) {
    const el = document.createElement('div')
    el.className = `mn-splat${dark ? ' mn-splat--dark' : ''}`
    el.style.left = `${f.x + f.w / 2 - 15}px`
    this.stage.appendChild(el)
    setTimeout(() => el.remove(), 900)
  }

  private land(f: Falling) {
    this.remove(f, false)
    if (f.kind === 'word') {
      this.jars--
      this.combo = 0
      this.wordsMissed++
      this.missed.add(f.idx)
      this.splat(f, false)
      this.pop(f.x + f.w / 2, this.groundY - 30, '땅에 떨어졌어요', f.text, 'bad')
      sfx.miss()
      this.emitVerse()
      this.emitHud()
      if (this.jars <= 0) {
        this.end(false)
        return
      }
      this.checkVerseDone()
    } else if (f.kind === 'decoy') {
      this.score += DECOY_AVOID
      this.splat(f, true)
      this.pop(f.x + f.w / 2, this.groundY - 30, `+${DECOY_AVOID}`, '잘 피했어요', 'good')
    }
  }

  // ── 거두기 ──
  private catchWord(f: Falling, viaFire: boolean) {
    this.caught.add(f.idx)
    this.combo++
    this.wordsCaught++
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    const pts = Math.round(f.text.length * 20 * this.comboMult() * (this.isFever() ? 2 : 1))
    this.score += pts
    this.popAt(f, `+${pts}`, viaFire ? '불기둥' : undefined, viaFire ? 'good' : '')
    this.remove(f, true)
    this.fresh = f.idx
    this.emitVerse()
    this.checkVerseDone()
  }

  private checkVerseDone() {
    if (!this.pendingNext && this.caught.size + this.missed.size === this.words.length) this.completeVerse()
  }

  private useItem(f: Falling) {
    this.remove(f, true)
    sfx.item()
    if (f.item === 'quail') {
      const pts = QUAIL_POINTS * (this.isFever() ? 2 : 1)
      this.score += pts
      this.popAt(f, `+${pts}`, '메추라기')
    } else if (f.item === 'water') {
      this.jars = Math.min(MAX_JARS, this.jars + 1)
      this.popAt(f, '항아리 +1', '반석에서 물이', 'good')
    } else if (f.item === 'cloud') {
      this.slowUntil = this.clock + SLOW_SECONDS
      this.popAt(f, '천천히', '구름기둥', 'good')
    } else if (f.item === 'fire') {
      this.popAt(f, '불기둥', '화면의 말씀을 거둬요')
      this.falling
        .filter((g) => g.kind === 'word')
        .sort((a, b) => a.idx - b.idx)
        .forEach((g) => {
          if (this.running && !this.pendingNext) this.catchWord(g, true)
        })
    }
    this.emitHud()
  }

  /** 스페이스·엔터로 낸 단어 */
  submit(raw: string) {
    if (!this.running || this.paused) return
    const t = raw.replace(/[^\p{L}\p{N}]/gu, '')
    if (!t) return
    // 말씀 단어는 지금 차례만 거둔다 — 같은 글자가 두 번 나오는 절도 차례인 쪽으로
    const turn = this.turnIdx()
    const f =
      this.falling.find((g) => g.kind === 'word' && g.idx === turn && g.text === t) ??
      this.falling.filter((g) => g.kind !== 'word' && g.text === t).sort((a, b) => b.y - a.y)[0]
    if (!f) {
      const later = this.falling.find((g) => g.kind === 'word' && g.text === t)
      this.cb.onShake()
      if (later) {
        const cur = this.falling.find((g) => g.kind === 'word' && g.idx === turn)
        this.popAt(later, '앞 단어부터', cur ? `‘${cur.text}’ 먼저` : undefined, 'bad')
        return
      }
      this.combo = 0
      this.pop(this.W / 2, this.H - 70, '없는 단어예요', t, 'bad')
      this.emitHud()
      return
    }
    if (f.kind === 'decoy') {
      this.remove(f, true)
      this.combo = 0
      this.score = Math.max(0, this.score - DECOY_PENALTY)
      this.popAt(f, `-${DECOY_PENALTY}`, '벌레가 생겼어요', 'bad')
      sfx.bad()
      this.emitHud()
      return
    }
    if (f.kind === 'item') {
      this.useItem(f)
      return
    }
    sfx.catch(this.combo >= 3)
    this.catchWord(f, false)
    this.emitHud()
  }

  /** 치는 중인 글자와 앞이 같은 만나에 조준 테두리 */
  aim(value: string) {
    this.aimValue = value.trim()
    this.falling.forEach((f) => this.aimOne(f))
  }

  private aimOne(f: Falling) {
    const val = this.aimValue
    let p = ''
    if (val) {
      if (f.text.startsWith(val)) p = val
      else if (val.length > 1 && f.text.startsWith(val.slice(0, -1))) p = val.slice(0, -1) // 마지막 글자는 조합 중일 수 있다
    }
    if (p === f.p) return
    f.p = p
    f.el.classList.toggle('is-aim', !!p)
    f.el.textContent = ''
    if (p) {
      const b = document.createElement('b')
      b.textContent = p
      f.el.append(b, f.text.slice(p.length))
    } else f.el.textContent = f.text
  }

  private completeVerse() {
    const v = this.verses[this.vi]
    const missed = this.missed.size
    const bonus = missed === 0 ? PERFECT_BONUS * (this.isFever() ? 2 : 1) : 0
    this.done++
    if (!missed) this.perfect++
    this.refs.push(v.ref)
    this.score += bonus
    this.falling.slice().forEach((f) => this.remove(f, true))
    playTypingSound('done')
    this.holdUntil = this.clock + HOLD_SECONDS
    this.pendingNext = true
    const last = this.vi >= this.verses.length - 1
    this.finishing = last
    if (!last && this.done % FEVER_EVERY === 0) {
      this.feverStart = this.holdUntil
      this.feverUntil = this.holdUntil + FEVER_SECONDS
      this.feverShown = false
    }
    this.cb.onBanner({
      ref: v.ref,
      text: v.text,
      perfect: missed === 0,
      missed,
      bonus,
      nextPlace: PLACES[Math.min(this.done, PLACES.length - 1)],
      last,
    })
    this.emitHud()
  }

  private end(canaan: boolean) {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.falling.forEach((f) => f.el.remove())
    this.falling = []
    playTypingSound('finish')
    this.cb.onOver({
      score: this.score,
      versesDone: this.done,
      perfectVerses: this.perfect,
      wordsCaught: this.wordsCaught,
      wordsMissed: this.wordsMissed,
      maxCombo: this.maxCombo,
      durationMs: Math.round(this.clock * 1000),
      reachedCanaan: canaan,
      refs: this.refs,
    })
  }

  private frame = (ts: number) => {
    if (!this.running) return
    const now = ts / 1000
    const dt = Math.min(0.05, this.last ? now - this.last : 0)
    this.last = now
    if (!this.paused) {
      this.clock += dt
      if (this.pendingNext && this.clock >= this.holdUntil) {
        this.pendingNext = false
        this.cb.onBanner(null)
        if (this.finishing) {
          this.end(true)
          return
        }
        this.loadVerse(this.vi + 1)
        this.lastSpawn = this.clock - 10
        this.lastExtra = this.clock
      }
      if (!this.feverShown && this.clock >= this.feverStart) {
        this.feverShown = true
        this.cb.onToast('여섯째 날 — 갑절의 만나!')
      }
      const m = MODES[this.mode]
      if (!this.pendingNext) {
        // 여섯째 날엔 말씀이 촘촘히
        const interval = m.spawn / (this.isFever() ? 1.8 : 1) / (1 + this.done * 0.04)
        if (this.seq < this.words.length && this.clock - this.lastSpawn >= interval) {
          this.spawnWord()
          this.lastSpawn = this.clock
        }
        if (this.clock - this.lastExtra >= interval * 1.3) {
          this.spawnExtra()
          this.lastExtra = this.clock
        }
      }
      const v = this.H * m.fall * (1 + this.done * m.ramp) * (this.clock < this.slowUntil ? 0.4 : 1)
      for (const f of this.falling.slice()) {
        f.y += v * dt * f.spd
        f.ph += dt
        const sway = Math.sin(f.ph * 1.3 + f.seed) * 6
        f.el.style.transform = `translate(${f.x + sway}px, ${f.y}px)`
        if (f.y + f.h >= this.groundY) this.land(f)
        if (!this.running) return
      }
      this.emitHud()
    }
    this.raf = requestAnimationFrame(this.frame)
  }
}
