// '이번 주 일정' 시트 타임라인 모델 (2026-11 개편 최종 시안: A1 정돈형 타임라인 + 맨 위 '다음 일정' 카드).
// 주중 요일표(weeklySchedule)와 ①② 로 묶인 다가오는 일정(week.later)을 한 줄 타임라인으로 잇는다. 순수 함수만 둔다.
import type { BulletinData } from '../../../../types/digitalBulletin'
import { daysBetween, findMinutes, type BulletinWeek, WEEKDAY_KO } from './bulletinWeek'
import { weekdayIndex } from './weeklyModel'

/** 시작 후 이 시간까지는 '진행 중' — 다음 예배(nextWorship)와 같은 75분 창 */
const LIVE_MIN = 75

export type DayState = 'done' | 'today' | 'todo'

export interface TimelineDay {
  date: Date
  state: DayState
}

export interface TimelineEntry {
  key: string
  /** 'week' = 이번 주 요일표, 숫자 = 다가오는 일정의 달(1~12) */
  section: 'week' | number
  title: string
  /** 표시용 시각 글 — 주보에 적힌 그대로("오전 5:30", "오후 3시") */
  timeText: string
  place: string
  /** 첫날 · 마지막 날(하루짜리면 start 와 같음) */
  start: Date | null
  end: Date | null
  /** 날짜 아래 작은 글 — "월–토" · "주일" · "토" */
  dayText: string
  sunday: boolean
  minutes: number | null
  /** 여러 날 이어진 같은 일정의 날들(하루짜리면 빈 배열) */
  days: TimelineDay[]
  /** 시각·장소 없는 줄(주일 '개인묵상' 등) — 흐리게, 다음 일정 후보에서 뺀다 */
  muted: boolean
  past: boolean
}

export interface TimelineNote {
  label: string
  text: string
}

export interface TimelineNext {
  entry: TimelineEntry
  at: Date
  live: boolean
  /** 여러 날 일정에서 몇 번째 날인지(0부터) · 모두 며칠 */
  dayIndex: number
  total: number
}

export interface WeekTimeline {
  entries: TimelineEntry[]
  /** 날짜를 못 읽은 다가오는 일정 — 일정이 아니라 안내로(📌) */
  notes: TimelineNote[]
  next: TimelineNext | null
  /** '오늘' 선을 이 entries 순번 앞에 긋는다. 없으면 null */
  todayAt: number | null
}

const dayOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const atMinutes = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m / 60), m % 60)

/** 요일표 시각 — "5:30" 처럼 오전/오후가 없으면 일정 이름("새벽기도")까지 보고 읽는다 */
const rowMinutes = (time: string, event: string): number | null => {
  if (!time.trim()) return null
  return /오전|오후|새벽|저녁|밤|낮/.test(time) ? findMinutes(time) : findMinutes(`${event} ${time}`)
}

/** 끝났나 — 마지막 날이 지났거나, 오늘인데 시작 후 75분이 지났으면 */
const isPast = (end: Date | null, minutes: number | null, now: Date): boolean => {
  if (!end) return false
  const d = daysBetween(now, end)
  if (d < 0) return true
  if (d > 0 || minutes == null) return false
  return atMinutes(end, minutes + LIVE_MIN) <= now
}

const dayStates = (dates: Date[], minutes: number | null, now: Date): TimelineDay[] =>
  dates.map(date => {
    const d = daysBetween(now, date)
    const state: DayState = d < 0 || (d === 0 && isPast(date, minutes, now)) ? 'done' : d === 0 ? 'today' : 'todo'
    return { date, state }
  })

/** 요일표 → 날짜를 붙이고, 하루씩 이어지는 날에 일정·시각·장소가 같으면 한 줄로 묶는다(특별새벽기도회 월~토 등) */
const weekEntries = (data: BulletinData, sunday: Date | null, now: Date): TimelineEntry[] => {
  type G = { rows: BulletinData['weeklySchedule']; dates: (Date | null)[]; wd: number | null }
  const groups: G[] = []
  for (const w of data.weeklySchedule) {
    const wd = weekdayIndex(w.day)
    // 주보 주일 다음 날(월)부터 다음 주일까지
    const date = sunday && wd != null ? addDays(sunday, wd === 0 ? 7 : wd) : null
    const prev = groups[groups.length - 1]
    const head = prev?.rows[0]
    const same =
      head && head.event.trim() === w.event.trim() && head.time.trim() === w.time.trim() && head.location.trim() === w.location.trim()
    if (same && prev.wd != null && wd != null && (prev.wd + 1) % 7 === wd) {
      prev.rows.push(w)
      prev.dates.push(date)
      prev.wd = wd
    } else groups.push({ rows: [w], dates: [date], wd })
  }
  return groups.map((g, i) => {
    const first = g.rows[0]
    const last = g.rows[g.rows.length - 1]
    const minutes = rowMinutes(first.time, first.event)
    const start = g.dates[0]
    const end = g.dates[g.dates.length - 1]
    const dates = g.dates.filter((d): d is Date => d != null)
    const dayName = (s: string) => s.trim().replace(/요일$/, '')
    return {
      key: `w${i}`,
      section: 'week' as const,
      title: first.event.trim(),
      timeText: first.time.trim(),
      place: first.location.trim(),
      start,
      end,
      dayText: g.rows.length > 1 ? `${dayName(first.day)}–${dayName(last.day)}` : dayName(first.day),
      sunday: g.rows.length === 1 && weekdayIndex(first.day) === 0,
      minutes,
      days: g.rows.length > 1 && dates.length === g.rows.length ? dayStates(dates, minutes, now) : [],
      muted: !first.time.trim() && !first.location.trim(),
      past: isPast(end, minutes, now),
    }
  })
}

