// 성경 사전(인물·지명·칭호·용어) — 본문 위 인라인 칩의 데이터와 매칭 엔진.
// 단어장(사용자 수집형)과 반대 방향의, 미리 깔려 있는 초심자용 사전이다.
//
// 한국어 매칭의 함정 두 가지를 여기서 처리한다:
// 1. 오탐 — "바로"(부사), "만나"(동사), "누가"(의문사) 같은 동음이의어는
//    requireParticle 로 조사가 붙은 형태("바로가", "만나를")만 매칭한다.
// 2. 조사 — 이름 뒤에 붙는 조사는 화이트리스트로만 인정한다. 목록에 없는
//    꼬리는 다른 단어("바로잡다", "함께")로 보고 버린다. 누락은 칩이 안 달릴
//    뿐이지만 오탐은 신뢰를 깎으므로, 화이트리스트 철학을 유지할 것.

export type GlossaryType = 'person' | 'place' | 'title' | 'term'

export interface GlossaryEntry {
  /** 표제어 — 개역개정 본문 표기 */
  name: string
  /** 같은 대상의 다른 표기(아브람, 사래 등) — 매칭에 함께 쓴다 */
  alt?: string[]
  type: GlossaryType
  /** 한 줄 설명 (존댓말, ~50자) */
  desc: string
  /** 대표 구절 — "창세기 12:15" 표시용 문자열 */
  first: string
  /** 이 책 번호들에서만 칩을 단다 (생략 = 전 책) — 동명이인·오탐 방지용 */
  books?: number[]
  /** true 면 조사가 붙은 형태만 매칭 (단독 표기는 동음이의어 위험) */
  requireParticle?: boolean
}

export interface GlossaryMatch {
  start: number
  end: number
  entry: GlossaryEntry
}

// ── 켜기/끄기 설정 (읽기 설정 Aa 패널에서 토글, 기기별 저장) ─────────
const ENABLED_KEY = 'bible-glossary-chips'
let enabledCache: boolean | null = null
const enabledListeners = new Set<() => void>()

export const isGlossaryEnabled = (): boolean => {
  if (enabledCache === null) {
    try {
      enabledCache = localStorage.getItem(ENABLED_KEY) !== '0'
    } catch {
      enabledCache = true
    }
  }
  return enabledCache
}

export const setGlossaryEnabled = (value: boolean) => {
  enabledCache = value
  try {
    localStorage.setItem(ENABLED_KEY, value ? '1' : '0')
  } catch {
    /* noop */
  }
  enabledListeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 — 토글 즉시 열린 본문의 칩이 나타나고 사라진다 */
export const subscribeGlossaryEnabled = (fn: () => void): (() => void) => {
  enabledListeners.add(fn)
  return () => enabledListeners.delete(fn)
}

// ── 로딩 (entries 는 코드 분할 — 읽기 화면에서 처음 필요할 때 내려받는다) ──
let entries: GlossaryEntry[] | null = null
let loading: Promise<void> | null = null

export const isGlossaryReady = () => entries !== null

export const loadGlossary = (): Promise<void> => {
  if (entries) return Promise.resolve()
  if (!loading) {
    loading = import('./entries').then((mod) => {
      entries = mod.default
    })
  }
  return loading
}

// ── 조사 화이트리스트 ─────────────────────────────────────────────
const PARTICLES = new Set([
  '이', '가', '은', '는', '을', '를', '과', '와', '의', '도', '만',
  '에', '에서', '에게', '에게서', '에게로', '께', '께서', '로', '으로',
  '부터', '까지', '보다', '처럼', '같이', '조차', '마다',
  '이나', '나', '이며', '며', '이요', '요', '이라', '라', '이란',
  '아', '야', '이여', '여', '이든지', '든지', '이라도', '라도',
  '에는', '에도', '에서는', '에서도', '에게는', '와는', '과는',
  '로는', '로도', '으로는', '으로도', '까지도', '만이', '밖에',
])

const isParticleTail = (tail: string, requireParticle: boolean): boolean => {
  if (tail === '') return !requireParticle
  let rest = tail
  // 복수 접미 "들" — "바리새인들이" 같은 형태
  if (rest.startsWith('들')) {
    rest = rest.slice(1)
    if (rest === '') return true
  }
  return PARTICLES.has(rest)
}

// ── 책별 매처 (정규식은 책마다 한 번만 조립해 캐시) ────────────────
interface BookMatcher {
  regex: RegExp
  byForm: Map<string, GlossaryEntry>
}

const matcherCache = new Map<number, BookMatcher | null>()

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getBookMatcher = (bookNumber: number): BookMatcher | null => {
  if (matcherCache.has(bookNumber)) return matcherCache.get(bookNumber)!
  if (!entries) return null
  const byForm = new Map<string, GlossaryEntry>()
  for (const entry of entries) {
    if (entry.books && !entry.books.includes(bookNumber)) continue
    for (const form of [entry.name, ...(entry.alt ?? [])]) {
      if (!byForm.has(form)) byForm.set(form, entry)
    }
  }
  if (byForm.size === 0) {
    matcherCache.set(bookNumber, null)
    return null
  }
  // 긴 표기가 먼저 매칭되도록(가이사랴 > 가이사) 길이 내림차순으로 조립
  const forms = [...byForm.keys()].sort((a, b) => b.length - a.length)
  const matcher: BookMatcher = {
    regex: new RegExp(forms.map(escapeRegex).join('|'), 'g'),
    byForm,
  }
  matcherCache.set(bookNumber, matcher)
  return matcher
}

const HANGUL = /[가-힣]/

/** 절 텍스트에서 사전 표제어 매칭 — 단어 시작 경계 + 조사 검증을 통과한 것만 */
export const matchGlossary = (bookNumber: number, text: string): GlossaryMatch[] => {
  const matcher = getBookMatcher(bookNumber)
  if (!matcher || !text) return []
  const out: GlossaryMatch[] = []
  matcher.regex.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = matcher.regex.exec(text))) {
    const start = m.index
    const end = start + m[0].length
    // 단어 시작 경계 — 앞 글자가 한글이면 다른 단어의 일부("실롯" 속 "롯")
    if (start > 0 && HANGUL.test(text[start - 1])) continue
    const entry = matcher.byForm.get(m[0])
    if (!entry) continue
    // 뒤따르는 한글 꼬리(조사 후보) 수집
    let tailEnd = end
    while (tailEnd < text.length && HANGUL.test(text[tailEnd])) tailEnd++
    if (!isParticleTail(text.slice(end, tailEnd), !!entry.requireParticle)) continue
    out.push({ start, end, entry })
    matcher.regex.lastIndex = tailEnd
  }
  return out
}

// ── 장당 첫 등장 1회 — 칩이 본문을 뒤덮지 않게 ─────────────────────
// 같은 장을 다시 렌더해도 같은 절이 소유권을 유지하도록 이름→절 번호를 기억한다.
let registryKey = ''
let claims = new Map<string, number>()

export const claimFirstMention = (
  bookNumber: number,
  chapter: number,
  name: string,
  verse: number
): boolean => {
  const key = `${bookNumber}:${chapter}`
  if (key !== registryKey) {
    registryKey = key
    claims = new Map()
  }
  const holder = claims.get(name)
  if (holder === undefined) {
    claims.set(name, verse)
    return true
  }
  return holder === verse
}

/** 시트에 보여줄 구분 라벨 */
export const GLOSSARY_TYPE_LABEL: Record<GlossaryType, string> = {
  person: '인물',
  place: '지명',
  title: '칭호·직분',
  term: '용어',
}
