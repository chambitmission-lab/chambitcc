// 4. 오늘의 일정 — 예배 시간표 합류 · 주보.

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchNewsList } from '../../../../api/news'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useEvents } from '../../../../hooks/useEvents'
import { getSundayServices, getWeekdayServices } from '../../../../api/worship'
import { parseServiceTimes, serviceDays } from '../../../../utils/worshipSchedule'
import { CATEGORY_VISUAL } from '../../../Events/utils/categoryConfig'
import { CalendarIcon } from '../EmotionIcons'
import { Megaphone } from '../../../../components/icons/phosphor'
import type { Event } from '../../../../types/event'
import { worshipKeys } from '../../../../hooks/queryKeys'
import { pick } from './shared'

const todayStr = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── 4. 오늘의 일정 ────────────────────────────────────────────────────

// 예배 시간표(/worship과 같은 데이터·파서) — 오늘 요일에 열리는 고정 예배를
// 일정 위젯에 자동 합류시킨다. 관리자가 일정으로 따로 등록할 필요 없음.
const useWorshipServicesAll = () =>
  useQuery({
    queryKey: worshipKeys.services(),
    queryFn: async () => {
      const [sunday, weekday] = await Promise.all([
        getSundayServices(),
        getWeekdayServices(),
      ])
      return [...sunday, ...weekday]
    },
    // 예배 시간표는 사실상 고정 데이터
    staleTime: 1000 * 60 * 30,
  })

const minutesToLabel = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

const isoToMinutes = (iso: string): number | null => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

// 예배와 등록 일정을 한 타임라인으로 합치기 위한 공통 행 모델
interface ScheduleItem {
  key: string
  startMin: number
  title: string
  location?: string | null
  dot: string
  onClick: () => void
}

// 일정이 없는 날의 플레이스홀더 — "없어요" 한 줄 대신 최신 교회소식 카드로 채운다.
// 소식도 없으면 그때만 빈 문구로 돌아간다. (이번 주 설교 카드는 사용자 요청으로 제외)
const useLatestNewsOne = (enabled: boolean) =>
  useQuery({
    queryKey: ['news', 'rail-latest-one'],
    queryFn: async () => (await fetchNewsList(1, 1)).data.items[0] ?? null,
    enabled,
    staleTime: 1000 * 60 * 15,
    retry: 0,
  })

