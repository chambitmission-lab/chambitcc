// 설교 목록 화면용 메타 유틸 — 성구 참조 파싱 · 예배 유형 유추 · 월별 그룹핑
import type { Sermon } from '../../../types/sermon'

export interface ParsedReference {
  /* 표시용 책 이름 — 번호 해석에 성공하면 정식 명칭("삿"→"사사기"), 실패하면 입력 그대로 */
  book: string
  /* 성경 API용 책 번호(1~66). 백엔드 /bible/verse는 책 이름이 아니라 번호만
   * 받으므로, null이면 미리보기 조회를 걸 수 없다(모르는 책 이름). */
  bookNumber: number | null
  chapter: number
  verse: number | null
  verseEnd: number | null
}

/* 한글 책 이름 → 책 번호. 정식 명칭(개역) + 통용 약칭을 함께 둔다.
 * 조회는 공백 제거 후 비교라 "사무엘 상"도 "사무엘상"으로 잡힌다. */
const BIBLE_BOOKS: ReadonlyArray<[number, string, ...string[]]> = [
  [1, '창세기', '창'],
  [2, '출애굽기', '출'],
  [3, '레위기', '레'],
  [4, '민수기', '민'],
  [5, '신명기', '신'],
  [6, '여호수아', '수'],
  [7, '사사기', '삿'],
  [8, '룻기', '룻'],
  [9, '사무엘상', '삼상'],
  [10, '사무엘하', '삼하'],
  [11, '열왕기상', '왕상'],
  [12, '열왕기하', '왕하'],
  [13, '역대상', '역대기상', '대상'],
  [14, '역대하', '역대기하', '대하'],
  [15, '에스라', '스'],
  [16, '느헤미야', '느'],
  [17, '에스더', '에'],
  [18, '욥기', '욥'],
  [19, '시편', '시'],
  [20, '잠언', '잠'],
  [21, '전도서', '전'],
  [22, '아가', '아'],
  [23, '이사야', '사'],
  [24, '예레미야', '렘'],
  [25, '예레미야애가', '애가', '애'],
  [26, '에스겔', '겔'],
  [27, '다니엘', '단'],
  [28, '호세아', '호'],
  [29, '요엘', '욜'],
  [30, '아모스', '암'],
  [31, '오바댜', '옵'],
  [32, '요나', '욘'],
  [33, '미가', '미'],
  [34, '나훔', '나'],
  [35, '하박국', '합'],
  [36, '스바냐', '습'],
  [37, '학개', '학'],
  [38, '스가랴', '슥'],
  [39, '말라기', '말'],
  [40, '마태복음', '마태', '마'],
  [41, '마가복음', '마가', '막'],
  [42, '누가복음', '누가', '눅'],
  [43, '요한복음', '요'],
  [44, '사도행전', '행전', '행'],
  [45, '로마서', '롬'],
  [46, '고린도전서', '고전'],
  [47, '고린도후서', '고후'],
  [48, '갈라디아서', '갈'],
  [49, '에베소서', '엡'],
  [50, '빌립보서', '빌'],
  [51, '골로새서', '골'],
  [52, '데살로니가전서', '살전'],
  [53, '데살로니가후서', '살후'],
  [54, '디모데전서', '딤전'],
  [55, '디모데후서', '딤후'],
  [56, '디도서', '딛'],
  [57, '빌레몬서', '몬'],
  [58, '히브리서', '히'],
  [59, '야고보서', '약'],
  [60, '베드로전서', '벧전'],
  [61, '베드로후서', '벧후'],
  [62, '요한일서', '요한1서', '요일'],
  [63, '요한이서', '요한2서', '요이'],
  [64, '요한삼서', '요한3서', '요삼'],
  [65, '유다서', '유'],
  [66, '요한계시록', '계시록', '계'],
]

const BOOK_NUMBER_BY_NAME: ReadonlyMap<string, number> = new Map(
  BIBLE_BOOKS.flatMap(([num, ...names]) => names.map((name) => [name, num] as const)),
)

const CANONICAL_BOOK_NAME: ReadonlyMap<number, string> = new Map(
  BIBLE_BOOKS.map(([num, name]) => [num, name]),
)

export const resolveBookNumber = (name: string): number | null =>
  BOOK_NUMBER_BY_NAME.get(name.replace(/\s+/g, '')) ?? null

/* 책 이름만(또는 "창세기 1"처럼 장 표기 없이) 입력한 경우 — ⌘K 팔레트용.
 * 정식 명칭·약칭의 앞부분 일치로 후보 책을 찾고, 뒤에 숫자가 붙으면 장으로 본다. */
