import type { TimelineDomain } from '../../../types/growth'

// 발자취(ActivityTimeline)·지난 8주 돌아보기(GrowthRecap)가 함께 쓰는 도메인 색·날짜 라벨

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 도메인 → 색 변수·라벨. 색은 ActivityTimeline.css 의 --atl-* 를 가리킨다 */
export const DOMAIN_META: Record<TimelineDomain, { label: string; color: string }> = {
  prayer: { label: '기도', color: 'var(--atl-prayer)' },
  bible: { label: '말씀', color: 'var(--atl-bible)' },
  devotional: { label: '묵상', color: 'var(--atl-devotional)' },
  thanks: { label: '감사', color: 'var(--atl-thanks)' },
  community: { label: '나눔', color: 'var(--atl-community)' },
  game: { label: '게임', color: 'var(--atl-game)' },
}

export const DOMAIN_ORDER: TimelineDomain[] = [
  'prayer',
  'bible',
  'devotional',
  'thanks',
  'community',
  'game',
]

export const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

export const dayLabel = (dateStr: string): string => {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === ymdLocal(today)) return '오늘'
  if (dateStr === ymdLocal(yesterday)) return '어제'
  const [y, m, d] = dateStr.split('-').map(Number)
  const wd = WEEKDAY_KO[new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${wd})`
}

/** 발자취의 하루 묶음 앵커 id — 돌아보기 달력에서 그날로 이동할 때 쓴다 */
export const dayAnchorId = (date: string) => `atl-day-${date}`
