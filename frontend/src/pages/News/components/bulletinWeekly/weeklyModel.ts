// 디지털 주보 화면 모델 — 예배 시각·다음 예배·이번 주 받을 알림·계좌·미션 기록. 순수 함수 위주.
import type { BulletinData, BulletinNotifySettings, BulletinReminder } from '../../../../types/digitalBulletin'
import { calendarDateKey } from '../../../../utils/date'
import { safeStorage } from '../../../../utils/safeStorage'
import { parseBibleReference } from '../../../Sermon/utils/sermonMeta'
import { daysBetween, findMinutes, formatMinutes, fromKstIso, WEEKDAY_KO } from './bulletinWeek'

/* ── 예배 ─────────────────────────────────────────── */

export interface ServiceSlot {
  name: string
  preacher: string
  minutes: number
}

/** 주일 예배 목록 — "오전 7:30" 이 아닌 표기도 읽는다. 시각을 못 읽은 예배는 뺀다 */
export const sundayServices = (data: BulletinData): ServiceSlot[] =>
  data.worship.schedule
    .map(s => ({ name: s.name.trim(), preacher: s.preacher.trim(), minutes: findMinutes(s.time.includes('오') ? s.time : `오전 ${s.time}`) }))
    .filter((s): s is ServiceSlot => !!s.name && s.minutes != null)

const at = (d: Date, minutes: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60)
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** now 이후(오늘 포함) 첫 주일 */
export const upcomingSunday = (now: Date): Date => addDays(now, (7 - now.getDay()) % 7)

/** 주중 일정의 요일 칸 → getDay() */
export const weekdayIndex = (day: string): number | null => {
  const d = day.trim().replace(/요일$/, '')
  const i = WEEKDAY_KO.indexOf(d as (typeof WEEKDAY_KO)[number])
  if (i >= 0) return i
  return d === '일' ? 0 : null
}

export interface NextWorship {
  title: string
  sub: string
  at: Date
  /** 지금 드리는 중(시작 후 75분까지) */
  live: boolean
  /** 주일 예배면 그 이름 — '1시간 전 알림'을 바로 켤 수 있다 */
  serviceName: string | null
}

/**
 * 다음 예배 — 주일 예배와 주중 정기 모임(수요예배 등) 중 가장 가까운 것.
 * 새벽기도(7시 전)는 '새벽기도 30분 전' 알림이 따로 있어 여기선 뺀다.
 */
export const nextWorship = (data: BulletinData, now: Date): NextWorship | null => {
  const cands: NextWorship[] = []
  const sun = upcomingSunday(now)
  for (const s of sundayServices(data)) {
    for (const day of [sun, addDays(sun, 7)]) {
      const start = at(day, s.minutes)
      if (start.getTime() + 75 * 60_000 > now.getTime()) {
        cands.push({ title: s.name, sub: s.preacher, at: start, live: start <= now, serviceName: s.name })
        break
      }
    }
  }
  for (const w of data.weeklySchedule) {
    const wd = weekdayIndex(w.day)
    const minutes = findMinutes(w.time.includes('오') ? w.time : `오후 ${w.time}`)
    if (wd == null || wd === 0 || minutes == null || minutes < 7 * 60) continue
    const day = addDays(now, (wd - now.getDay() + 7) % 7)
    let start = at(day, minutes)
    if (start.getTime() + 75 * 60_000 <= now.getTime()) start = at(addDays(day, 7), minutes)
    cands.push({ title: w.event.trim(), sub: w.location.trim(), at: start, live: start <= now, serviceName: null })
  }
  return cands.sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null
}

/** 그 요일 새벽기도(7시 전 모임) — 인도자 포함 */
export const dawnOn = (data: BulletinData, weekday: number): { minutes: number; leader: string; event: string } | null => {
  for (const w of data.weeklySchedule) {
    if (weekdayIndex(w.day) !== weekday) continue
    const minutes = findMinutes(w.time.includes('오') ? w.time : `새벽 ${w.time}`)
    if (minutes != null && minutes < 7 * 60) return { minutes, leader: w.location.trim(), event: w.event.trim() }
  }
  return null
}

/* ── 이번 주 받을 알림 미리보기 ─────────────────────── */

export interface PreviewAlarm {
  /** null = 시각이 정해지지 않음(새 주보 도착) */
  at: Date | null
  title: string
  body: string
  kind: 'new' | 'service' | 'dawn' | 'item'
}

export const weekAlarms = (
  data: BulletinData,
  settings: BulletinNotifySettings,
  reminders: BulletinReminder[],
  now: Date,
): PreviewAlarm[] => {
  const out: PreviewAlarm[] = []
  const horizon = addDays(now, 7)
  if (settings.service) {
    const sun = upcomingSunday(now)
    for (const s of sundayServices(data)) {
      if (!settings.services.includes(s.name)) continue
      for (const day of [sun, addDays(sun, 7)]) {
        const a = new Date(at(day, s.minutes).getTime() - 60 * 60_000)
        if (a > now) {
          if (a < horizon) out.push({ at: a, title: `1시간 뒤 ${s.name}`, body: `${formatMinutes(s.minutes)} · ${s.preacher}`, kind: 'service' })
          break
        }
      }
    }
  }
  if (settings.dawn) {
    for (let k = 0; k < 8; k++) {
      const day = addDays(now, k)
      const flag = settings.dawn_days[(day.getDay() + 6) % 7]
      const dawn = dawnOn(data, day.getDay())
      if (flag !== '1' || !dawn) continue
      const a = new Date(at(day, dawn.minutes).getTime() - 30 * 60_000)
      if (a > now && a < horizon) out.push({ at: a, title: '30분 뒤 새벽기도', body: `${formatMinutes(dawn.minutes)} · ${dawn.leader}`, kind: 'dawn' })
    }
  }
  if (settings.item_reminders) {
    for (const r of reminders) {
      const a = fromKstIso(r.remind_at)
      if (a > now) out.push({ at: a, title: r.title, body: r.body, kind: 'item' })
    }
  }
  out.sort((a, b) => a.at!.getTime() - b.at!.getTime())
  if (settings.new_bulletin) out.unshift({ at: null, title: '새 주보가 올라왔어요', body: '꼭 알아둘 3가지와 함께', kind: 'new' })
  return out
}

