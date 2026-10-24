import type { MannaVerse } from '../../../../api/bibleTyping'
import { lookalike } from '../manna/mannaEngine'

/**
 * 말씀 잇기 규칙 — 순수 함수만. 화면·소리는 VerseLinkPage 가 맡는다.
 * 점수식을 바꾸면 백엔드 bible_link_service 의 사람 범위(MAX_POINTS_*)도 함께 볼 것.
 */

export const LIVES = 3
export const MAX_PIECES = 9
/** 조각 하나에 주는 시간(스피드 보너스 퓨즈) */
export const MS_PER_PIECE = 2300
export const PIECE_POINTS = 10
export const MAX_MULT = 5
export const WRONG_PENALTY = 5
export const SPEED_BONUS_MAX = 150
export const PERFECT_BONUS = 100
/** 이 콤보마다 휘슬+환호+가운데 문구 */
export const BURST_EVERY = 5
/** 퓨즈가 이만큼 남으면 째깍째깍 */
export const TICK_FROM = 0.3
/** 넷째 절부터 한 글자만 다른 함정 조각이 섞인다(두 개) */
export const DECOY_FROM_ROUND = 3

export const comboMult = (combo: number) => Math.min(1 + Math.floor(combo / 3), MAX_MULT)

/** 어절 단위 조각 — 긴 절은 가장 짧은 이웃끼리 묶어 9조각 안쪽으로 */
export const chunk = (text: string): string[] => {
  const w = text.split(/\s+/).filter(Boolean)
  while (w.length > MAX_PIECES) {
    let best = 0
    let bl = Infinity
    for (let i = 0; i < w.length - 1; i++) {
      const l = w[i].length + w[i + 1].length
      if (l < bl) {
        bl = l
        best = i
      }
    }
    w.splice(best, 2, `${w[best]} ${w[best + 1]}`)
  }
  return w
}

/** 같은 시드면 같은 수열 — 오늘의 판은 교회 전체가 함정 조각까지 같다 */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Piece {
  id: number
  text: string
  decoy: boolean
  /** 스티커 기울기(deg) */
  tilt: number
}

export interface Round {
  verse: MannaVerse
  parts: string[]
  pieces: Piece[]
}

export const buildRound = (verse: MannaVerse, round: number, rand: () => number): Round => {
  const parts = chunk(verse.text)
  const decoys: string[] = []
  if (round >= DECOY_FROM_ROUND) {
    const avoid = new Set(parts)
    // 긴 조각일수록 닮은꼴이 잘 숨는다
    for (const src of [...parts].sort((a, b) => b.length - a.length)) {
      const fake = lookalike(src.split(' ')[0], rand, avoid)
      if (fake) {
        const whole = src.includes(' ') ? `${fake} ${src.split(' ').slice(1).join(' ')}` : fake
        decoys.push(whole)
        avoid.add(whole)
      }
      if (decoys.length === 2) break
    }
  }
  const all = [...parts.map((text) => ({ text, decoy: false })), ...decoys.map((text) => ({ text, decoy: true }))]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return {
    verse,
    parts,
    pieces: all.map((p, id) => ({ ...p, id, tilt: Math.round((rand() * 6 - 3) * 10) / 10 })),
  }
}

export interface LinkResult {
  score: number
  cleared: boolean
  versesDone: number
  perfectVerses: number
  pieces: number
  mistakes: number
  maxCombo: number
  durationMs: number
  /** 절마다 걸린 시간(초) */
  verseSecs: number[]
}

export interface LinkPersona {
  key: string
  title: string
  desc: string
  icon: string
  /** 이모지 대신 참비(앱의 양 캐릭터)를 띄운다 — 양이 주인공인 유형 */
  mascot?: boolean
  /** 동그라미 색 — CSS 역할 토큰 이름 */
  tone: 'gold' | 'acc' | 'sky' | 'hot'
  stat: { label: string; value: string }
}

/** 오늘의 '말씀 잇기 유형' — 한 판 기록에서 가장 두드러진 버릇 하나 */
export const linkPersona = (r: LinkResult, total: number): LinkPersona => {
  const perPiece = r.durationMs / 1000 / Math.max(r.pieces, 1)
  if (r.cleared && r.perfectVerses === total)
    return { key: 'perfect', title: '한 조각도 안 틀린\n완벽주의형', desc: `${total}절을 한 번도 틀리지 않았어요.\n말씀 앞에 진심인 타입.`, icon: '💎', tone: 'gold', stat: { label: '무실수', value: `${r.perfectVerses}/${total}` } }
  if (r.maxCombo >= 20)
    return { key: 'combo', title: '콤보\n폭주기관차형', desc: `한 번 붙으면 안 멈춰요.\n최고 ${r.maxCombo}콤보까지 질주.`, icon: '🔥', tone: 'acc', stat: { label: '최고 콤보', value: `${r.maxCombo}` } }
  if (perPiece < 1.1)
    return { key: 'speed', title: '번개 손가락\n스피드러너형', desc: `조각 하나에 ${perPiece.toFixed(1)}초.\n손이 말씀보다 빨라요.`, icon: '⚡', tone: 'sky', stat: { label: '조각당', value: `${perPiece.toFixed(1)}초` } }
  if (r.mistakes >= LIVES)
    return { key: 'stroll', title: '여유만만\n말씀 산책러형', desc: '틀려도 서두르지 않아요.\n다음 판엔 항아리를 지켜 봐요.', icon: '🐑', mascot: true, tone: 'sky', stat: { label: '이은 조각', value: `${r.pieces}` } }
  return { key: 'steady', title: '차근차근\n말씀 순례자형', desc: '한 절 한 절 차근차근.\n결국 끝까지 가는 타입.', icon: '👣', tone: 'hot', stat: { label: '이은 말씀', value: `${r.versesDone}절` } }
}

