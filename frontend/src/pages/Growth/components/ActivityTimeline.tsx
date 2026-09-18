import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TimelineDomain, TimelineEvent } from '../../../types/growth'
import { TimelineEventGlyph } from '../../../components/icons/GrowthIcons'
import './ActivityTimeline.css'

interface ActivityTimelineProps {
  events: TimelineEvent[]
  /** 지금까지 받은 구간(페이지) 수 — 필터 자동 탐색 예산 계산용 */
  pageCount: number
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

/** 상단 유형 필터 — '전체' 또는 도메인 하나 */
type TimelineFilter = 'all' | TimelineDomain

const FILTER_OPTIONS: { key: TimelineFilter; label: string; color: string }[] = [
  { key: 'all', label: '전체', color: 'var(--brand)' },
  ...DOMAIN_ORDER.map((d) => ({ key: d, label: DOMAIN_META[d].label, color: DOMAIN_META[d].color })),
]

/** 필터 결과가 비었을 때 이전 구간(60일)을 자동으로 더 당겨오는 최대 횟수.
    기록이 몇 년치여도 무한정 페이지를 긁지 않도록 상한을 두고, 그 뒤엔
    '이전 기록 더 보기' 버튼으로 사용자가 직접 이어간다 */
const AUTO_LOAD_LIMIT = 3

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
  const meta = DOMAIN_META[event.domain] ?? DOMAIN_META.prayer
  const color = meta.color

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
          {/* 감정에 따라 달라지는 값이라 버리지 않고 제목 앞 작은 글리프로 옮겼다
              (원 배지였을 때보다 훨씬 조용하다). 백엔드 icon 이모지 대신 라인 아이콘을
              쓰고, 색은 이 카드의 도메인 액센트를 그대로 따라간다 */}
          <span
            className="inline-flex align-[-2px] mr-1.5"
            style={{ color }}
            aria-hidden="true"
          >
            <TimelineEventGlyph event={event} size={15} />
          </span>
          {event.title}
        </div>
        {/* 읽기·함께 기도 롤업은 특정 시각이 없다 — 축이 사라졌으니 빈자리를
            채울 필요가 없어 그냥 생략한다 (예전 '종일' 라벨 자리) */}
        <span className="shrink-0 mt-0.5 flex items-center gap-1.5">
          {event.time && (
            <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40 tabular-nums">
              {event.time}
            </span>
          )}
          {/* 도메인 이름 칩 — 액센트 바 색이 무엇인지 카드 스스로 말하게 한다.
              날짜 헤더 범례는 스크롤로 사라지면 기억에 의존해야 했던 문제의 해결 */}
          <span className="atl-domain-chip">{meta.label}</span>
        </span>
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
  pageCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ActivityTimelineProps) => {
  const [filter, setFilter] = useState<TimelineFilter>('all')
  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.domain === filter)),
    [events, filter],
  )
  const dayGroups = useMemo(() => groupByDay(filtered), [filtered])
  const filterLabel = FILTER_OPTIONS.find((f) => f.key === filter)?.label ?? ''

  // 특정 유형만 보는데 지금까지 받은 구간엔 그 유형이 하나도 없으면
  // 이전 구간을 자동으로 몇 번 더 당겨본다. 예산은 "필터를 고른 시점의 페이지 수"
  // 기준으로 세어 effect 안에서 setState 없이 계산한다(필터를 바꾸거나 버튼을
  // 직접 누르면 기준점을 지금으로 옮겨 예산이 되살아난다).
  // inFlight 는 onLoadMore 호출 뒤 isLoadingMore 가 true 로 바뀌기 전
  // 재렌더에서 두 번 부르는 걸 막는 잠금이다
  const [pagesAtSelect, setPagesAtSelect] = useState(pageCount)
  const inFlight = useRef(false)
  const autoLoadExhausted = pageCount - pagesAtSelect >= AUTO_LOAD_LIMIT
  const selectFilter = (next: TimelineFilter) => {
    setFilter(next)
    setPagesAtSelect(pageCount)
    inFlight.current = false
  }
  useEffect(() => {
    if (isLoadingMore) {
      inFlight.current = false
      return
    }
    if (filter === 'all' || filtered.length > 0 || !hasMore) return
    if (inFlight.current || autoLoadExhausted) return
    inFlight.current = true
    onLoadMore()
  }, [filter, filtered.length, hasMore, isLoadingMore, onLoadMore, autoLoadExhausted])

  return (
    // lg+: 한 줄짜리 이벤트 카드라 폭을 다 주면 글이 왼쪽에 몰린다 —
    // 다른 피드형 화면과 같은 읽기 폭으로 묶어 가운데 배치한다
    <div className="px-4 pt-6 pb-10 lg:max-w-[680px] lg:mx-auto">
      <h3 className="text-[14px] font-bold text-ink-strong mb-4 flex items-center gap-2 tracking-[-0.01em]">
        <span className="material-icons-outlined text-xl text-brand">
          history
        </span>
        활동 기록
      </h3>

      {/* 유형별 필터 탭 — 기록이 길어지면 말씀만·기도만 골라 복기할 수 있게.
          칩 색은 카드 액센트 바·도메인 칩과 같은 --atl-* 를 쓴다 */}
      {events.length > 0 && (
        <div
          className="atl-filter scrollbar-hide -mx-4 px-4 mb-4"
          role="tablist"
          aria-label="활동 유형 필터"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = opt.key === filter
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectFilter(opt.key)}
                className={'atl-filter-chip' + (active ? ' is-active' : '')}
                style={{ ['--atl-accent' as string]: opt.color }}
              >
                {opt.key !== 'all' && <span className="atl-filter-dot" aria-hidden="true" />}
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-gray-500 dark:text-white/50">
          아직 기록된 활동이 없어요.
          <br />
          오늘 한 줄 기도, 한 절 읽기부터 시작해보세요.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-gray-500 dark:text-white/50">
          {isLoadingMore ? (
            <>
              {filterLabel} 기록을 찾는 중…
              <br />
              <span className="text-[12px] text-gray-400 dark:text-white/40">
                이전 구간을 이어서 살펴보고 있어요
              </span>
            </>
          ) : hasMore && autoLoadExhausted ? (
            <>
              최근 기록엔 {filterLabel} 활동이 없어요.
              <br />
              <span className="text-[12px] text-gray-400 dark:text-white/40">
                아래 버튼으로 더 이전 기록을 이어서 볼 수 있어요
              </span>
            </>
          ) : (
            <>
              아직 {filterLabel} 기록이 없어요.
            </>
          )}
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
            onClick={() => {
              // 직접 누르면 자동 탐색 횟수를 되돌려, 새 구간도 비어있을 때
              // 다시 최대 3구간까지 이어서 찾아보게 한다
              inFlight.current = true
              setPagesAtSelect(pageCount)
              onLoadMore()
            }}
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
