import { Fragment, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TimelineDomain, TimelineEvent } from '../../../types/growth'
import './ActivityTimeline.css'

interface ActivityTimelineProps {
  events: TimelineEvent[]
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 도메인 → 색 변수·라벨. 색은 ActivityTimeline.css 의 --atl-* 를 가리킨다 */
const DOMAIN_META: Record<TimelineDomain, { label: string; color: string }> = {
  prayer: { label: '기도', color: 'var(--atl-prayer)' },
  bible: { label: '말씀', color: 'var(--atl-bible)' },
  devotional: { label: '묵상', color: 'var(--atl-devotional)' },
  thanks: { label: '감사', color: 'var(--atl-thanks)' },
  community: { label: '나눔', color: 'var(--atl-community)' },
  game: { label: '게임', color: 'var(--atl-game)' },
}

const DOMAIN_ORDER: TimelineDomain[] = [
  'prayer',
  'bible',
  'devotional',
  'thanks',
  'community',
  'game',
]

const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

const dayLabel = (dateStr: string): string => {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === ymdLocal(today)) return '오늘'
  if (dateStr === ymdLocal(yesterday)) return '어제'
  const [y, m, d] = dateStr.split('-').map(Number)
  const wd = WEEKDAY_KO[new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${wd})`
}

const monthLabel = (dateStr: string): string => {
  const [y, m] = dateStr.split('-').map(Number)
  return `${y}년 ${m}월`
}

const monthKey = (dateStr: string) => dateStr.slice(0, 7)

interface DayGroup {
  date: string
  events: TimelineEvent[]
  /** 그날의 도메인별 개수 (표시 순서대로) */
  domainCounts: { domain: TimelineDomain; count: number }[]
  /** 이 그룹에서 달이 바뀌는지 — 월 구분선 표시용 */
  showMonth: boolean
}

const groupByDay = (events: TimelineEvent[]): DayGroup[] => {
  const groups: DayGroup[] = []
  const index = new Map<string, DayGroup>()
  events.forEach((e) => {
    let group = index.get(e.date)
    if (!group) {
      group = { date: e.date, events: [], domainCounts: [], showMonth: false }
      index.set(e.date, group)
      groups.push(group)
    }
    group.events.push(e)
  })
  let lastMonth = ''
  groups.forEach((group) => {
    const mKey = monthKey(group.date)
    group.showMonth = mKey !== lastMonth
    lastMonth = mKey

    const counts = new Map<TimelineDomain, number>()
    group.events.forEach((e) => counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1))
    group.domainCounts = DOMAIN_ORDER.filter((d) => counts.has(d)).map((d) => ({
      domain: d,
      count: counts.get(d) as number,
    }))
  })
  return groups
}

const EventRow = ({ event }: { event: TimelineEvent }) => {
  const navigate = useNavigate()
  const clickable = !!event.link
  const color = DOMAIN_META[event.domain]?.color ?? 'var(--atl-prayer)'

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && navigate(event.link as string)}
      className={
        'atl-card block w-full min-w-0 text-left mb-2.5 rounded-xl pl-4 pr-3.5 py-3 ' +
        'bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] ' +
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] ' +
        (clickable ? 'transition-transform active:scale-[0.99] hover:-translate-y-px' : '')
      }
      style={{ ['--atl-accent' as string]: color }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 text-[14px] font-bold text-ink-strong leading-snug tracking-[-0.01em]">
          {/* 이모지는 기도·묵상·감사에서 그때의 감정에 따라 달라지는 값이라 버리지 않고
              제목 앞 작은 글리프로 옮겼다 (원 배지였을 때보다 훨씬 조용하다) */}
          <span className="mr-1.5 text-[15px]" aria-hidden="true">
            {event.icon}
          </span>
          {event.title}
        </div>
        {/* 읽기·함께 기도 롤업은 특정 시각이 없다 — 축이 사라졌으니 빈자리를
            채울 필요가 없어 그냥 생략한다 (예전 '종일' 라벨 자리) */}
        {event.time && (
          <span className="shrink-0 mt-0.5 text-[11px] font-semibold text-gray-400 dark:text-white/40 tabular-nums">
            {event.time}
          </span>
        )}
      </div>
      {event.snippet && (
        <p className="mt-1 text-[12.5px] text-gray-600 dark:text-white/60 leading-relaxed line-clamp-2">
          {event.snippet}
        </p>
      )}
    </button>
  )
}

const ActivityTimeline = ({
  events,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ActivityTimelineProps) => {
  const dayGroups = useMemo(() => groupByDay(events), [events])

  return (
    <div className="px-4 pt-6 pb-10">
      <h3 className="text-[14px] font-bold text-ink-strong mb-4 flex items-center gap-2 tracking-[-0.01em]">
        <span className="material-icons-outlined text-xl text-brand">
          history
        </span>
        활동 기록
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-gray-500 dark:text-white/50">
          아직 기록된 활동이 없어요.
          <br />
          오늘 한 줄 기도, 한 절 읽기부터 시작해보세요.
        </div>
      ) : (
        <div>
          {dayGroups.map((group) => (
              <Fragment key={group.date}>
                {group.showMonth && (
                  <div className="flex items-center gap-3 mt-5 mb-3 first:mt-0">
                    <span className="text-[12px] font-bold text-brand">
                      {monthLabel(group.date)}
                    </span>
                    <span className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
                  </div>
                )}

                {/* 하루 헤더 — 날짜 + 그날 무엇을 했는지 한 줄 요약.
                    색 이름이 곧 범례 역할을 해서 아래 카드 액센트 바의 색이 저절로 읽힌다 */}
                <div className="pl-1 mb-1.5 mt-4 first:mt-0 flex items-baseline gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55">
                    {dayLabel(group.date)}
                  </span>
                  <span className="atl-day-domains">
                    {group.domainCounts.map(({ domain, count }) => (
                      <span
                        key={domain}
                        className="atl-day-domain"
                        style={{ ['--atl-dot' as string]: DOMAIN_META[domain].color }}
                      >
                        {DOMAIN_META[domain].label} {count}
                      </span>
                    ))}
                  </span>
                </div>

                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </Fragment>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="
              px-5 py-2.5 rounded-full text-[13px] font-semibold
              text-brand
              bg-[var(--brand-soft)]
              border border-[var(--brand-soft-strong)]
              disabled:opacity-60 transition-colors
            "
          >
            {isLoadingMore ? '불러오는 중…' : '이전 기록 더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ActivityTimeline
