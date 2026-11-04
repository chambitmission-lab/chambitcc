// 디지털 주보 소식 → 이번 주 일정(날짜·시각·장소·연락처) 해석. 순수 함수만 둔다.
//
// 종이 주보 원고는 "11월 2일(월)~4일(수) 5시 30분, 3층 본당", "다음 주일(11/8)", "오늘 3부 예배 후" 처럼
// 사람이 쓴 글이라 완벽히 읽을 수는 없다. 못 읽은 칸은 null — 화면은 그 소식을 날짜 없는 안내로 보여 준다.
//
// 날짜는 전부 '서울 벽시계 캘린더 Date'(utils/date toKstCalendarDate 와 같은 약속)로 다룬다.
// 서버에 보낼 때만 toKstIso 로 +09:00 을 붙인다 — 기기 타임존과 무관하게 맞는다.
import type { AnnouncementItem, BulletinData } from '../../../../types/digitalBulletin'
import { calendarDateKey, pad2 } from '../../../../utils/date'

export const WEEKDAY_KO = ['주일', '월', '화', '수', '목', '금', '토'] as const

export interface WeekEvent {
  /** announcements 안의 순서 — 알림 키·시트 열기에 쓴다 */
  index: number
  title: string
  body: string
  /** 시작·끝 날짜(자정). 날짜를 못 읽으면 null */
  start: Date | null
  end: Date | null
  /** 자정부터 분. 못 읽으면 null */
  minutes: number | null
  place: string
  phone: string | null
  contact: string | null
}

export interface LaterItem {
  date: Date | null
  label: string
  text: string
}

export interface BulletinWeek {
  sunday: Date | null
  events: WeekEvent[]
  /** "교회 일정 안내"처럼 ①② 로 묶인 앞으로의 일정 */
  later: LaterItem[]
}

export type StatusKind = 'past' | 'now' | 'today' | 'tomorrow' | 'soon' | 'later'
export interface EventStatus {
  kind: StatusKind
  /** 오늘부터 시작일까지 남은 날 */
  days: number
  /** 정렬 — 0 지금·오늘, 1 일주일 안, 2 그 뒤, 3 지남 */
  rank: number
}

export type RemindOption = 'eve' | 'morn' | 'h1' | 'm30'
export const REMIND_OPTIONS: RemindOption[] = ['eve', 'morn', 'h1', 'm30']

/* ── 날짜 ─────────────────────────────────────────── */

const DAY_MS = 86_400_000
const dayOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
/** 캘린더 날짜 차이(b - a, 일) */
export const daysBetween = (a: Date, b: Date) => Math.round((dayOnly(b).getTime() - dayOnly(a).getTime()) / DAY_MS)

/** "2026. 11. 1." → 그 주일 */
export const parseSunday = (date: string): Date | null => {
  const m = date.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** 월·일만 적힌 날짜의 연도 — 주보 날짜에서 반년 넘게 떨어지면 해를 넘긴 것으로 본다 */
const withYear = (month: number, day: number, sunday: Date): Date | null => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  let year = sunday.getFullYear()
  const diff = month - (sunday.getMonth() + 1)
  if (diff < -6) year += 1
  else if (diff > 6) year -= 1
  return new Date(year, month - 1, day)
}

const RANGE_KO = /(\d{1,2})\s*월\s*(\d{1,2})\s*(?:일)?(?:\s*\([^)]*\))?\s*[~～\-–]\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일/
const SINGLE_KO = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/
const RANGE_SLASH = /(?<![\d-])(\d{1,2})\/(\d{1,2})(?:\s*\([^)]*\))?\s*[~～\-–]\s*(?:(\d{1,2})\/)?(\d{1,2})(?![\d-])/
const SINGLE_SLASH = /(?<![\d-])(\d{1,2})\/(\d{1,2})(?![\d/-])/