const shortDate = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}.${d.getDate()}`
}

const PlaceholderSkeleton = () => (
  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-3" aria-hidden>
    <div className="h-2.5 w-14 animate-pulse rounded-full bg-[var(--card-border)]" />
    <div className="mt-2 h-3 w-10/12 animate-pulse rounded-full bg-[var(--card-border)]" />
    <div className="mt-1.5 h-3 w-7/12 animate-pulse rounded-full bg-[var(--card-border)]" />
  </div>
)

const EmptySchedulePlaceholders = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const news = useLatestNewsOne(true)
  const item = news.data ?? null

  if (!news.isLoading && !item) {
    return (
      <p className="py-2 text-center text-[12.5px] text-gray-400 dark:text-white/40">
        {t('homeRailScheduleEmpty')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[11px] text-gray-400 dark:text-white/45">{t('homeRailScheduleEmptyLead')}</p>
      {news.isLoading ? (
        <PlaceholderSkeleton />
      ) : item ? (
        <button
          type="button"
          onClick={() => navigate('/news?tab=news')}
          className="group flex w-full items-start gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-3 text-left transition-colors hover:bg-[var(--brand-soft)]"
        >
          <span className="mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-brand">
            <Megaphone size={15} weight="duotone" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-brand">
              {t('homeRailPlaceholderNews')}
              <span className="font-semibold text-gray-400 dark:text-white/40 tabular-nums">{shortDate(item.published_at)}</span>
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold text-ink-strong group-hover:text-brand">{item.title}</span>
            {item.summary && (
              <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted line-clamp-2">{item.summary}</span>
            )}
          </span>
        </button>
      ) : null}
    </div>
  )
}

const TodayScheduleWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const today = useMemo(() => todayStr(), [])
  const { events, loading: eventsLoading } = useEvents(today, today)
  const { data: services, isLoading: worshipLoading } = useWorshipServicesAll()

  const sorted = useMemo<ScheduleItem[]>(() => {
    const todayDow = new Date().getDay()

    // 고정 예배 — 오늘 요일에 열리는 회차만 (수요기도회처럼 복수 시간이면 회차별 행)
    const worshipItems: ScheduleItem[] = (services ?? [])
      .filter((s) => s.is_active)
      .flatMap((s) => {
        const days = serviceDays(s)
        if (!days || !days.includes(todayDow)) return []
        return parseServiceTimes(s.time).map((startMin) => ({
          key: `worship-${s.id}-${startMin}`,
          startMin,
          title: pick(language, s.name, s.name_en),
          location: pick(language, s.location, s.location_en) || null,
          dot: CATEGORY_VISUAL.worship.dot,
          onClick: () => navigate('/worship'),
        }))
      })

    // 관리자가 등록한 오늘 일정
    const eventItems: ScheduleItem[] = events.flatMap((ev: Event) => {
      const startMin = isoToMinutes(ev.start_datetime)
      if (startMin === null) return []
      const visual = CATEGORY_VISUAL[ev.category] ?? CATEGORY_VISUAL.other
      return [{
        key: `event-${ev.id}`,
        startMin,
        title: ev.title,
        location: ev.location,
        dot: visual.dot,
        onClick: () => navigate(`/events/${ev.id}`),
      }]
    })

    return [...worshipItems, ...eventItems].sort((a, b) => a.startMin - b.startMin)
  }, [services, events, navigate, language])

  // 현재 시각 기준 — 지난 일정은 흐리게, 다음 일정 하나는 브랜드 틴트 행으로 띄운다
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const nextKey = sorted.find((i) => i.startMin >= nowMin)?.key ?? null
  const visible = sorted.slice(0, 5)
  const restCount = sorted.length - visible.length
  const loading = (eventsLoading || worshipLoading) && sorted.length === 0

  return (
    <section className="px-4 pt-3">
      <div className="px-1 mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
          <CalendarIcon size={14} className="shrink-0" /> {t('homeRailTodayTitle')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="text-[11.5px] font-semibold text-ink-muted hover:text-brand transition-colors"
        >
          {t('homeRailViewAll')}
        </button>
      </div>
      <div className="feed-card rounded-2xl p-4">
        {loading ? (
          <p className="text-[12.5px] text-gray-400 dark:text-white/40 text-center py-2">
            {t('homeRailScheduleLoading')}
          </p>
        ) : visible.length === 0 ? (
          <EmptySchedulePlaceholders />
        ) : (
          <ul className="space-y-1">
            {visible.map((item) => {
              const isNext = item.key === nextKey
              const isPast = nextKey !== null ? item.startMin < nowMin && !isNext : item.startMin < nowMin
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`group flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-150 ${
                      isNext
                        ? 'bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]'
                        : 'border border-transparent hover:bg-[var(--surface-inset)]'
                    } ${isPast ? 'opacity-50' : ''}`}
                  >
                    <span className="relative mt-[5px] h-2 w-2 shrink-0" aria-hidden>
                      <span className={`absolute inset-0 rounded-full ${item.dot}`} />
                      {isNext && (
                        <span className={`absolute inset-0 animate-ping rounded-full ${item.dot} opacity-60`} />
                      )}
                    </span>
                    <span
                      className={`mt-px shrink-0 text-[12.5px] font-bold tabular-nums ${
                        isNext ? 'text-brand' : 'text-ink-muted'
                      }`}
                    >
                      {minutesToLabel(item.startMin)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-strong transition-colors group-hover:text-brand">
                        {item.title}
                      </span>
                      {item.location && (
                        <span className="block truncate text-[11.5px] text-gray-400 dark:text-white/45">
                          {item.location}
                        </span>
                      )}
                    </span>
                    {isNext && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-[var(--brand)] px-1.5 py-px text-[10px] font-bold text-white">
                        {t('homeRailScheduleNext')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {restCount > 0 && (
              <li className="pl-[26px] pt-1 text-[11.5px] text-gray-400 dark:text-white/40">
                {t('homeRailScheduleMore').replace('{n}', String(restCount))}
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { TodayScheduleWidget }
