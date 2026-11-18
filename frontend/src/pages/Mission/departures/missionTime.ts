// 출발 안내판의 시간·거리 계산 — 현지 시각, 서울과의 시차, 하루의 때(아침·한낮·저녁·밤), 대권 거리.
// 시각은 모두 Intl 타임존으로 구한다(서머타임 자동 반영).

import { SEOUL_GEO } from '../missionData'

const SEOUL_TZ = 'Asia/Seoul'

const fmtCache = new Map<string, Intl.DateTimeFormat>()
const hmFormatter = (tz: string) => {
  let f = fmtCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    fmtCache.set(tz, f)
  }
  return f
}

/** 현지 시각 "HH:MM" */
export const localHM = (tz: string, nowMs: number): string => {
  try {
    return hmFormatter(tz).format(nowMs)
  } catch {
    return '--:--'
  }
}

/** 현지 시각(시 단위 실수, 0~24) */
export const localHour = (tz: string, nowMs: number): number => {
  const [h, m] = localHM(tz, nowMs).split(':').map(Number)
  return Number.isFinite(h) ? h + (m || 0) / 60 : 0
}

export const seoulHM = (nowMs: number) => localHM(SEOUL_TZ, nowMs)

/** 서울 대비 시차(시간, 0.5 단위). "+1h" / "-2h" / "-5.5h" 처럼 쓴다 */
export const offsetFromSeoul = (tz: string, nowMs: number): number => {
  const diff = localHour(tz, nowMs) - localHour(SEOUL_TZ, nowMs)
  // 날짜선을 넘는 경우를 -12~+12 로 접는다
  const folded = ((diff + 36) % 24) - 12
  return Math.round(folded * 2) / 2
}

export const formatOffset = (h: number) => (h === 0 ? '0h' : `${h > 0 ? '+' : ''}${h}h`)

export type DayPhase = 'morning' | 'midday' | 'evening' | 'night'

/** 하루의 때 — 기도 문구와 '지금 이 시간' 카드 하늘빛(Mission.css .now-card--*)이 이걸 따른다 */
export const dayPhase = (hour: number): DayPhase => {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'midday'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

/** "하루를 막 시작한 순" 정렬 키 — 현지 새벽 5시가 0, 그 뒤로 커진다 */
export const morningFirstKey = (hour: number) => (hour - 5 + 24) % 24

/** 서울에서 그곳까지 대권 거리(km) */
export const distanceFromSeoulKm = (to: { lat: number; lng: number }): number => {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(to.lat - SEOUL_GEO.lat)
  const dLng = rad(to.lng - SEOUL_GEO.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(SEOUL_GEO.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

/** 받침 유무로 은/는 — "리마는", "프놈펜은" */
export const topicParticle = (word: string): '은' | '는' => {
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return '는'
  return (code - 0xac00) % 28 !== 0 ? '은' : '는'
}