export const findDates = (text: string, sunday: Date): { start: Date; end: Date | null } | null => {
  const range = text.match(RANGE_KO) ?? text.match(RANGE_SLASH)
  if (range) {
    const start = withYear(Number(range[1]), Number(range[2]), sunday)
    const end = withYear(Number(range[3] ?? range[1]), Number(range[4]), sunday)
    if (start && end && end > start) return { start, end }
    if (start) return { start, end: null }
  }
  const single = text.match(SINGLE_KO) ?? text.match(SINGLE_SLASH)
  if (single) {
    const start = withYear(Number(single[1]), Number(single[2]), sunday)
    if (start) return { start, end: null }
  }
  if (/다음\s*주일/.test(text)) return { start: addDays(sunday, 7), end: null }
  if (/오늘|금일/.test(text)) return { start: sunday, end: null }
  return null
}

/* ── 시각 ─────────────────────────────────────────── */

const TIME_KO = /(오전|오후|새벽|저녁|밤|낮)?\s*(\d{1,2})\s*시(?!간)(?:\s*(\d{1,2})\s*분|\s*반)?/
const TIME_COLON = /(오전|오후|새벽|저녁|밤|낮)?\s*(?<![\d-])(\d{1,2}):(\d{2})(?![\d-])/

/** 첫 시각 → 자정부터 분. 오전/오후가 없으면 '새벽'이 글에 있을 때만 아침, 1~6시는 오후로 본다 */
export const findMinutes = (text: string): number | null => {
  const a = text.match(TIME_KO)
  const b = text.match(TIME_COLON)
  const m = a && b ? ((a.index ?? 0) <= (b.index ?? 0) ? a : b) : a ?? b
  if (!m) return null
  let hour = Number(m[2])
  const minute = m === a ? (m[0].endsWith('반') ? 30 : Number(m[3] ?? 0)) : Number(m[3])
  if (hour > 24 || minute > 59) return null
  const mer = m[1]
  if (mer === '오후' || mer === '저녁' || mer === '밤') hour = hour < 12 ? hour + 12 : hour
  else if (mer === '낮') hour = hour < 6 ? hour + 12 : hour
  else if (!mer && hour >= 1 && hour <= 6 && !/새벽/.test(text)) hour += 12
  if (hour === 24) hour = 0
  return hour * 60 + minute
}

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ap = h < 12 ? '오전' : '오후'
  const h12 = h % 12 || 12
  return `${ap} ${h12}${m ? `:${pad2(m)}` : '시'}`
}

/* ── 장소·연락처 ───────────────────────────────────── */

const ROOM = /(?:\d\s*층\s*)?(?:본당|대예배실|소예배실|당회실|교역자실|목양실|로비|교육관|친교실|식당|기도실|카페|비전홀|소그룹실)/
const PHONE = /01[016789]-?\d{3,4}-?\d{4}/
const CONTACT = /([가-힣]{2,4}\s*(?:목사|전도사|강도사|장로|집사|권사|간사))\s*:?\s*01[016789]/

const findPlace = (body: string): string => {
  const room = body.match(ROOM)
  if (room) return room[0].replace(/\s+/g, ' ')
  // "11월 6일(금), 히스토리 캠퍼스(경기도 광주)" — 첫 줄 쉼표 뒤 조각에 숫자가 없으면 장소로 본다
  const first = body.split('\n')[0]
  const seg = first.split(',').slice(1).join(',').split('*')[0].trim()
  return seg && !/\d/.test(seg) && seg.length <= 30 ? seg : ''
}

export const stripLeadingNo = (s: string) => s.replace(/^\s*(\d+\s*[.)]|[①-⑳])\s*/, '').trim()

/* ── 한 주 ────────────────────────────────────────── */

const CIRCLED = /^\s*[①-⑳]\s*/

const parseLater = (body: string, sunday: Date): LaterItem[] | null => {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.filter(l => CIRCLED.test(l)).length < 2) return null
  return lines
    .filter(l => CIRCLED.test(l))
    .map(l => {
      const text = l.replace(CIRCLED, '')
      const [head, ...rest] = text.split(/\s*:\s*/)
      const dates = findDates(head, sunday)
      return { date: dates?.start ?? null, label: head.trim(), text: (rest.join(': ') || text).trim() }
    })
}

