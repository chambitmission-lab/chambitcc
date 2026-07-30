import type { TimelineDomain, TimelineEvent } from '../../../types/growth'

/**
 * 프로필의 두 진입 카드(신앙 여정 / 이번 주 스토리)가 공유하는 날짜별 활동 집계.
 *
 * 백엔드 타임라인은 이벤트 목록만 주므로, 화면에서 필요한 "하루 한 칸" 형태로
 * 접어준다. 날짜 비교는 ActivityTimeline과 같은 로컬 기준을 따른다
 * (백엔드가 KST naive를 주고 사용자는 국내에 있다는 전제).
 */

export interface DayCell {
  date: string
  /** 0=일 … 6=토 */
  weekday: number
  isToday: boolean
  /** 이번 주 칸 중 아직 오지 않은 날 */
  isFuture: boolean
  count: number
  domains: TimelineDomain[]
  /** 대표 이벤트 이모지 (백엔드가 주는 icon) */
  icon: string | null
}

/** 하루에 여러 도메인이 겹칠 때 대표로 세울 순서 */
const DOMAIN_PRIORITY: TimelineDomain[] = [
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

interface DayBucket {
  count: number
  domains: Set<TimelineDomain>
  iconByDomain: Map<TimelineDomain, string>
}

const bucketByDate = (events: TimelineEvent[] | undefined) => {
  const map = new Map<string, DayBucket>()
  events?.forEach((e) => {
    let bucket = map.get(e.date)
    if (!bucket) {
      bucket = { count: 0, domains: new Set(), iconByDomain: new Map() }
      map.set(e.date, bucket)
    }
    bucket.count += 1
    bucket.domains.add(e.domain)
    if (e.icon && !bucket.iconByDomain.has(e.domain)) {
      bucket.iconByDomain.set(e.domain, e.icon)
    }
  })
  return map
}

const toCell = (date: Date, bucket: DayBucket | undefined, today: string): DayCell => {
  const ymd = ymdLocal(date)
  const domains = bucket ? DOMAIN_PRIORITY.filter((d) => bucket.domains.has(d)) : []
  return {
    date: ymd,
    weekday: date.getDay(),
    isToday: ymd === today,
    isFuture: ymd > today,
    count: bucket?.count ?? 0,
    domains,
    icon: domains.length ? (bucket?.iconByDomain.get(domains[0]) ?? null) : null,
  }
}

/** 최근 N일 (오래된 → 오늘). 신앙 여정 카드의 발자국 스트립용 */
export const buildRecentCells = (
  events: TimelineEvent[] | undefined,
  days: number,
): DayCell[] => {
  const buckets = bucketByDate(events)
  const now = new Date()
  const today = ymdLocal(now)
  const cells: DayCell[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    cells.push(toCell(d, buckets.get(ymdLocal(d)), today))
  }
  return cells
}

/** 이번 주 일~토 7칸 (아직 오지 않은 날도 빈 칸으로 자리를 잡는다) */
export const buildWeekCells = (events: TimelineEvent[] | undefined): DayCell[] => {
  const buckets = bucketByDate(events)
  const now = new Date()
  const today = ymdLocal(now)
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  const cells: DayCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    cells.push(toCell(d, buckets.get(ymdLocal(d)), today))
  }
  return cells
}

/**
 * 이번 주를 한 줄로 요약하는 문구 — 숫자만 반복하지 않고 어떤 활동으로
 * 채웠는지에 따라 문장이 달라진다. (프로필 상단 통계 카드가 이미
 * "이번 주 N번"을 크게 보여주므로 같은 숫자를 또 헤드라인에 쓰지 않는다)
 */
export const weekNarrative = (cells: DayCell[], language: 'ko' | 'en'): string => {
  const activeDays = cells.filter((c) => c.count > 0).length
  const domains = new Set<TimelineDomain>()
  cells.forEach((c) => c.domains.forEach((d) => domains.add(d)))

  const hasPrayer = domains.has('prayer')
  const hasBible = domains.has('bible')
  const hasDevotional = domains.has('devotional')

  if (language === 'en') {
    if (activeDays >= 6) return 'You filled the whole week'
    if (hasPrayer && hasBible && hasDevotional) return 'Prayer, the Word and meditation'
    if (hasPrayer && hasBible) return 'A week held by the Word and prayer'
    if (hasDevotional) return 'A week soaked in meditation'
    if (hasBible) return 'A week spent beside the Word'
    if (hasPrayer) return 'A week carried on in prayer'
    return `${activeDays} day${activeDays > 1 ? 's' : ''} of footprints this week`
  }

  if (activeDays >= 6) return '한 주를 꽉 채웠어요'
  if (hasPrayer && hasBible && hasDevotional) return '기도와 말씀, 묵상까지 닿은 한 주'
  if (hasPrayer && hasBible) return '말씀과 기도로 채운 한 주'
  if (hasDevotional) return '묵상으로 마음을 적신 한 주'
  if (hasBible) return '말씀 곁에 머문 한 주'
  if (hasPrayer) return '기도로 이어간 한 주'
  return `이번 주 ${activeDays}일의 발자국`
}

/** 발자국 진하기 — 활동 수에 따라 3단계 */
export const cellLevel = (count: number): 0 | 1 | 2 | 3 => {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
export const WEEKDAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