export interface BookMatch { bookNumber: number; book: string; chapter: number | null }
export const matchBibleBooks = (raw: string, limit = 4): BookMatch[] => {
  const m = raw.trim().match(/^([^\d\s][^\d]*?)\s*(\d+)?\s*$/)
  if (!m) return []
  const q = m[1].replace(/\s+/g, '')
  if (!q) return []
  const chapter = m[2] ? parseInt(m[2], 10) || null : null
  const seen = new Set<number>()
  const out: BookMatch[] = []
  for (const [num, ...names] of BIBLE_BOOKS) {
    if (seen.has(num)) continue
    if (names.some((n) => n.startsWith(q) || (q.length >= 2 && n.includes(q)))) {
      seen.add(num)
      out.push({ bookNumber: num, book: names[0], chapter })
      if (out.length >= limit) break
    }
  }
  return out
}

// "요한복음 12장 20~33절" / "요한복음 3:16" / "요한1서 2장" 등을 허용.
// 장 번호 뒤에 반드시 '장' 또는 ':'가 와야 "요한1서" 같은 책 이름의 숫자를 장으로 오인하지 않는다.
const REFERENCE_RE = /^(.+?)\s*(\d+)\s*(?:장|:)\s*(\d+)?(?:\s*[~\-–—〜]\s*(\d+))?\s*절?/

export const parseBibleReference = (raw: string): ParsedReference | null => {
  if (!raw) return null
  const match = raw.trim().match(REFERENCE_RE)
  if (!match) return null

  const book = match[1].trim()
  const chapter = parseInt(match[2], 10)
  if (!book || !chapter) return null

  const bookNumber = resolveBookNumber(book)
  return {
    /* 약칭으로 입력해도 표시는 정식 명칭으로 정돈한다 */
    book: bookNumber ? CANONICAL_BOOK_NAME.get(bookNumber)! : book,
    bookNumber,
    chapter,
    verse: match[3] ? parseInt(match[3], 10) : null,
    verseEnd: match[4] ? parseInt(match[4], 10) : null,
  }
}

// "요한복음 12:20–33" 형태로 정돈된 참조 문자열
export const formatReference = (parsed: ParsedReference): string => {
  const { book, chapter, verse, verseEnd } = parsed
  if (verse == null) return `${book} ${chapter}장`
  if (verseEnd == null) return `${book} ${chapter}:${verse}`
  return `${book} ${chapter}:${verse}–${verseEnd}`
}

/* 예배 날짜 표기 — 주일 예배 중심 앱이라 일요일은 '주일'로 부른다.
 * ("8월 9일 일"처럼 '일'이 두 번 이어지는 스터터도 함께 사라진다.)
 * 올해 날짜는 연도를 생략해 히어로·상세가 담백하게 읽힌다. */
export const formatSermonDate = (dateString: string): string => {
  const d = new Date(dateString)
  const weekday =
    d.getDay() === 0 ? '주일' : d.toLocaleDateString('ko-KR', { weekday: 'long' })
  const year =
    d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}년 `
  return `${year}${d.getMonth() + 1}월 ${d.getDate()}일 ${weekday}`
}

/* 지난 말씀 행처럼 좁은 자리용 성구 표기 — 파싱되면 "요한복음 12:20–33"으로
 * 정돈해 어중간한 말줄임("...20~3")을 피한다. 여러 본문이 이어진 입력(콤마 등)은
 * 첫 구절만 남기면 왜곡이라 원문 그대로 둔다. */
export const compactReference = (raw: string): string => {
  if (/[,;/]/.test(raw)) return raw
  const parsed = parseBibleReference(raw)
  return parsed ? formatReference(parsed) : raw
}

// 예배 유형은 별도 필드가 없어 제목 관례에서 유추한다 (기존 데이터에도 소급 적용)
export const WORSHIP_TYPES = ['주일예배', '수요예배', '새벽기도', '금요기도', '특별예배'] as const
export type WorshipType = (typeof WORSHIP_TYPES)[number]

export const deriveWorshipType = (title: string): WorshipType => {
  if (/주일|성수/.test(title)) return '주일예배'
  if (/수요/.test(title)) return '수요예배'
  if (/새벽/.test(title)) return '새벽기도'
  if (/금요|철야/.test(title)) return '금요기도'
  return '특별예배'
}

// 제목 끝의 "(3월 15일)" 류 날짜 꼬리표 제거 — 날짜는 날짜 칩이 담당
export const stripTitleDate = (title: string): string =>
  title.replace(/\s*[(（]\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*[)）]\s*$/, '').trim()

// YouTube URL/ID에서 video ID 추출 — 상세·폼에서 공용
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // 직접 Video ID인 경우
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }

  return null
}

export const youtubeThumbnailUrl = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

export interface SermonMonthGroup {
  key: string
  label: string
  items: Sermon[]
}

export const groupSermonsByMonth = (sermons: Sermon[]): SermonMonthGroup[] => {
  const groups: SermonMonthGroup[] = []
  let current: SermonMonthGroup | null = null

  for (const sermon of sermons) {
    const date = new Date(sermon.sermon_date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!current || current.key !== key) {
      current = {
        key,
        label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
        items: [],
      }
      groups.push(current)
    }
    current.items.push(sermon)
  }

  return groups
}
