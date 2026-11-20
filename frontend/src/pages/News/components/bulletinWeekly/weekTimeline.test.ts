import { describe, expect, it } from 'vitest'
import type { BulletinData } from '../../../../types/digitalBulletin'
import { BULLETIN_1101 } from './bulletin1101.fixture'
import type { BulletinWeek } from './bulletinWeek'
import { buildWeekTimeline, countdown, icsFor } from './weekTimeline'

const at = (m: number, d: number, h = 0, mi = 0) => new Date(2026, m - 1, d, h, mi)

// 11/22 주보 — 월~토 특별새벽기도회, 주일 개인묵상, 다가오는 일정(날짜 없는 개정 안내 2 + 날짜 4)
const DAWN = { event: '직분자 선거를 위한 특별새벽기도회', time: '오전 5:30', location: '본당' }
const data = {
  ...BULLETIN_1101,
  date: '2026. 11. 22.',
  weeklySchedule: [
    ...['월', '화', '수', '목', '금', '토'].map(day => ({ day, ...DAWN })),
    { day: '주일', event: '개인묵상', time: '', location: '' },
  ],
} as BulletinData
const week: BulletinWeek = {
  sunday: at(11, 22),
  events: [],
  later: [
    { date: null, label: '장로 정년 총회 헌법에 따른 70세로의 개정,', text: '장로 정년 총회 헌법에 따른 70세로의 개정,' },
    { date: at(12, 6), label: '12/6(주일)', text: '전국남전도회연합회 헌신예배 *오후 3시, 참빛교회' },
    { date: at(12, 5), label: '12/5(토)', text: '정책당회' },
  ],
}

describe('buildWeekTimeline', () => {
  it('같은 일정 월~토는 한 줄, 다가오는 일정은 날짜순, 날짜 없는 건 안내로', () => {
    const tl = buildWeekTimeline(data, week, at(11, 20, 12))
    expect(tl.entries.map(e => [e.dayText, e.title])).toEqual([
      ['월–토', DAWN.event],
      ['주일', '개인묵상'],
      ['토', '정책당회'],
      ['주일', '전국남전도회연합회 헌신예배'],
    ])
    const [dawn, rest, , devo] = tl.entries
    expect(dawn.start).toEqual(at(11, 23))
    expect(dawn.end).toEqual(at(11, 28))
    expect(dawn.days).toHaveLength(6)
    expect(rest.muted).toBe(true)
    expect(rest.sunday).toBe(true)
    expect(devo).toMatchObject({ section: 12, timeText: '오후 3시', place: '참빛교회', minutes: 15 * 60 })
    expect(tl.notes).toHaveLength(1)
    // 아직 시작 전 — 오늘 선 없음, 다음 일정은 월 5:30 특새 3일 남음
    expect(tl.todayAt).toBeNull()
    expect(tl.next).toMatchObject({ live: false, dayIndex: 0, total: 6, at: at(11, 23, 5, 30) })
    expect(countdown(tl.next!, at(11, 20, 12))).toEqual({ value: 3, unit: 'day' })
  })

  it('수요일 밤 — 지난 요일은 done, 다음은 목요일 4일째, 오늘 선은 주일 앞', () => {
    const now = at(11, 25, 21)
    const tl = buildWeekTimeline(data, week, now)
    expect(tl.entries[0].days.map(d => d.state)).toEqual(['done', 'done', 'done', 'todo', 'todo', 'todo'])
    expect(tl.next).toMatchObject({ dayIndex: 3, at: at(11, 26, 5, 30), live: false })
    expect(countdown(tl.next!, now)).toEqual({ value: 8, unit: 'hour' })
    expect(tl.todayAt).toBe(1)
  })

  it('목요일 5:40 — 진행 중, 오늘 칩', () => {
    const tl = buildWeekTimeline(data, week, at(11, 26, 5, 40))
    expect(tl.next).toMatchObject({ live: true, dayIndex: 3 })
    expect(tl.entries[0].days[3].state).toBe('today')
  })

  it('주일 오후 — 이번 주는 끝, 다음은 정책당회(시각 없음 → 날 수)', () => {
    const now = at(11, 29, 15)
    const tl = buildWeekTimeline(data, week, now)
    expect(tl.entries[0].past).toBe(true)
    expect(tl.next?.entry.title).toBe('정책당회')
    expect(countdown(tl.next!, now)).toEqual({ value: 6, unit: 'day' })
    expect(tl.todayAt).toBe(2)
  })

  it('.ics — 남은 날만큼 매일 반복, 쉼표 이스케이프', () => {
    const tl = buildWeekTimeline(data, week, at(11, 25, 21))
    const ics = icsFor(tl.next!, at(11, 25, 21))
    expect(ics).toContain('DTSTART;TZID=Asia/Seoul:20261126T053000')
    expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=3')
    const one = icsFor({ ...tl.next!, entry: { ...tl.next!.entry, place: '본당, 2층' }, dayIndex: 0, total: 1 }, at(11, 25))
    expect(one).not.toContain('RRULE')
    expect(one).toContain('LOCATION:본당\\, 2층')
  })
})
