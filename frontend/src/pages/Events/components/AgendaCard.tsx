import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { formatDDay, formatEventStartTime, formatEventDateLabel } from '../utils/dateGrouping'
import { parseKstDate } from '../../../utils/kstTime'
import { useNowMs } from '../../../hooks/useNowMs'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'
import { CategoryIcon } from './CategoryIcons'
import { queryClient } from '../../../config/queryClient'
import { prefetchEventDetail } from '../../../hooks/useEvents'
import { preloadRoute } from '../../../utils/routePreload'

interface AgendaCardProps {
  /** 카드가 그리는 칸만 받는다(전체 Event 를 넘겨도 된다) */
  event: Pick<Event, 'id' | 'title' | 'category' | 'start_datetime' | 'end_datetime' | 'location' | 'rsvp_deadline' | 'attendance_count'>
  showDDay?: boolean
}

const AgendaCard = ({ event, showDDay = true }: AgendaCardProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const v = CATEGORY_VISUAL[event.category]
  const dday = formatDDay(event.start_datetime)
  const time = formatEventStartTime(event)
  const dateLabel = formatEventDateLabel(event.start_datetime)
  // 마감 여부는 상세에 들어가지 않아도 목록에서 바로 보이게 (KST 기준)
  const nowMs = useNowMs()
  const rsvpClosed = !!event.rsvp_deadline && parseKstDate(event.rsvp_deadline).getTime() <= nowMs

  // 상세 청크와 상세 응답을 터치·호버 순간에 같이 띄운다 (히어로 카드와 동일)
  const warm = () => {
    void preloadRoute(`/events/${event.id}`)
    prefetchEventDetail(queryClient, event.id)
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/events/${event.id}`)}
      onMouseEnter={warm}
      onTouchStart={warm}
      className="w-full text-left group"
    >
      <article
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all group-hover:border-[var(--brand-soft-strong)] group-hover:bg-[var(--brand-soft)] group-active:scale-[0.995]"
      >
        {/* 좌측 컬러 바 */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${v.gradient}`}
        />
        {/* 미세 그라데이션 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%, rgba(255,255,255,0.015) 100%)',
          }}
        />

        <div className="relative pl-4 pr-4 py-3.5 lg:pl-6 lg:pr-5 lg:py-5">
          {/* 상단: 날짜 + D-Day */}
          <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
            <span className="text-gray-500 dark:text-white/55 text-[11.5px] lg:text-[15.5px] lg:text-gray-600 lg:dark:text-white/70 font-semibold tracking-wide">
              {dateLabel}
            </span>
            <span className="text-gray-300 dark:text-white/30 text-[11px] lg:text-[15px]">·</span>
            <span className="text-gray-600 dark:text-white/75 text-[11.5px] lg:text-[16.5px] lg:text-brand font-semibold lg:font-bold">{time}</span>
            {showDDay && (
              <span
                className={`ml-auto inline-flex items-center px-2 h-5 lg:px-2.5 lg:h-7 rounded-full ${v.chipBg} ${v.chipText} text-[10.5px] lg:text-[13.5px] font-bold tracking-wide`}
              >
                {dday}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h3 className="text-ink-strong text-[15.5px] lg:text-[20px] font-bold leading-[1.35] tracking-[-0.012em] mb-2 lg:mb-3 line-clamp-2">
            <CategoryIcon
              category={event.category}
              width={14}
              height={14}
              className="inline-block align-[-1px] mr-1.5 text-brand"
            />
            {event.title}
          </h3>

          {/* 메타 */}
          <div className="flex items-center gap-3 text-gray-500 dark:text-white/55 text-[12px] lg:text-[15.5px] lg:text-gray-600 lg:dark:text-white/70 font-medium">
            <span
              className={`inline-flex items-center px-1.5 h-5 lg:px-2 lg:h-7 rounded-md ${v.chipBg} ${v.chipText} text-[10.5px] lg:text-[13.5px] font-bold`}
            >
              {t.categories[event.category]}
            </span>
            {rsvpClosed && (
              <span className="inline-flex items-center px-1.5 h-5 lg:px-2 lg:h-7 rounded-md bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55 text-[10.5px] lg:text-[13.5px] font-bold shrink-0">
                {t.rsvpClosedBadge}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1 min-w-0 max-w-[55%]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{event.location}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 ml-auto shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              <span>{event.attendance_count}</span>
            </span>
          </div>
        </div>
      </article>
    </button>
  )
}

export default AgendaCard