/** "전국남전도회연합회 헌신예배 *오후 3시, 참빛교회" → 제목 / "오후 3시" / "참빛교회" */
const splitLater = (text: string): { title: string; timeText: string; place: string } => {
  const [title, ...rest] = text.split(/\s*\*\s*/)
  const tail = rest.join(' ').trim()
  if (!tail) return { title: title.trim(), timeText: '', place: '' }
  const parts = tail.split(/\s*,\s*/).filter(Boolean)
  const timeIdx = parts.findIndex(p => findMinutes(p) != null)
  const timeText = timeIdx >= 0 ? parts[timeIdx] : ''
  const place = parts.filter((_, i) => i !== timeIdx).join(' · ')
  return { title: title.trim(), timeText, place }
}

const laterEntries = (week: BulletinWeek, now: Date): { entries: TimelineEntry[]; notes: TimelineNote[] } => {
  const entries: TimelineEntry[] = []
  const notes: TimelineNote[] = []
  week.later.forEach((x, i) => {
    if (!x.date) {
      notes.push({ label: x.label && x.label !== x.text ? x.label : '', text: x.text })
      return
    }
    const { title, timeText, place } = splitLater(x.text)
    const minutes = timeText ? findMinutes(timeText) : null
    entries.push({
      key: `l${i}`,
      section: x.date.getMonth() + 1,
      title,
      timeText,
      place,
      start: x.date,
      end: x.date,
      dayText: WEEKDAY_KO[x.date.getDay()],
      sunday: x.date.getDay() === 0,
      minutes,
      days: [],
      muted: false,
      past: isPast(x.date, minutes, now),
    })
  })
  entries.sort((a, b) => a.start!.getTime() - b.start!.getTime())
  return { entries, notes }
}

/** 가장 가까운 일정 — 진행 중이면 그것, 아니면 앞으로 올 첫 회차. 시각 없는 일은 그날 끝까지 '앞으로'로 본다 */
const findNext = (entries: TimelineEntry[], now: Date): TimelineNext | null => {
  let best: TimelineNext | null = null
  for (const entry of entries) {
    if (entry.muted || !entry.start) continue
    const dates = entry.days.length ? entry.days.map(d => d.date) : [entry.start]
    for (let k = 0; k < dates.length; k++) {
      const day = dates[k]
      const at = entry.minutes != null ? atMinutes(day, entry.minutes) : dayOnly(day)
      const until = entry.minutes != null ? atMinutes(day, entry.minutes + LIVE_MIN) : addDays(day, 1)
      if (until <= now) continue
      const live = entry.minutes != null && at <= now
      const cand = { entry, at, live, dayIndex: k, total: dates.length }
      if (live) return cand
      if (!best || at < best.at) best = cand
      break
    }
  }
  return best
}

export const buildWeekTimeline = (data: BulletinData, week: BulletinWeek, now: Date): WeekTimeline => {
  const later = laterEntries(week, now)
  const entries = [...weekEntries(data, week.sunday, now), ...later.entries]
  // '오늘' 선 — 오늘 이후에 시작하는 첫 줄 앞. 그 앞에 이미 시작한 줄이 있을 때만 긋는다
  const today = dayOnly(now)
  const dated = entries.filter(e => e.start)
  let todayAt: number | null = null
  if (dated.length && dated.some(e => e.start! <= today)) {
    const i = entries.findIndex(e => e.start && e.start > today)
    todayAt = i < 0 ? entries.length : i
  }
  return { entries, notes: later.notes, next: findNext(entries, now), todayAt }
}

/** 다음 일정까지 남은 때 — "3일" · "8시간" · "25분". 시각 모르는 일은 날 수로만 */
export const countdown = (next: TimelineNext, now: Date): { value: number; unit: 'day' | 'hour' | 'min' } => {
  const days = daysBetween(now, next.at)
  if (next.entry.minutes == null || days >= 2) return { value: Math.max(days, 0), unit: 'day' }
  const mins = Math.max(1, Math.ceil((next.at.getTime() - now.getTime()) / 60_000))
  if (mins < 60) return { value: mins, unit: 'min' }
  const hours = Math.floor(mins / 60)
  return hours >= 24 ? { value: days, unit: 'day' } : { value: hours, unit: 'hour' }
}

/* ── 캘린더 파일(.ics) ─────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, m => `\\${m}`).replace(/\n/g, '\\n')

/** 다음 일정 → .ics 본문. 여러 날 일정은 남은 날만큼 매일 반복 */
export const icsFor = (next: TimelineNext, stamp: Date): string => {
  const { entry, at } = next
  const remaining = next.total - next.dayIndex
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//chambit//bulletin//KO',
    'BEGIN:VEVENT',
    `UID:${ymd(at)}-${entry.key}-${encodeURIComponent(entry.title).slice(0, 40)}@chambit`,
    `DTSTAMP:${stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    entry.minutes != null
      ? `DTSTART;TZID=Asia/Seoul:${ymd(at)}T${pad(Math.floor(entry.minutes / 60))}${pad(entry.minutes % 60)}00`
      : `DTSTART;VALUE=DATE:${ymd(at)}`,
    entry.minutes != null ? 'DURATION:PT1H' : 'DURATION:P1D',
    ...(remaining > 1 ? [`RRULE:FREQ=DAILY;COUNT=${remaining}`] : []),
    `SUMMARY:${esc(entry.title)}`,
    ...(entry.place ? [`LOCATION:${esc(entry.place)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}