export const parseBulletinWeek = (data: BulletinData): BulletinWeek => {
  const sunday = parseSunday(data.date)
  const events: WeekEvent[] = []
  const later: LaterItem[] = []
  data.announcements.forEach((a: AnnouncementItem, index) => {
    const title = stripLeadingNo(a.title)
    const body = (a.content ?? '').trim()
    if (!title && !body) return
    if (sunday) {
      const list = parseLater(body, sunday)
      if (list) {
        later.push(...list)
        return
      }
    }
    const text = `${title}\n${body}`
    const dates = sunday ? findDates(text, sunday) : null
    const phone = body.match(PHONE)?.[0] ?? null
    events.push({
      index,
      title,
      body,
      start: dates?.start ?? null,
      end: dates?.end ?? null,
      minutes: findMinutes(body) ?? findMinutes(title),
      place: findPlace(body),
      phone,
      contact: phone ? body.match(CONTACT)?.[1] ?? null : null,
    })
  })
  return { sunday, events, later }
}

/* ── 상태·정렬 ─────────────────────────────────────── */

export const eventStatus = (ev: WeekEvent, now: Date): EventStatus | null => {
  if (!ev.start) return null
  const ds = daysBetween(now, ev.start)
  const de = daysBetween(now, ev.end ?? ev.start)
  if (de < 0) return { kind: 'past', days: ds, rank: 3 }
  if (ev.end && ds <= 0) return { kind: 'now', days: ds, rank: 0 }
  if (ds === 0) {
    // 오늘인데 시각이 이미 지났으면 지난 일
    if (ev.minutes != null && ev.minutes + 60 < now.getHours() * 60 + now.getMinutes()) return { kind: 'past', days: 0, rank: 3 }
    return { kind: 'today', days: 0, rank: 0 }
  }
  if (ds === 1) return { kind: 'tomorrow', days: 1, rank: 1 }
  return ds <= 7 ? { kind: 'soon', days: ds, rank: 1 } : { kind: 'later', days: ds, rank: 2 }
}

/** 이번 주 꼭 알아둘 3가지 — 가까운 날짜순, 날짜 없는 안내로 채운다 */
export const topThree = (week: BulletinWeek, now: Date): WeekEvent[] => {
  const dated = week.events
    .map(ev => ({ ev, st: eventStatus(ev, now) }))
    .filter((x): x is { ev: WeekEvent; st: EventStatus } => x.st != null && x.st.kind !== 'past')
    .sort((a, b) => a.st.rank - b.st.rank || a.ev.start!.getTime() - b.ev.start!.getTime())
    .map(x => x.ev)
  const undated = week.events.filter(ev => !ev.start)
  return [...dated, ...undated].slice(0, 3)
}

/** 다음에 오는 그 일(기간이면 남은 날 중 가장 가까운 날). 시각을 모르면 그날 끝(23:59)으로 본다 */
export const nextOccurrence = (ev: WeekEvent, now: Date): Date | null => {
  if (!ev.start) return null
  const end = ev.end ?? ev.start
  const minutes = ev.minutes ?? 23 * 60 + 59
  for (let d = ev.start < dayOnly(now) ? dayOnly(now) : ev.start; d <= end; d = addDays(d, 1)) {
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60)
    if (at > now) return at
  }
  return null
}

/** 이번 주 챙길 일 — 아직 오지 않은 날짜 있는 일, 가까운 순 */
export interface TodoItem {
  ev: WeekEvent
  at: Date
}
export const todoItems = (week: BulletinWeek, now: Date): TodoItem[] =>
  week.events
    .map(ev => ({ ev, at: nextOccurrence(ev, now) }))
    .filter((x): x is TodoItem => x.at != null)
    .sort((a, b) => a.at.getTime() - b.at.getTime())

