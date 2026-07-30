/**
 * 읽기 진행률 파생 계산 — 책 카드/분류 칩/성경 지도가 공유한다.
 *
 * 표기 원칙: 화면의 숫자는 모두 "실제로 읽은 양"(장 기준 완독)을 가리킨다.
 * 이어 읽기 위치(마지막으로 펼친 장)는 진행률과 의미가 다르므로 숫자로 섞지 않고,
 * 게이지 위의 위치 마커로만 표현한다. (예: 40장으로 점프해 한 장만 읽었다면
 * 위치는 뒤쪽이지만 진행률은 낮다 — 두 값을 같은 자리에 쓰면 버그로 보인다)
 */
import type { BibleBook } from '../../../types/bible'
import type { ReadingProgressResponse } from '../../../api/bibleReading'

export interface BookReadInfo {
  /** 완독한 장 수. null = 백엔드가 아직 장 집계를 주지 않음(구버전 응답) */
  readChapters: number | null
  totalChapters: number
  /** 카드·지도의 대표 진행률(%). 장 집계가 있으면 장 기준, 없으면 절 기준으로 폴백 */
  rate: number
  readVerses: number
  totalVerses: number
}

/** key: book_number (백엔드 books[].book_id 는 book_number 와 같은 값이다) */
export type BookInfoMap = Map<number, BookReadInfo>

const clampPct = (n: number) => Math.max(0, Math.min(100, n))

export const buildBookInfoMap = (
  books: BibleBook[] | undefined,
  progress: ReadingProgressResponse['data'] | undefined
): BookInfoMap => {
  const map: BookInfoMap = new Map()
  if (!books) return map

  const byNumber = new Map(progress?.books?.map(b => [b.book_id, b]) ?? [])

  books.forEach(book => {
    const p = byNumber.get(book.book_number)
    const totalChapters = p?.total_chapters || book.chapter_count || 0
    const readChapters = typeof p?.read_chapters === 'number' ? p.read_chapters : null
    const verseRate = p?.progress_rate ?? 0

    // 장 기준을 우선하되, 절은 읽었지만 완독한 장이 아직 없는 경우(0장)에는
    // 절 기준 진행률을 보여 "시작했다"는 사실이 사라지지 않게 한다.
    let rate = verseRate
    if (readChapters !== null && totalChapters > 0) {
      const chapterRate = p?.chapter_progress_rate ?? (readChapters / totalChapters) * 100
      rate = readChapters > 0 ? chapterRate : verseRate
    }

    map.set(book.book_number, {
      readChapters,
      totalChapters,
      rate: clampPct(rate),
      readVerses: p?.read_verses ?? 0,
      totalVerses: p?.total_verses ?? 0,
    })
  })

  return map
}

export interface RangeAggregate {
  readChapters: number
  totalChapters: number
  readVerses: number
  totalVerses: number
  /** 대표 진행률(%) — 장 집계가 있으면 장 기준, 없으면 절 기준 */
  rate: number
  hasChapterData: boolean
}

/**
 * book_number 범위(모세오경·역사서 등)의 합산 진행률.
 * "어느 분류를 덜 읽었나"를 한 줄로 보여주는 칩 라벨에 쓴다.
 */
export const aggregateRange = (
  books: BibleBook[] | undefined,
  infoMap: BookInfoMap,
  min: number,
  max: number
): RangeAggregate => {
  let readChapters = 0
  let totalChapters = 0
  let readVerses = 0
  let totalVerses = 0
  let hasChapterData = false

  ;(books ?? []).forEach(book => {
    if (book.book_number < min || book.book_number > max) return
    const info = infoMap.get(book.book_number)
    if (!info) return
    totalChapters += info.totalChapters
    readVerses += info.readVerses
    totalVerses += info.totalVerses
    if (info.readChapters !== null) {
      hasChapterData = true
      readChapters += info.readChapters
    }
  })

  const rate = hasChapterData
    ? (totalChapters > 0 ? (readChapters / totalChapters) * 100 : 0)
    : (totalVerses > 0 ? (readVerses / totalVerses) * 100 : 0)

  return {
    readChapters,
    totalChapters,
    readVerses,
    totalVerses,
    rate: clampPct(rate),
    hasChapterData,
  }
}

/** 히트맵 색 농도 단계 — 0(안 읽음) ~ 4(완독) */
export const progressLevel = (rate: number): 0 | 1 | 2 | 3 | 4 => {
  if (rate <= 0) return 0
  if (rate >= 100) return 4
  if (rate < 34) return 1
  if (rate < 67) return 2
  return 3
}