/* ── 말씀 ─────────────────────────────────────────── */

/** "(에스겔 37:5, 10)" · "열왕기하 23장 21~30절" → /bible 경로 */
export const bibleLink = (raw: string): string | null => {
  const ref = parseBibleReference(raw.replace(/[()（）]/g, '').trim())
  if (!ref?.bookNumber) return null
  return `/bible/${ref.bookNumber}/${ref.chapter}${ref.verse ? `?verse=${ref.verse}` : ''}`
}

export interface SermonEntry {
  title: string
  ref: string
  link: string | null
}

/** 설교 제목·본문이 " / " 로 여럿이면 짝을 맞춘다 */
export const sermonEntries = (data: BulletinData): SermonEntry[] => {
  const titles = data.worship.sermon.title.split(/\s+\/\s+/).map(s => s.replace(/[【】]/g, '').trim()).filter(Boolean)
  const refs = data.worship.sermon.subtitle.split(/\s+\/\s+/).map(s => s.trim()).filter(Boolean)
  const n = Math.max(titles.length, refs.length)
  return Array.from({ length: n }, (_, i) => ({
    title: titles[i] ?? '',
    ref: refs[i] ?? '',
    link: refs[i] ? bibleLink(refs[i]) : null,
  }))
}

/* ── 헌금 계좌 ─────────────────────────────────────── */

export interface AccountLine {
  label: string
  bank: string
  number: string
}

const ACCOUNT = /^\s*[*·•-]?\s*([^/]+?)\s*\/\s*([가-힣A-Za-z]+)\s+([\d-]{8,})\s*$/

/** "* 주정 / 농협 301-0270-5923-91" 줄들. 하나도 없으면 null */
export const parseAccounts = (content: string): { intro: string; lines: AccountLine[] } | null => {
  const lines: AccountLine[] = []
  const intro: string[] = []
  for (const raw of content.split('\n')) {
    const m = raw.match(ACCOUNT)
    if (m) lines.push({ label: m[1].trim(), bank: m[2], number: m[3] })
    else if (raw.trim()) intro.push(raw.replace(/^※\s*/, '').trim())
  }
  return lines.length ? { intro: intro.join(' '), lines } : null
}

/* ── 주보 미션 (이 기기에만 저장) ──────────────────────── */

export type MissionKey = 'alarm' | 'bible' | 'news'
export const MISSIONS: MissionKey[] = ['alarm', 'bible', 'news']
const MISSION_STORE = 'bw-mission-v1'

type MissionLog = Record<string, MissionKey[]>

const readLog = (): MissionLog => {
  const v = safeStorage.getJson(MISSION_STORE)
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as MissionLog) : {}
}

export const missionDone = (weekKey: string): Set<MissionKey> => new Set(readLog()[weekKey] ?? [])

export const markMission = (weekKey: string, key: MissionKey): Set<MissionKey> => {
  const log = readLog()
  const set = new Set(log[weekKey] ?? [])
  if (!set.has(key)) {
    set.add(key)
    log[weekKey] = [...set]
    // 오래된 주는 정리 — 최근 20주만
    const keys = Object.keys(log).sort()
    for (const k of keys.slice(0, Math.max(0, keys.length - 20))) delete log[k]
    safeStorage.setJson(MISSION_STORE, log)
  }
  return set
}

/** 이번 주까지 연속으로 미션을 다 한 주 수(이번 주가 아직이면 지난주까지) */
export const missionStreak = (weekKeys: string[], current: string): number => {
  const log = readLog()
  const full = (k: string) => (log[k]?.length ?? 0) >= MISSIONS.length
  const ordered = [...weekKeys].sort().reverse()
  let i = ordered.indexOf(current)
  if (i < 0) return 0
  if (!full(ordered[i])) i += 1
  let n = 0
  for (; i < ordered.length && full(ordered[i]); i++) n++
  return n
}

export const isWeekComplete = (weekKey: string): boolean => (readLog()[weekKey]?.length ?? 0) >= MISSIONS.length

/** 주보 날짜 → 미션 기록 키 */
export const weekKeyOf = (sunday: Date | null, fallback: string) => (sunday ? calendarDateKey(sunday) : fallback)

/* ── 표시 ─────────────────────────────────────────── */

/** "오늘" · "내일" · "11/6(금)" */
export const dayLabel = (d: Date, now: Date): string => {
  const k = daysBetween(now, d)
  if (k === 0) return '오늘'
  if (k === 1) return '내일'
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_KO[d.getDay()]})`
}

export const dayTimeLabel = (d: Date, now: Date) => `${dayLabel(d, now)} ${formatMinutes(d.getHours() * 60 + d.getMinutes())}`
