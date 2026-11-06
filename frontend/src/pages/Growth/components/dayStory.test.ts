import { describe, expect, it } from 'vitest'
import type { TimelineEvent } from '../../../types/growth'
import { daySentence, foldLabel, isMoment, segmentDays } from './dayStory'

let seq = 0
const ev = (p: Partial<TimelineEvent> & Pick<TimelineEvent, 'type'>): TimelineEvent => ({
  id: `e${seq++}`,
  domain: 'prayer',
  occurred_at: '2026-11-05T12:00:00',
  date: '2026-11-05',
  time: null,
  title: '',
  accent: 'purple',
  meta: {},
  ...p,
})

describe('isMoment', () => {
  it('내 글이 남는 기록만 순간', () => {
    expect(isMoment(ev({ type: 'prayer' }))).toBe(true)
    expect(isMoment(ev({ type: 'answered' }))).toBe(true)
    expect(isMoment(ev({ type: 'read' }))).toBe(false)
    expect(isMoment(ev({ type: 'intercession' }))).toBe(false)
    expect(isMoment(ev({ type: 'session' }))).toBe(false)
    expect(isMoment(ev({ type: 'session', snippet: '메모' }))).toBe(true)
  })
})

describe('daySentence', () => {
  it('새벽 기도 + 읽기는 이어 붙인다', () => {
    expect(
      daySentence([
        ev({ type: 'read', domain: 'bible', meta: { verse_count: 72 } }),
        ev({ type: 'intercession', meta: { count: 2 } }),
        ev({ type: 'prayer', time: '06:53' }),
      ]),
    ).toBe('이른 아침 기도로 하루를 열고 말씀 72절을 읽었어요')
  })

  it('읽기 하나면 끝맺음 꼴', () => {
    expect(daySentence([ev({ type: 'read', meta: { verse_count: 77 } })])).toBe(
      '말씀 77절을 읽었어요',
    )
  })

  it('응답 기도가 있으면 그 하나로 말한다', () => {
    expect(
      daySentence([ev({ type: 'thanks' }), ev({ type: 'answered' })]),
    ).toBe('기도가 응답된 날이에요')
  })

  it('기록이 없으면 빈 문장', () => {
    expect(daySentence([])).toBe('')
  })
})

describe('segmentDays', () => {
  const read = (date: string) => ev({ type: 'read', date, meta: { verse_count: 10 } })
  const day = (date: string, events: TimelineEvent[], showMonth = false) => ({
    date,
    events,
    showMonth,
  })

  it('조용한 날 3일 이상 이어지면 접고, 오늘은 접지 않는다', () => {
    const days = [
      day('2026-11-06', [read('2026-11-06')], true),
      day('2026-11-05', [read('2026-11-05')]),
      day('2026-11-04', [read('2026-11-04')]),
      day('2026-11-03', [read('2026-11-03')]),
      day('2026-11-02', [ev({ type: 'prayer', date: '2026-11-02' })]),
    ]
    const segs = segmentDays(days, '2026-11-06')
    expect(segs.map((s) => s.kind)).toEqual(['day', 'fold', 'day'])
    const fold = segs[1]
    if (fold.kind !== 'fold') throw new Error('fold expected')
    expect(fold.days).toHaveLength(3)
    expect(foldLabel(fold.days)).toBe('11월 3일 – 11월 5일 · 말씀만 읽은 날 3일 · 30절')
  })

  it('2일만 이어지면 접지 않고, 달이 바뀌면 끊는다', () => {
    const days = [
      day('2026-11-02', [read('2026-11-02')], true),
      day('2026-11-01', [read('2026-11-01')]),
      day('2026-10-31', [read('2026-10-31')], true),
      day('2026-10-30', [read('2026-10-30')]),
    ]
    expect(segmentDays(days, '2026-11-06').every((s) => s.kind === 'day')).toBe(true)
  })
})
