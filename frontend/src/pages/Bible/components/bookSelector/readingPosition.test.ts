import { describe, expect, it } from 'vitest'
import type { BibleBook } from '../../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../../api/bibleReading'
import type { BookInfoMap } from '../readingProgressInfo'
import {
  buildSummaryStats,
  cheerKeyFor,
  findCurrentBookNumber,
  findNextBookNumber,
  pickAutoTestament,
  pickDoneSide,
  splitLastWord,
} from './readingPosition'

const book = (n: number): BibleBook => ({
  id: n,
  book_name_ko: `책${n}`,
  book_name_en: `Book${n}`,
  testament: n >= 40 ? 'NEW' : 'OLD',
  book_number: n,
  chapter_count: 10,
})

const books = [1, 2, 3, 4, 5].map(book)

const resume = (entries: Record<number, string>) =>
  new Map<number, ResumePosition>(
    Object.entries(entries).map(([n, readAt]) => [
      Number(n),
      { book_number: Number(n), book_name_ko: '', chapter: 1, verse: 1, verse_id: 1, text: '', read_at: readAt },
    ]),
  )

/** 권 번호 → 진행률(%) */
const rates = (entries: Record<number, number>): BookInfoMap =>
  new Map(
    Object.entries(entries).map(([n, rate]) => [
      Number(n),
      { readChapters: null, totalChapters: 10, rate, readVerses: 0, totalVerses: 0 },
    ]),
  )

describe('findCurrentBookNumber', () => {
  it('읽은 기록이 없으면 undefined', () => {
    expect(findCurrentBookNumber(books, undefined)).toBeUndefined()
    expect(findCurrentBookNumber(books, new Map())).toBeUndefined()
    expect(findCurrentBookNumber(undefined, resume({ 1: '2026-11-01T00:00:00' }))).toBeUndefined()
  })

  it('가장 최근에 펼친 책을 고른다', () => {
    const map = resume({ 1: '2026-11-01T09:00:00', 3: '2026-11-20T09:00:00', 4: '2026-11-10T09:00:00' })
    expect(findCurrentBookNumber(books, map)).toBe(3)
  })

  it('넘겨받은 목록 안에서만 고른다', () => {
    const map = resume({ 3: '2026-11-20T09:00:00', 4: '2026-11-10T09:00:00' })
    expect(findCurrentBookNumber([book(4), book(5)], map)).toBe(4)
  })

  it('같은 시각이면 목록에서 앞선 책', () => {
    const map = resume({ 2: '2026-11-20T09:00:00', 4: '2026-11-20T09:00:00' })
    expect(findCurrentBookNumber(books, map)).toBe(2)
  })
})

describe('findNextBookNumber — 여정(옵션 없음)', () => {
  it('읽은 기록이 없으면 첫 미완독 책', () => {
    expect(findNextBookNumber(books, rates({ 1: 100 }), undefined)).toBe(2)
  })

  it('지금 읽는 책이 미완독이어도 그 뒤의 첫 미완독 책을 짚는다', () => {
    expect(findNextBookNumber(books, rates({ 2: 30, 3: 100 }), 2)).toBe(4)
  })

  it('지금 읽는 책이 마지막이면 없다', () => {
    expect(findNextBookNumber(books, rates({}), 5)).toBeUndefined()
  })

  it('지금 읽는 책이 목록에 없으면 없다', () => {
    expect(findNextBookNumber(books, rates({}), 40)).toBeUndefined()
  })
})

describe('findNextBookNumber — 격자·목록(두 옵션 켬)', () => {
  const opts = { skipWhileReading: true, startOverWhenAbsent: true }

  it('지금 읽는 책이 미완독이면 다음을 짚지 않는다', () => {
    expect(findNextBookNumber(books, rates({ 2: 30 }), 2, opts)).toBeUndefined()
  })

  it('지금 읽는 책을 다 읽었으면 그 뒤의 첫 미완독 책', () => {
    expect(findNextBookNumber(books, rates({ 2: 100, 3: 100 }), 2, opts)).toBe(4)
  })

  it('지금 읽는 책이 목록에 없으면 목록의 첫 미완독 책', () => {
    expect(findNextBookNumber(books, rates({ 1: 100 }), 40, opts)).toBe(2)
  })

  it('전부 완독이면 없다', () => {
    expect(findNextBookNumber(books, rates({ 1: 100, 2: 100, 3: 100, 4: 100, 5: 100 }), 5, opts)).toBeUndefined()
  })
})

