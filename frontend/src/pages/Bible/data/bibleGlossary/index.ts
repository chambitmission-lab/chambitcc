// 성경 사전(인물·지명·칭호·용어) — 본문 위 인라인 칩의 데이터와 매칭 엔진.
// 단어장(사용자 수집형)과 반대 방향의, 미리 깔려 있는 초심자용 사전이다.
//
// 한국어 매칭의 함정 두 가지를 여기서 처리한다:
// 1. 오탐 — "바로"(부사), "만나"(동사), "누가"(의문사) 같은 동음이의어는
//    requireParticle 로 조사가 붙은 형태("바로가", "만나를")만 매칭한다.
// 2. 조사 — 이름 뒤에 붙는 조사는 화이트리스트로만 인정한다. 목록에 없는
//    꼬리는 다른 단어("바로잡다", "함께")로 보고 버린다. 누락은 칩이 안 달릴
//    뿐이지만 오탐은 신뢰를 깎으므로, 화이트리스트 철학을 유지할 것.
// 3. 활용형 — "긍휼히", "강퍅하게", "경외하는"처럼 어미가 붙는 말은 조사
//    화이트리스트로 잡을 수 없다. 이런 표제어는 stems 에 어간을 적으면
//    어간 뒤 한글 꼬리를 통째로 인정하고, 밑줄도 낱말 전체("긍휼히")에 긋는다.
//    어간은 다른 낱말의 머리가 될 수 없는 것만 넣을 것("거하"는 되지만 "거"는 안 됨).

export type GlossaryType = 'person' | 'place' | 'title' | 'term' | 'archaic' | 'loanword'