/* ── 알림 시각 ─────────────────────────────────────── */

export const remindAt = (item: TodoItem, opt: RemindOption, now: Date): Date | null => {
  const { at, ev } = item
  let r: Date
  if (opt === 'eve') r = new Date(at.getFullYear(), at.getMonth(), at.getDate() - 1, 20, 0)
  else if (opt === 'morn') r = new Date(at.getFullYear(), at.getMonth(), at.getDate(), 7, 0)
  else {
    if (ev.minutes == null) return null
    r = new Date(at.getTime() - (opt === 'h1' ? 60 : 30) * 60_000)
  }
  return r > now && r < at ? r : null
}

export const validOptions = (item: TodoItem, now: Date): RemindOption[] =>
  REMIND_OPTIONS.filter(o => remindAt(item, o, now) != null)

/** 고른 때가 안 되면 가장 알맞은 때 — 새벽 일은 30분 전, 그 밖엔 전날 저녁부터 */
export const bestOption = (item: TodoItem, now: Date, wanted?: RemindOption): RemindOption | null => {
  const valid = validOptions(item, now)
  if (wanted && valid.includes(wanted)) return wanted
  const order: RemindOption[] =
    item.ev.minutes != null && item.ev.minutes < 8 * 60 ? ['m30', 'eve', 'h1'] : ['eve', 'h1', 'm30', 'morn']
  return order.find(o => valid.includes(o)) ?? null
}

/** 잠금화면에 뜰 제목 */
export const reminderTitle = (item: TodoItem, opt: RemindOption): string => {
  const time = item.ev.minutes != null ? `${formatMinutes(item.ev.minutes)} ` : ''
  if (opt === 'eve') return `내일 ${time}${item.ev.title}`
  if (opt === 'morn') return `오늘 ${time}${item.ev.title}`
  return `${opt === 'h1' ? '1시간' : '30분'} 뒤 ${item.ev.title}`
}

export const reminderBody = (item: TodoItem): string => item.ev.place || item.ev.body.split('\n')[0].slice(0, 120)

/** 캘린더 Date → 서버용 ISO(+09:00) */
export const toKstIso = (d: Date): string =>
  `${calendarDateKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00+09:00`

/** 서버 ISO → 캘린더 Date */
export const fromKstIso = (iso: string): Date => {
  const real = new Date(iso)
  const shifted = new Date(real.getTime() + 9 * 3600_000)
  return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), shifted.getUTCHours(), shifted.getUTCMinutes())
}

/** 알림 키 — 같은 주보의 같은 소식은 같은 키 */
export const itemKey = (data: BulletinData, ev: WeekEvent): string => {
  const sunday = parseSunday(data.date)
  return `${sunday ? calendarDateKey(sunday) : data.date}:${ev.index}`
}

/** 새 주보 도착 알림 본문 — 관리자가 초안을 적용할 때 서버로 넘긴다 */
export const announceSummary = (data: BulletinData, now: Date): string => {
  const top = topThree(parseBulletinWeek(data), now).map(ev => ev.title)
  if (!top.length) return ''
  const body = `꼭 알아둘 3가지 · ${top.join(' · ')}`
  return body.length > 180 ? `${body.slice(0, 179)}…` : body
}

/** 날짜 표기 "11/6(금)" · 기간 "11/2~4" */
export const dateLabel = (ev: WeekEvent): string => {
  if (!ev.start) return ''
  const s = ev.start
  const head = `${s.getMonth() + 1}/${s.getDate()}(${WEEKDAY_KO[s.getDay()]})`
  if (!ev.end) return head
  const e = ev.end
  return `${head}~${e.getMonth() === s.getMonth() ? '' : `${e.getMonth() + 1}/`}${e.getDate()}(${WEEKDAY_KO[e.getDay()]})`
}

export const whenLabel = (ev: WeekEvent): string =>
  [dateLabel(ev), ev.minutes != null ? formatMinutes(ev.minutes) : ''].filter(Boolean).join(' ')
