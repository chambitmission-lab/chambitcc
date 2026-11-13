/**
 * 요약 해석 본문을 "절 범위별 노트"로 나눈다 — 말씀 해석 패널의 '절 따라 읽기' 화면용.
 *
 * 요약 해석의 한 덩어리는 이렇게 생겼다:
 *   '★본문을 풀어 쓴 인용'는 것은, 풀이(25:28)가 …을 보이고, …을(약 1:15 덧말) 보입니다(3-4절)
 * 본문 인용·풀이·참조 구절·절 범위가 한 문장에 엉켜 있고 핵심 표시(★)는 날것으로 보인다.
 * 이걸 인용 / 풀이 문장들 / 참조 구절 / 절 범위 / 핵심 여부로 갈라 준다.
 *
 * 문장은 **다시 쓰지 않는다** — 자르고 옮기기만 한다. 형식이 하나라도 어긋나면 null 을
 * 돌려주고, 화면은 예전 지면(BibleCommentaryItem)으로 그린다. 요한복음·로마서처럼 줄글로
 * 쓰인 요약 해석이 그쪽으로 간다.
 */
import { BOOK_ABBREV_KO } from '../../pages/Bible/components/bibleBookAbbrev'

export interface SummaryNote {
  /** "3-4절" · "5-7·9절" */
  range: string | null
  /** 본문에 ★ 로 표시된 핵심 구간 */
  key: boolean
  /** 본문을 풀어 쓴 인용 */
  quote: string
  /** 풀이 — "…을 보이고, …" 를 문장 단위로 가른 것 */
  points: string[]
  /** 풀이 안 괄호에서 꺼낸 참조 구절 ("창 25:28") */
  refs: string[]
}

export interface ParsedSummary {
  notes: SummaryNote[]
  /** `> 인용`으로 적힌 적용 질문 */
  application: string | null
}

const BOOKS = Object.values(BOOK_ABBREV_KO)
  .sort((a, b) => b.length - a.length)
  .join('|')

/**
 * 괄호 안의 구절 표기 — "약 1:15" · "25:28" · "36장" · "빌 2:7-8".
 * 책 약칭은 앞 글자가 한글이 아닐 때만 인정한다("후에 42:6"의 '에'를 에스더로 읽지 않게).
 */
const REF = new RegExp(
  `(?:(?<![가-힣])(${BOOKS})\\s?)?(\\d+:\\d+(?:[-~]\\d+)?|\\d+장)`,
  'g',
)

/** 구절을 걷어낸 뒤 괄호에 남아도 뜻이 없는 이음말 */
const REF_FILLER = /후에|성취|처럼|이하|참조|참고|등/g

/** 덧말로 남길 만한 최소 길이 — 이보다 짧으면 구절 표기의 부스러기다 */
const GLOSS_MIN = 6
/** 문장을 갈랐을 때 한 조각의 최소 길이 — 이보다 짧으면 가르지 않는다 */
const POINT_MIN = 12

/** '인용'는 것은, 풀이(절 범위) */
const SEGMENT = /^(?:[-*]\s+)?['‘]([^]+?)['’]\s?(?:는 것은|함은|은|는),\s*([^]+)$/

/** 끝에 붙은 "(3-4절)" · "(1절·요 10:11·빌 4:19)" */
const TRAILER = /\(([^()]*\d\s?절[^()]*)\)\s*\.?\s*$/

const squeeze = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    // 괄호를 걷어낸 자리의 " ." 만 붙인다 — 인용의 줄임표(" ... ")는 건드리지 않는다
    .replace(/\s+\.(?!\.)/g, '.')
    .trim()

const withBook = (book: string | undefined, rest: string, ownBook: string) =>
  `${book ?? ownBook} ${rest}`

