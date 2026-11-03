import { describe, expect, it } from 'vitest'
import type { ChurchDay } from '../../api/todayChurch'
import { buildLetter, filmDate, hourLabel, prayerMoments } from './churchLetterCopy'

const hours = (lit: Record<number, number>) => Array.from({ length: 24 }, (_, h) => lit[h] ?? 0)

const day = (over: Partial<ChurchDay> = {}): ChurchDay => ({
  date: '2026-11-02',
  hidden: false,
  metrics: {
    active_users: { value: 3, avg: 3 },
    chapters: { value: 5, avg: 16 },
    prayers: { value: 5, avg: 8 },
    typing_verses: { value: 0, avg: 2 },
    meditations: { value: 0, avg: 0 },
  },
  hours: hours({ 6: 2, 12: 1, 22: 2 }),
  top_chapters: [],
  reading_books: [
    { book_number: 1, book_name: '창세기', chapters: 4, people: null },
    { book_number: 46, book_name: '고린도전서', chapters: 1, people: null },
  ],
  emotions: [
    { emotion: 'grateful', count: 3, rising: false },
    { emotion: 'tired', count: 1, rising: true },
  ],
  ...over,
})

const text = (c: ChurchDay) => buildLetter(c).map((l) => l.map((p) => p.text).join('')).join('\n')

describe('buildLetter', () => {
  it('조용한 날은 "그래도"로 잇고 많이 읽은 책·기도 시간·무거운 마음을 적는다', () => {
    expect(text(day())).toBe(
      [
        '어제는 조금 조용한 월요일이었어요.',
        '그래도 세 분이 말씀 5장을 펼쳤어요.',
        '그중 4장은 창세기였어요.',
        '아침 6시에, 그리고 밤 10시에',
        '서로를 위한 기도가 다섯 번 올라갔어요.',
        '이번 주엔 지친 마음을 올린 분들이 있어요.',
        '오늘은 우리가 그분들 몫까지 기도해요.',
      ].join('\n'),
    )
  })

  it('감사·소망만이면 받침에 맞춰 감사로 맺는다', () => {
    expect(text(day({ emotions: [{ emotion: 'hopeful', count: 2, rising: false }] }))).toContain('소망이 가장 많이')
    expect(text(day({ emotions: [{ emotion: 'grateful', count: 2, rising: false }] }))).toContain('감사가 가장 많이')
  })

  it('숨긴 날은 숫자 없이 쉬어 간다', () => {
    const t = text(day({ hidden: true, metrics: null }))
    expect(t).toContain('숫자를 쉬어 가요')
    expect(t).not.toMatch(/\d/)
  })

  it('한 책만 읽혔으면 "모두"로 적는다', () => {
    expect(text(day({ reading_books: [{ book_number: 19, book_name: '시편', chapters: 5, people: null }] }))).toContain('모두 시편이었어요.')
  })
})

describe('prayerMoments', () => {
  it('기도가 있던 시간만, 글씨는 3시간 이상 떨어진 큰 순간 3곳까지', () => {
    const m = prayerMoments(hours({ 6: 2, 7: 2, 12: 1, 22: 2, 23: 1 }))
    expect(m.map((x) => x.hour)).toEqual([6, 7, 12, 22, 23])
    expect(m.filter((x) => x.labeled).map((x) => x.hour)).toEqual([6, 12, 22])
  })
  it('표본이 없으면 빈 배열', () => expect(prayerMoments(null)).toEqual([]))
})

describe('labels', () => {
  it('시간 표현', () => {
    expect(hourLabel(0)).toBe('새벽 12시')
    expect(hourLabel(6)).toBe('아침 6시')
    expect(hourLabel(15)).toBe('오후 3시')
    expect(hourLabel(22)).toBe('밤 10시')
  })
  it('필름 날짜', () => expect(filmDate('2026-11-02')).toBe("'26 11 02"))
})
