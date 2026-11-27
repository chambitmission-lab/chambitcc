// 공동 기도제목 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { WeeklyPrayerListItem } from '../../../types/weeklyPrayer'

export type WpSeg = 'all' | 'published' | 'hidden'

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 다가오는 주일(일요일) 'YYYY-MM-DD' — 오늘이 일요일이면 오늘 */
export const upcomingSunday = (from = new Date()): string => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return ymd(d)
}

/** 'YYYY-MM-DD' → 그날 자정 Date (UTC 로 읽혀 하루 밀리지 않게) */
export const weekDateOf = (weekDate: string) => new Date(`${weekDate}T00:00:00`)

/** 이번 주 · 앞으로(미리 써 둔 주) · 지난 주 */
export const weekPhase = (weekDate: string, sunday = upcomingSunday()): 'this' | 'future' | 'past' =>
  weekDate === sunday ? 'this' : weekDate > sunday ? 'future' : 'past'

export const filterWeeks = (list: WeeklyPrayerListItem[], seg: WpSeg) =>
  list
    .filter((p) => seg === 'all' || (seg === 'published') === p.is_published)
    .sort((a, b) => (a.week_date < b.week_date ? 1 : -1))

/** 새로 쓸 주일 — 다가오는 주일부터 아직 기도제목이 없는 첫 주일 (미리 써 둔 주는 건너뛴다) */
export const nextFreeSunday = (list: Pick<WeeklyPrayerListItem, 'week_date'>[], from = new Date()): string => {
  const taken = new Set(list.map((p) => p.week_date))
  const d = weekDateOf(upcomingSunday(from))
  for (let i = 0; i < 52 && taken.has(ymd(d)); i++) d.setDate(d.getDate() + 7)
  return ymd(d)
}
