// 예배 시간 계산 — 요일·차수 라벨 · 진행 상태 판정 · 무드 · 교회력 절기 · 필터 키.

import type { Language } from '../../../locales'
import type { WorshipService } from '../../../types/worship'
import { DAY_CHARS, parseServiceTimes, serviceDays, type Occurrence } from '../../../utils/worshipSchedule'

// 평일 예배 종류별 emblem 아이콘 (새벽/수요/금요·기타)
const weekdayIcon = (name: string): string => {
  if (name.includes('새벽')) return 'wb_twilight'
  if (name.includes('수요')) return 'menu_book'
  return 'volunteer_activism'
}

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

// 표시 전용 — 영어 모드에서 _en 값이 있으면 사용, 없으면 한글로 폴백.
// 요일/시간 파싱 등 로직은 항상 한글 원본 필드를 사용한다.
const pick = (language: Language, ko: string | undefined | null, en: string | undefined | null): string =>
  (language === 'en' && en) ? en : (ko ?? '')

// 주일 예배 부수 표기 — ko: "1부", en: "1st"
const orderLabel = (order: number, language: Language): string => {
  if (language !== 'en') return `${order}부`
  const suffix = order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'
  return `${order}${suffix}`
}

// 추천 배너는 시작 15분 전까지만 해당 예배를 노출한다.
// 그 이후엔 이동 시간을 고려해 다음 예배를 추천하는 편이 현실적이기 때문.
const RECOMMEND_LEAD_MIN = 15
// 예배 진행 시간 가정치 — '예배 중' 표시 판정에만 사용
const SERVICE_DURATION_MIN = 60
// 시작 30분 전 ~ 시작 10분 후까지를 '입장 가능'으로 본다
const OPEN_BEFORE_MIN = 30
const OPEN_AFTER_MIN = 10

type ServiceStatus = 'waiting' | 'open' | 'ongoing' | 'ended'

// 오늘 열리는 예배의 현재 상태. 오늘 예배가 아니면 null (배지 없음).
const serviceStatusToday = (service: WorshipService, seoulNow: Date): ServiceStatus | null => {
  const days = serviceDays(service)
  if (!days || !days.includes(seoulNow.getDay())) return null
  const times = parseServiceTimes(service.time)
  if (times.length === 0) return null
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
  for (const t of times) {
    if (nowMin < t - OPEN_BEFORE_MIN) return 'waiting'
    if (nowMin <= t + OPEN_AFTER_MIN) return 'open'
    if (nowMin < t + SERVICE_DURATION_MIN) return 'ongoing'
  }
  return 'ended'
}