describe('pickAutoTestament', () => {
  it('읽은 기록이 없으면 구약', () => {
    expect(pickAutoTestament(undefined, false, false)).toBe('OT')
  })

  it('가장 최근에 읽은 책이 속한 쪽', () => {
    expect(pickAutoTestament(39, false, false)).toBe('OT')
    expect(pickAutoTestament(40, false, false)).toBe('NT')
  })

  it('그쪽을 다 읽고 반대쪽이 남았으면 반대쪽', () => {
    expect(pickAutoTestament(39, true, false)).toBe('NT')
    expect(pickAutoTestament(66, false, true)).toBe('OT')
    expect(pickAutoTestament(undefined, true, false)).toBe('NT')
  })

  it('둘 다 읽었으면 읽던 쪽 그대로', () => {
    expect(pickAutoTestament(66, true, true)).toBe('NT')
    expect(pickAutoTestament(1, true, true)).toBe('OT')
  })
})

describe('pickDoneSide', () => {
  it('한쪽만 다 읽었을 때만 그쪽', () => {
    expect(pickDoneSide(true, false)).toBe('OT')
    expect(pickDoneSide(false, true)).toBe('NT')
    expect(pickDoneSide(false, false)).toBeNull()
    expect(pickDoneSide(true, true)).toBeNull()
  })
})

describe('cheerKeyFor', () => {
  it('구간 경계', () => {
    expect(cheerKeyFor(0)).toBe('cheerStart')
    expect(cheerKeyFor(0.1)).toBe('cheerEarly')
    expect(cheerKeyFor(9.9)).toBe('cheerEarly')
    expect(cheerKeyFor(10)).toBe('cheerSteady')
    expect(cheerKeyFor(49.9)).toBe('cheerSteady')
    expect(cheerKeyFor(50)).toBe('cheerHalf')
    expect(cheerKeyFor(84.9)).toBe('cheerHalf')
    expect(cheerKeyFor(85)).toBe('cheerAlmost')
    expect(cheerKeyFor(99.9)).toBe('cheerAlmost')
    expect(cheerKeyFor(100)).toBe('cheerDone')
  })
})

describe('splitLastWord', () => {
  it('마지막 어절을 떼어 낸다(앞부분은 공백까지 포함)', () => {
    expect(splitLastWord('오늘 첫 장을 펼쳐볼까요?')).toEqual({ head: '오늘 첫 장을 ', tail: '펼쳐볼까요?' })
  })

  it('한 어절이면 통째로 tail', () => {
    expect(splitLastWord(' 완독 ')).toEqual({ head: '', tail: '완독' })
    expect(splitLastWord('')).toEqual({ head: '', tail: '' })
  })
})

describe('buildSummaryStats', () => {
  const labels = { whole: '전체', oldTestament: '구약', newTestament: '신약', chapterUnit: '장', verseUnit: '절' }
  type Overall = ReadingProgressResponse['data']['overall']
  const progressOf = (overall: Partial<Overall>, ot: Partial<Overall>, nt: Partial<Overall>) =>
    ({ overall, old_testament: ot, new_testament: nt }) as ReadingProgressResponse['data']

  it('진행률 원본이 없으면 빈 배열', () => {
    expect(buildSummaryStats(undefined, labels)).toEqual([])
  })

  it('장 집계가 있으면 장 기준', () => {
    const stats = buildSummaryStats(
      progressOf(
        { total_chapters: 200, read_chapters: 50, total_verses: 900, read_verses: 100, progress_rate: 11 },
        { total_chapters: 150, read_chapters: 50, total_verses: 700, read_verses: 100, progress_rate: 14 },
        { total_chapters: 50, read_chapters: 0, total_verses: 200, read_verses: 0, progress_rate: 0 },
      ),
      labels,
    )
    expect(stats.map(s => s.id)).toEqual(['all', 'ot', 'nt'])
    expect(stats[0]).toMatchObject({ label: '전체', rate: 25, read: 50, total: 200, unit: '장', detail: '50 / 200장' })
    expect(stats[1].rate).toBeCloseTo(33.33, 1)
    expect(stats[2]).toMatchObject({ label: '신약', rate: 0, read: 0, total: 50 })
  })

  it('장 집계가 없는 구버전 응답은 절 기준으로 폴백', () => {
    const verseOnly = { total_verses: 900, read_verses: 90, progress_rate: 10 }
    const [all] = buildSummaryStats(progressOf(verseOnly, verseOnly, verseOnly), labels)
    expect(all).toMatchObject({ rate: 10, read: 90, total: 900, unit: '절', detail: '90 / 900절' })
  })

  it('진행률은 0~100으로 묶는다', () => {
    const over = { total_verses: 10, read_verses: 12, progress_rate: 120 }
    const [all] = buildSummaryStats(progressOf(over, over, over), labels)
    expect(all.rate).toBe(100)
  })
})
