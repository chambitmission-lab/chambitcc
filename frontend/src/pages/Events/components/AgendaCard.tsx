import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel } from '../utils/dateGrouping'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'

interface AgendaCardProps {
  event: Event
  showDDay?: boolean
}

const AgendaCard = ({ event, showDDay = true }: AgendaCardProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const v = CATEGORY_VISUAL[event.category]
  const dday = formatDDay(event.start_datetime)
  const time = formatEventTime(event.start_datetime)
  const dateLabel = formatEventDateLabel(event.start_datetime)

  return (
    <button
      type="button"
      onClick={() => navigate(`/events/${event.id}`)}
      className="w-full text-left group"
    >
      <article
        className="relative overflow-hidden rounded-2xl bg-[#1c1c26] border border-white/[0.06] transition-all group-hover:border-white/[0.12] group-hover:bg-[#1e1e2a] group-active:scale-[0.995]"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
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

        <div className="relative pl-4 pr-4 py-3.5">
          {/* 상단: 날짜 + D-Day */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white/55 text-[11.5px] font-semibold tracking-wide">
              {dateLabel}
            </span>
            <span className="text-white/30 text-[11px]">·</span>
            <span className="text-white/75 text-[11.5px] font-semibold">{time}</span>
            {showDDay && (
              <span
                className={`ml-auto inline-flex items-center px-2 h-5 rounded-full ${v.chipBg} ${v.chipText} text-[10.5px] font-bold tracking-wide`}
              >
                {dday}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h3 className="text-white text-[15.5px] font-bold leading-[1.35] tracking-[-0.012em] mb-2 line-clamp-2">
            <span className="mr-1.5">{v.emoji}</span>
            {event.title}
          </h3>

          {/* 메타 */}
          <div className="flex items-center gap-3 text-white/55 text-[12px] font-medium">
            <span
              className={`inline-flex items-center px-1.5 h-5 rounded-md ${v.chipBg} ${v.chipText} text-[10.5px] font-bold`}
            >
              {t.categories[event.category]}
            </span>
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
              <span>👥</span>
              <span>{event.attendance_count}</span>
            </span>
          </div>
        </div>
      </article>
    </button>
  )
}

export default AgendaCard