// ko: "1시간 30분" / en: "1 hr 30 min"
const formatRemaining = (minutes: number, language: Language, hourUnit: string, minuteUnit: string): string => {
  const sep = language === 'en' ? ' ' : ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}${sep}${hourUnit} ${m}${sep}${minuteUnit}`
  if (h > 0) return `${h}${sep}${hourUnit}`
  return `${m}${sep}${minuteUnit}`
}

// ko: "오전 11:20" / en: "11:20 AM"
const formatTimeLabel = (startMin: number, language: Language): string => {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  const clock = `${h12}:${String(m).padStart(2, '0')}`
  if (language === 'en') return `${clock} ${h < 12 ? 'AM' : 'PM'}`
  return `${h < 12 ? '오전' : '오후'} ${clock}`
}

const dayLabel = (occ: Occurrence, seoulNow: Date, language: Language, today: string, tomorrow: string): string => {
  if (occ.dayOffset === 0) return today
  if (occ.dayOffset === 1) return tomorrow
  const day = (seoulNow.getDay() + occ.dayOffset) % 7
  return language === 'en' ? DAY_NAMES_EN[day] : `${DAY_CHARS[day]}요일`
}

/* ── 감성 레이어: 시간대 무드 ─────────────────────────────
 * 예배 시작 시각 → 그 시간의 '빛'. 히어로 하늘·서사 문구·이모지가 이 무드를 따른다.
 * 새벽기도회(5:30)=여명, 주일 낮=낮, 수요 저녁(19:30)=노을, 금요(20:30)=밤 */
type Mood = 'dawn' | 'day' | 'dusk' | 'night'

const moodOfTime = (startMin: number): Mood => {
  const h = startMin / 60
  if (h < 7) return 'dawn'
  if (h < 16) return 'day'
  if (h < 20) return 'dusk'
  return 'night'
}

const NARRATIVE_KEY = {
  dawn: 'worshipNarrativeDawn',
  day: 'worshipNarrativeDay',
  dusk: 'worshipNarrativeDusk',
  night: 'worshipNarrativeNight'
} as const

// 예배별 한 줄 초대 문구 — 이름 기반 프리셋
const taglineKey = (service: WorshipService) => {
  if (service.service_type === 'sunday') return 'worshipTaglineSunday' as const
  if (service.name.includes('새벽')) return 'worshipTaglineDawn' as const
  if (service.name.includes('수요')) return 'worshipTaglineWednesday' as const
  if (service.name.includes('금요')) return 'worshipTaglineFriday' as const
  return 'worshipTaglineDefault' as const
}

/* ── 교회력 절기 ─────────────────────────────────────────
 * 대림절·성탄절기·사순절·부활절기·추수감사주간에 히어로에 배지가 얹힌다.
 * 색은 전례색 시맨틱: 대림·사순=보라, 성탄·부활·추수감사=앰버(빛/영광) */
interface LiturgicalSeason {
  labelKey: 'worshipSeasonAdvent' | 'worshipSeasonChristmas' | 'worshipSeasonLent' | 'worshipSeasonEaster' | 'worshipSeasonThanksgiving'
  emoji: string
  tone: 'violet' | 'amber'
}

// 부활절 날짜 — 그레고리력 컴퓨투스 (Anonymous Gregorian algorithm)
const easterOf = (y: number): Date => {
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month - 1, day)
}

const DAY_MS = 86_400_000

const liturgicalSeason = (now: Date): LiturgicalSeason | null => {
  const y = now.getFullYear()
  const ts = new Date(y, now.getMonth(), now.getDate()).getTime()
  const at = (yy: number, m: number, d: number) => new Date(yy, m, d).getTime()

  // 성탄절기: 12/25 ~ 1/6 (주현절)
  if (ts >= at(y, 11, 25) || ts <= at(y, 0, 6)) {
    return { labelKey: 'worshipSeasonChristmas', emoji: '⭐', tone: 'amber' }
  }
  // 대림절: 성탄 전 네 번째 주일 ~ 12/24
  const christmasDow = new Date(y, 11, 25).getDay()
  const adventStart = at(y, 11, 25 - (christmasDow === 0 ? 7 : christmasDow) - 21)
  if (ts >= adventStart) {
    return { labelKey: 'worshipSeasonAdvent', emoji: '🕯️', tone: 'violet' }
  }
  const easter = easterOf(y).getTime()
  // 사순절: 재의 수요일(부활절 46일 전) ~ 부활절 전날
  if (ts >= easter - 46 * DAY_MS && ts < easter) {
    return { labelKey: 'worshipSeasonLent', emoji: '✝️', tone: 'violet' }
  }
  // 부활절기: 부활절 ~ 오순절(50일)
  if (ts >= easter && ts <= easter + 49 * DAY_MS) {
    return { labelKey: 'worshipSeasonEaster', emoji: '🌷', tone: 'amber' }
  }
  // 추수감사주간: 11월 셋째 주일로 끝나는 한 주 (한국 교회 관례)
  const firstSunday = 1 + ((7 - new Date(y, 10, 1).getDay()) % 7)
  const thirdSunday = at(y, 10, firstSunday + 14)
  if (ts > thirdSunday - 7 * DAY_MS && ts <= thirdSunday) {
    return { labelKey: 'worshipSeasonThanksgiving', emoji: '🍂', tone: 'amber' }
  }
  return null
}

type DayFilter = 'today' | 'all' | 'sunday' | 'weekday'

const FILTER_KEY = {
  today: 'worshipFilterToday',
  all: 'worshipFilterAll',
  sunday: 'worshipFilterSunday',
  weekday: 'worshipFilterWeekday'
} as const

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { weekdayIcon, DAY_NAMES_EN, pick, orderLabel, RECOMMEND_LEAD_MIN, OPEN_BEFORE_MIN, serviceStatusToday, formatRemaining, formatTimeLabel, dayLabel, moodOfTime, NARRATIVE_KEY, taglineKey, liturgicalSeason, FILTER_KEY }
export type { ServiceStatus, Mood, DayFilter }