/** 풀이 속 괄호에서 참조 구절을 꺼내고, 본문에는 덧말만 남긴다 */
const liftRefs = (text: string, ownBook: string): { text: string; refs: string[] } => {
  const refs: string[] = []
  const out = text.replace(/\(([^()]*)\)/g, (whole, inner: string) => {
    const found = [...inner.matchAll(REF)]
    if (found.length === 0) return whole
    found.forEach((m) => refs.push(withBook(m[1], m[2], ownBook)))
    const gloss = inner
      .replace(REF, '')
      .replace(REF_FILLER, '')
      .replace(/[·,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return gloss.length >= GLOSS_MIN ? `(${gloss})` : ''
  })
  return { text: squeeze(out), refs }
}

/** "…을 보이고, …을 보입니다" → 문장 둘. 말은 바꾸지 않고 이음 어미만 맺음 어미로 돌린다 */
const splitPoints = (text: string): string[] => {
  const parts = text
    .replace(/([을를])\s보(?:이고|이며|이되),\s+/g, '$1 보입니다.\n')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
  const safe = parts.every((p) => p.length >= POINT_MIN) ? parts : [text.trim()]
  return safe.map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
}

/** 꼬리 괄호를 절 범위와 참조 구절로 나눈다 — "1절·요 10:11" → ["1절", ["요 10:11"]] */
const splitTrailer = (inner: string, ownBook: string): { range: string; refs: string[] } => {
  const cut = inner.lastIndexOf('절')
  const range = inner.slice(0, cut + 1).trim()
  const refs = [...inner.slice(cut + 1).matchAll(REF)].map((m) => withBook(m[1], m[2], ownBook))
  return { range, refs }
}

const toNote = (block: string, ownBook: string): SummaryNote | null => {
  const m = block.match(SEGMENT)
  if (!m) return null

  const rawQuote = m[1]
  let body = m[2].trim()

  let range: string | null = null
  const tailRefs: string[] = []
  const trailer = body.match(TRAILER)
  if (trailer) {
    const split = splitTrailer(trailer[1], ownBook)
    range = split.range
    tailRefs.push(...split.refs)
    body = body.slice(0, trailer.index).trim()
  }

  const lifted = liftRefs(body, ownBook)
  if (lifted.text.length < POINT_MIN) return null

  return {
    range,
    key: rawQuote.includes('★'),
    quote: squeeze(rawQuote.replace(/★/g, '')),
    points: splitPoints(lifted.text),
    refs: [...new Set([...lifted.refs, ...tailRefs])],
  }
}

/**
 * @param raw         저장된 마크다운 본문
 * @param bookNumber  이 해석이 달린 책 — "25:28"처럼 책 이름 없는 구절의 주인
 * @returns 형식이 맞지 않으면 null (호출부가 예전 지면으로 그린다)
 */
export const parseSummaryNotes = (raw: string, bookNumber: number): ParsedSummary | null => {
  const ownBook = BOOK_ABBREV_KO[bookNumber] ?? ''
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .replace(/^\s*#{1,6}[ \t]+.*\n+/, '')
    .split(/\n{2,}/)
    // 불릿을 빈 줄 없이 이어 쓴 형식도 한 줄이 한 덩어리다
    .flatMap((p) => p.split(/\n(?=[-*]\s)/))
    .map((p) => p.trim())
    .filter(Boolean)

  let application: string | null = null
  if (blocks.length > 1 && blocks[blocks.length - 1].startsWith('>')) {
    application = blocks
      .pop()!
      .split('\n')
      .map((line) => line.replace(/^>\s?/, '').trim())
      .join(' ')
      .replace(/\*\*/g, '')
      .trim()
  }

  // 맨 앞의 "**본문**(1절) **본문**(2절)…" 은 성경 본문 재인용 — 화면이 실제 본문을 따로 띄운다
  if (blocks.length > 1 && blocks[0].startsWith('**')) blocks.shift()

  const notes: SummaryNote[] = []
  for (const block of blocks) {
    const note = toNote(block, ownBook)
    if (!note) return null
    notes.push(note)
  }
  return notes.length > 0 ? { notes, application } : null
}
