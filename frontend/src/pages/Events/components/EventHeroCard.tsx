import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel } from '../utils/dateGrouping'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'

interface EventHeroCardProps {
  event: Event
}

const EventHeroCard = ({ event }: EventHeroCardProps) => {
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
      className="mx-4 mb-4 w-[calc(100%-2rem)] text-left group block"
    >
      <div
        className={[
          'relative overflow-hidden rounded-3xl p-5',
          'bg-gradient-to-br',
          v.gradient,
          'shadow-[0_18px_44px_-18px_rgba(168,85,247,0.6)]',
          'transition-transform duration-200 group-active:scale-[0.99]',
        ].join(' ')}
      >
        {/* 미세 광택 — 카드 합의안 동일 패턴 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%)',
          }}
        />
        {/* 우상단 점 패턴 */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 opacity-25 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[12px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {dday}
            </span>
            <span className="inline-flex items-center px-2.5 h-7 rounded-full bg-black/20 text-white text-[12px] font-semibold">
              <span className="mr-1">{v.emoji}</span>
              {t.categories[event.category]}
            </span>
          </div>

          <h2 className="text-white text-[22px] font-bold leading-[1.25] tracking-[-0.015em] mb-3 line-clamp-2">
            {event.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-[13px] font-medium">
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateLabel} · {time}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1 max-w-[55%] truncate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3 text-white/90 text-[12.5px] font-medium">
              <span className="inline-flex items-center gap-1">
                👥 <span>{event.attendance_count}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                👁️ <span>{event.views}</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-white text-[13px] font-bold">
              자세히 보기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default EventHeroCard