export interface GlossaryEntry {
  /** 표제어 — 개역개정 본문 표기 */
  name: string
  /** 같은 대상의 다른 표기(아브람, 사래 등) — 매칭에 함께 쓴다 */
  alt?: string[]
  /** 활용 어간 — 이 뒤에는 어떤 한글 꼬리든 인정 (name/alt 와 달리 조사 검사 없음) */
  stems?: string[]
  type: GlossaryType
  /** 한 줄 설명 (존댓말, ~50자) */
  desc: string
  /** 대표 구절 — "창세기 12:15" 표시용 문자열 */
  first: string
  /** 이 책 번호들에서만 칩을 단다 (생략 = 전 책) — 동명이인·오탐 방지용 */
  books?: number[]
  /** true 면 조사가 붙은 형태만 매칭 (단독 표기는 동음이의어 위험) */
  requireParticle?: boolean
  /**
   * true 면 본문 인라인 칩은 달지 않고 사전 조회(참비·검색 탭·⌘K)에만 쓴다.
   * "죄", "교회", "믿음"처럼 본문에 너무 흔하거나 일반어와 겹치는 핵심 개념어용.
   */
  chipless?: boolean
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
  '에는', '에도', '에나', '에서는', '에서도', '에게는', '와는', '과는',
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
interface FormTarget {
  entry: GlossaryEntry
  /** true 면 어간 매칭 — 뒤따르는 한글 꼬리를 검사 없이 통째로 인정 */
  stem: boolean
}

interface BookMatcher {
  regex: RegExp
  byForm: Map<string, FormTarget>
}

const matcherCache = new Map<number, BookMatcher | null>()

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getBookMatcher = (bookNumber: number): BookMatcher | null => {
  if (matcherCache.has(bookNumber)) return matcherCache.get(bookNumber)!
  if (!entries) return null
  const byForm = new Map<string, FormTarget>()
  for (const entry of entries) {
    if (entry.chipless) continue
    if (entry.books && !entry.books.includes(bookNumber)) continue
    // 어간을 먼저 등록 — name 과 같은 철자("긍휼")면 어간 매칭이 이겨야 "긍휼히"가 잡힌다
    for (const form of entry.stems ?? []) {
      if (!byForm.has(form)) byForm.set(form, { entry, stem: true })
    }
    for (const form of [entry.name, ...(entry.alt ?? [])]) {
      if (!byForm.has(form)) byForm.set(form, { entry, stem: false })
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
    const target = matcher.byForm.get(m[0])
    if (!target) continue
    const { entry, stem } = target
    // 뒤따르는 한글 꼬리(조사·어미 후보) 수집
    let tailEnd = end
    while (tailEnd < text.length && HANGUL.test(text[tailEnd])) tailEnd++
    if (stem) {
      // 어간 매칭 — "긍휼히", "거하시는" 낱말 전체에 밑줄
      out.push({ start, end: tailEnd, entry })
    } else {
      if (!isParticleTail(text.slice(end, tailEnd), !!entry.requireParticle)) continue
      out.push({ start, end, entry })
    }
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


// ── 사전 조회 (참비 로컬 응답·검색 탭 정의 카드·⌘K 행) ─────────────
// 본문 칩 매칭(matchGlossary)과 달리 사용자가 직접 친 낱말을 찾는다.
// 표제어·별칭을 공백 제거·소문자로 정규화해 비교한다. entries 가 아직 안 내려왔으면
// null/[] — 호출 쪽에서 loadGlossary() 를 먼저 기다릴 것.

const normalizeTerm = (s: string) => s.replace(/\s+/g, '').toLowerCase()

let lookupIndex: Map<string, GlossaryEntry> | null = null

const getLookupIndex = (): Map<string, GlossaryEntry> | null => {
  if (lookupIndex) return lookupIndex
  if (!entries) return null
  const idx = new Map<string, GlossaryEntry>()
  for (const entry of entries) {
    // 대표 표기가 별칭보다 우선 — 같은 철자가 두 항목에 있으면 먼저 등록된(앞선) 항목이 이긴다
    for (const form of [entry.name, ...(entry.alt ?? [])]) {
      const key = normalizeTerm(form)
      if (!idx.has(key)) idx.set(key, entry)
    }
  }
  lookupIndex = idx
  return idx
}

/** 표제어·별칭과 정확히 일치하는 항목 (없으면 null) */
export const findGlossaryEntry = (term: string): GlossaryEntry | null => {
  const idx = getLookupIndex()
  if (!idx) return null
  const key = normalizeTerm(term)
  if (!key) return null
  return idx.get(key) ?? null
}

/**
 * 타이핑 중 제안용 — 앞글자 일치를 먼저, 그다음 포함 일치. 정확히 일치하는 항목이 맨 앞.
 * 1글자 질의는 앞글자 일치만 본다("죄"로 "속죄"까지 끌려오지 않게).
 */
export const searchGlossary = (query: string, limit = 4): GlossaryEntry[] => {
  if (!entries) return []
  const q = normalizeTerm(query)
  if (!q) return []
  const exact: GlossaryEntry[] = []
  const prefix: GlossaryEntry[] = []
  const contains: GlossaryEntry[] = []
  const seen = new Set<GlossaryEntry>()
  for (const entry of entries) {
    if (seen.has(entry)) continue
    const forms = [entry.name, ...(entry.alt ?? [])].map(normalizeTerm)
    if (forms.includes(q)) { exact.push(entry); seen.add(entry); continue }
    if (forms.some((f) => f.startsWith(q))) { prefix.push(entry); seen.add(entry); continue }
    if (q.length >= 2 && forms.some((f) => f.includes(q))) { contains.push(entry); seen.add(entry) }
  }
  // 앞글자 일치는 짧은 표제어부터 — "예"에 예레미야보다 예수·예배가 먼저
  prefix.sort((a, b) => a.name.length - b.name.length)
  return [...exact, ...prefix, ...contains].slice(0, limit)
}

/** 사전 표제어 수 — 안내 문구용 */
export const glossarySize = () => entries?.length ?? 0

/** 시트에 보여줄 구분 라벨 */
export const GLOSSARY_TYPE_LABEL: Record<GlossaryType, string> = {
  person: '인물',
  place: '지명',
  title: '칭호·직분',
  term: '용어',
  archaic: '어려운 말',
  loanword: '원어 그대로',
}
