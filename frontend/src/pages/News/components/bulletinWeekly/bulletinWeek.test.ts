import { describe, expect, it } from 'vitest'
import { BULLETIN_1101 } from './bulletin1101.fixture'
import {
  announceSummary,
  bestOption,
  eventStatus,
  findMinutes,
  fromKstIso,
  parseBulletinWeek,
  reminderTitle,
  remindAt,
  todoItems,
  toKstIso,
  topThree,
  whenLabel,
} from './bulletinWeek'

const at = (m: number, d: number, h = 0, mi = 0) => new Date(2026, m - 1, d, h, mi)
const week = parseBulletinWeek(BULLETIN_1101)
const byTitle = (t: string) => week.events.find(e => e.title.includes(t))!

describe('parseBulletinWeek — 11/1 실제 주보', () => {
  it('주일과 일정 묶음', () => {
    expect(week.sunday).toEqual(at(11, 1))
    expect(week.events).toHaveLength(8)
    expect(week.later.map(l => l.date)).toEqual([at(11, 15), at(11, 16), at(11, 23), at(11, 29)])
    expect(week.later[0].text).toBe('추수감사주일')
  })

  it('새벽기도회: 기간·새벽 시각·장소', () => {
    const ev = byTitle('도우소서')
    expect([ev.start, ev.end]).toEqual([at(11, 2), at(11, 4)])
    expect(ev.minutes).toBe(5 * 60 + 30)
    expect(ev.place).toBe('3층 본당')
    expect(whenLabel(ev)).toBe('11/2(월)~4(수) 오전 5:30')
  })

  it('다음 주일·오늘·연락처·쉼표 장소', () => {
    expect(byTitle('설립').start).toEqual(at(11, 8))
    expect(byTitle('설립').minutes).toBe(14 * 60)
    expect(byTitle('제직회').start).toEqual(at(11, 1))
    expect(byTitle('제직회').minutes).toBeNull()
    expect(byTitle('임시당회').minutes).toBe(15 * 60 + 30)
    expect(byTitle('임시당회').place).toBe('당회실')
    const apply = byTitle('세례')
    expect(apply.start).toEqual(at(11, 22))
    expect(apply.phone).toBe('010-5075-4774')
    expect(apply.contact).toBe('배닛시 목사')
    expect(byTitle('야유회').place).toBe('히스토리 캠퍼스(경기도 광주)')
    expect(byTitle('야유회').minutes).toBe(8 * 60)
    expect(byTitle('어린이').place).toBe('참빛교회')
    expect([byTitle('감사노트').start, byTitle('감사노트').end]).toEqual([at(11, 2), at(11, 14)])
  })
})

describe('시각 읽기', () => {
  it('오전/오후 없는 1~6시는 오후, 새벽이 있으면 아침', () => {
    expect(findMinutes('3시 모임')).toBe(15 * 60)
    expect(findMinutes('새벽 5시')).toBe(5 * 60)
    expect(findMinutes('오후 12시')).toBe(12 * 60)
    expect(findMinutes('오전 11:20')).toBe(11 * 60 + 20)
    expect(findMinutes('1시 반')).toBe(13 * 60 + 30)
    expect(findMinutes('3일간 모입니다')).toBeNull()
  })
})

describe('상태·3가지·챙길 일', () => {
  const sat = at(10, 31, 21) // 토요일 밤 주보를 본다
  it('상태', () => {
    expect(eventStatus(byTitle('도우소서'), at(11, 3, 9))?.kind).toBe('now')
    expect(eventStatus(byTitle('야유회'), at(11, 5, 12))?.kind).toBe('tomorrow')
    expect(eventStatus(byTitle('임시당회'), at(11, 1, 18))?.kind).toBe('past')
    expect(eventStatus(byTitle('세례'), at(11, 1, 9))?.kind).toBe('later')
  })

  it('3가지는 가까운 날짜순', () => {
    expect(topThree(week, at(11, 1, 9)).map(e => e.title)).toEqual(['제직회', '임시당회', '주여! 우리를 도우소서'])
    expect(announceSummary(BULLETIN_1101, sat)).toBe('꼭 알아둘 3가지 · 제직회 · 임시당회 · 주여! 우리를 도우소서')
  })

  it('챙길 일: 기간은 남은 가장 가까운 날', () => {
    const items = todoItems(week, at(11, 2, 6))
    const dawn = items.find(i => i.ev.title.includes('도우소서'))!
    expect(dawn.at).toEqual(at(11, 3, 5, 30))
  })

  it('알림 때 — 새벽 일은 30분 전, 지난 때는 다른 때로', () => {
    const items = todoItems(week, sat)
    const dawn = items.find(i => i.ev.title.includes('도우소서'))!
    expect(bestOption(dawn, sat)).toBe('m30')
    const picnic = items.find(i => i.ev.title.includes('야유회'))!
    expect(bestOption(picnic, sat)).toBe('eve')
    expect(remindAt(picnic, 'eve', sat)).toEqual(at(11, 5, 20))
    expect(reminderTitle(picnic, 'eve')).toBe('내일 오전 8시 구역장 & 부구역장 야유회')
    // 전날 저녁이 지났으면 1시간 전으로
    expect(bestOption(picnic, at(11, 5, 21), 'eve')).toBe('h1')
    // 시각 모르는 일은 몇 분 전 알림이 없다
    const council = todoItems(week, at(11, 1, 6)).find(i => i.ev.title === '제직회')!
    expect(remindAt(council, 'h1', at(11, 1, 6))).toBeNull()
    expect(bestOption(council, at(11, 1, 6))).toBe('morn')
  })
})

describe('KST ISO', () => {
  it('왕복', () => {
    const d = at(11, 5, 20)
    expect(toKstIso(d)).toBe('2026-11-05T20:00:00+09:00')
    expect(fromKstIso('2026-11-05T11:00:00Z')).toEqual(d)
  })
})
