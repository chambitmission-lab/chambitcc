/**
 * 말씀 필사 타자 엔진 — 순수 함수만 둔다(React·DOM 없음).
 *
 * 핵심 난제는 한글 입력기의 "조합 중인 글자"다. '한'을 치는 도중엔 'ㅎ'→'하'→'한'이 차례로
 * 보이고, 다음 글자가 모음이면 받침이 넘어가기까지 한다('한'+'ㅏ' → '하나', 도깨비불).
 * 글자 단위로 바로 비교하면 치는 내내 빨간 오타가 깜빡인다. 그래서
 *   1) 모든 글자를 두벌식 "키 입력" 단위(자모, 겹받침·겹모음은 둘로)로 풀고,
 *   2) 마지막 글자만은 "목표 글자 + 다음 글자 첫 키"의 접두사이면 판정을 미룬다(pending).
 * 타수(분당 타수)도 같은 키 단위로 센다 — 한컴 타자연습 등 국내 관례와 같다.
 */

// ── 자모 표 ─────────────────────────────────────────────
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// 두 번 눌러 만드는 겹모음·겹받침 (쌍자음 ㄲ·ㅆ 등은 Shift 한 번이라 1타)
const SPLIT: Record<string, string> = {
  ㅘ: 'ㅗㅏ', ㅙ: 'ㅗㅐ', ㅚ: 'ㅗㅣ', ㅝ: 'ㅜㅓ', ㅞ: 'ㅜㅔ', ㅟ: 'ㅜㅣ', ㅢ: 'ㅡㅣ',
  ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ',
}

const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3

const isSyllable = (ch: string) => {
  const c = ch.charCodeAt(0)
  return c >= SYLLABLE_START && c <= SYLLABLE_END
}
const isCompatJamo = (ch: string) => {
  const c = ch.charCodeAt(0)
  return c >= 0x3131 && c <= 0x318e
}
/** 입력기가 아직 조합 중일 수 있는 글자(완성형 음절·낱자모) */
export const isHangul = (ch: string) => isSyllable(ch) || isCompatJamo(ch)

const splitJamo = (j: string): string => SPLIT[j] ?? j

/** 한 글자 → 두벌식 키 입력 열. 한글이 아니면 그 글자 하나 */
export const charKeys = (ch: string): string => {
  if (isSyllable(ch)) {
    const code = ch.charCodeAt(0) - SYLLABLE_START
    const cho = CHO[Math.floor(code / 588)]
    const jung = JUNG[Math.floor((code % 588) / 28)]
    const jong = JONG[code % 28]
    return cho + splitJamo(jung) + splitJamo(jong)
  }
  if (isCompatJamo(ch)) return splitJamo(ch)
  return ch
}

/** 문자열의 총 타수 */
export const countKeystrokes = (text: string): number => {
  let n = 0
  for (const ch of text) n += charKeys(ch).length
  return n
}

// ── 정규화 ──────────────────────────────────────────────
// 문장부호 무시: 한글·영문·숫자·공백만 남긴다. 성경 본문의 쉼표·마침표·따옴표·괄호를
// 모바일에서 일일이 맞춰 치는 건 공부가 아니라 고역이라 기본값으로 켠다.
const PUNCT_RE = /[^0-9A-Za-zㄱ-ㆎ가-힣\s]/g

export interface NormalizeOptions {
  ignorePunct: boolean
}

/** 입력 정규화 — 끝 공백은 남긴다(지금 막 띄어쓴 것도 진행이다) */
export const normalizeTyped = (text: string, opts: NormalizeOptions): string => {
  let t = text.replace(/[\r\n]+/g, '').replace(/\s+/g, ' ')
  if (opts.ignorePunct) t = t.replace(PUNCT_RE, '').replace(/\s+/g, ' ')
  return t.replace(/^\s+/, '')
}

// ── 비교 ────────────────────────────────────────────────
export type CharState = 'correct' | 'wrong' | 'pending' | 'untyped'

export interface Comparison {
  /** 목표 글자별 상태 */
  states: CharState[]
  /** 판정이 끝난 글자 중 맞은 수 */
  correct: number
  /** 판정이 끝난 글자 수(pending 제외) */
  judged: number
  /** 목표보다 더 친 글자 수 */
  overflow: number
}

/** 마지막 글자가 조합 중이라 아직 틀렸다고 볼 수 없는가 */
const isPendingLast = (typedCh: string, target: string, i: number): boolean => {
  if (!isHangul(typedCh)) return false
  const want = target[i]
  if (want === undefined) return false
  const next = target[i + 1]
  // 받침이 다음 글자 초성으로 넘어갈 수 있다 — 다음 글자의 첫 키까지 이어 붙여 본다
  const reach = charKeys(want) + (next !== undefined ? charKeys(next).slice(0, 1) : '')
  return reach.startsWith(charKeys(typedCh))
}

export const compare = (target: string, typed: string): Comparison => {
  const states: CharState[] = new Array(target.length).fill('untyped')
  let correct = 0
  let judged = 0
  const lastIdx = typed.length - 1
  for (let i = 0; i < Math.min(typed.length, target.length); i++) {
    const t = typed[i]
    if (t === target[i]) {
      states[i] = 'correct'
      correct++
      judged++
    } else if (i === lastIdx && isPendingLast(t, target, i)) {
      states[i] = 'pending'
    } else {
      states[i] = 'wrong'
      judged++
    }
  }
  return { states, correct, judged, overflow: Math.max(0, typed.length - target.length) }
}

/** 편집 거리(Levenshtein) — 한 글자 빠뜨려 뒤가 전부 밀려도 정확도가 무너지지 않게 */
export const editDistance = (a: string, b: string): number => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  let cur = new Array<number>(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}

/** 최종 정확도 0~1 */
export const finalAccuracy = (target: string, typed: string): number => {
  if (!target.length) return 1
  const dist = editDistance(target, typed.trimEnd())
  return Math.max(0, 1 - dist / target.length)
}

/** 분당 타수 */
export const cpmOf = (keystrokes: number, ms: number): number =>
  ms <= 0 ? 0 : Math.round((keystrokes * 60000) / ms)

/** 정확도 합격선 — 백엔드 READ_ACCURACY 와 같다 */
export const PASS_ACCURACY = 0.95

// ── 암송 힌트 ───────────────────────────────────────────
/** 글자의 초성(한글 음절만). 그 외 글자는 그대로 */
export const initialOf = (ch: string): string => {
  if (!isSyllable(ch)) return ch
  return CHO[Math.floor((ch.charCodeAt(0) - SYLLABLE_START) / 588)]
}