/** 콤보 터짐 문구(드롭) — 만나 내리기와 같은 말투 */
const BURST_LINES = ['미쳤다!', '폼 미쳤다', '손 풀렸다', '갓벽!', '멈추지 마']
export const linkBurstText = (arcade: boolean, combo: number) =>
  arcade ? `${combo} COMBO!` : BURST_LINES[(combo / BURST_EVERY - 1) % BURST_LINES.length]

export interface LinkView {
  round: number
  verse: MannaVerse
  parts: string[]
  pieces: Piece[]
  idx: number
  landed: number
  used: ReadonlySet<number>
  lives: number
  score: number
  combo: number
  roundDone: boolean
}

export type TapOutcome =
  | { kind: 'ignored' }
  | { kind: 'hit'; slot: number; pts: number; mult: number; combo: number; roundDone: boolean }
  | { kind: 'miss'; lives: number }

/**
 * 한 판의 규칙 상태 — 화면은 snapshot() 을 받아 그린다(만나 내리기의 MannaGame 과 같은 문법).
 * 빠른 연타에서도 옛 상태를 읽지 않도록 규칙은 이 객체 하나에서만 바뀐다.
 */
export class LinkRun {
  private readonly rand: () => number
  private round = 0
  private r: Round
  private idx = 0
  private landed = 0
  private used = new Set<number>()
  private lives = LIVES
  private score = 0
  private combo = 0
  private maxCombo = 0
  private pieces = 0
  private mistakes = 0
  private vMistakes = 0
  private perfects = 0
  private verseSecs: number[] = []
  private t0 = performance.now()
  private readonly started = performance.now()
  private roundDone = false
  private over = false
  private readonly verses: MannaVerse[]

  constructor(verses: MannaVerse[], seed: number) {
    this.verses = verses
    // 같은 판이면 함정 조각까지 같게 — 시드 난수는 한 판 동안 하나
    this.rand = mulberry32(seed)
    this.r = buildRound(verses[0], 0, this.rand)
  }

  get total() {
    return this.verses.length
  }
  get isLastRound() {
    return this.round >= this.verses.length - 1
  }
  get isActive() {
    return !this.roundDone && !this.over
  }

  snapshot(): LinkView {
    return {
      round: this.round, verse: this.r.verse, parts: this.r.parts, pieces: this.r.pieces, idx: this.idx,
      landed: this.landed, used: new Set(this.used), lives: this.lives, score: this.score, combo: this.combo,
      roundDone: this.roundDone,
    }
  }

  /** 스피드 퓨즈 — 이 절에서 남은 비율(0~1)과 지난 시간 */
  fuse(now: number) {
    const el = now - this.t0
    return { left: Math.max(0, 1 - el / (this.r.parts.length * MS_PER_PIECE)), elapsed: el }
  }

  /** 지금 눌러야 할 조각(힌트용) */
  wantedPiece(): number | null {
    const want = this.r.parts[this.idx]
    return this.r.pieces.find((p) => !this.used.has(p.id) && !p.decoy && p.text === want)?.id ?? null
  }

  tap(pieceId: number): TapOutcome {
    if (!this.isActive || this.used.has(pieceId)) return { kind: 'ignored' }
    const piece = this.r.pieces.find((p) => p.id === pieceId)
    if (!piece) return { kind: 'ignored' }
    if (!piece.decoy && piece.text === this.r.parts[this.idx]) {
      const slot = this.idx
      this.combo++
      this.maxCombo = Math.max(this.maxCombo, this.combo)
      this.pieces++
      const mult = comboMult(this.combo)
      const pts = PIECE_POINTS * mult
      this.score += pts
      this.used.add(pieceId)
      this.idx++
      if (this.idx === this.r.parts.length) this.roundDone = true
      return { kind: 'hit', slot, pts, mult, combo: this.combo, roundDone: this.roundDone }
    }
    this.combo = 0
    this.vMistakes++
    this.mistakes++
    this.score = Math.max(0, this.score - WRONG_PENALTY)
    this.lives--
    if (this.lives <= 0) this.roundDone = true
    return { kind: 'miss', lives: this.lives }
  }

  /** 날아간 조각이 빈칸에 내려앉음 */
  land(slot: number) {
    this.landed = Math.max(this.landed, slot + 1)
  }

  /** 한 절을 다 이음 — 스피드·무실수 보너스를 더한다 */
  completeVerse() {
    const { left, elapsed } = this.fuse(performance.now())
    const speed = Math.round(left * SPEED_BONUS_MAX)
    const perfect = this.vMistakes === 0
    this.score += speed + (perfect ? PERFECT_BONUS : 0)
    this.verseSecs.push(elapsed / 1000)
    if (perfect) this.perfects++
    return { speed, perfect, secs: elapsed / 1000 }
  }

  nextRound() {
    this.round++
    this.r = buildRound(this.verses[this.round], this.round, this.rand)
    this.idx = 0
    this.landed = 0
    this.used = new Set()
    this.vMistakes = 0
    this.roundDone = false
    this.t0 = performance.now()
  }

  /** 판 끝 — 한 번만 결과를 낸다(두 번째부터 null) */
  finish(cleared: boolean): LinkResult | null {
    if (this.over) return null
    this.over = true
    return {
      score: this.score, cleared, versesDone: this.verseSecs.length, perfectVerses: this.perfects, pieces: this.pieces,
      mistakes: this.mistakes, maxCombo: this.maxCombo, durationMs: Math.round(performance.now() - this.started),
      verseSecs: this.verseSecs,
    }
  }
}
