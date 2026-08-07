import type { Event } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { CATEGORY_VISUAL } from '../../utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel } from '../../utils/dateGrouping'

interface EventHeroProps {
  event: Event
  t: Translation
}

export const EventHero = ({ event, t }: EventHeroProps) => {
  const v = CATEGORY_VISUAL[event.category]
  const dday = formatDDay(event.start_datetime)
  const time = formatEventTime(event.start_datetime)
  const dateLabel = formatEventDateLabel(event.start_datetime)

  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl p-5 mx-4',
        'bg-gradient-to-br',
        v.gradient,
        'shadow-[0_18px_44px_-18px_var(--brand-glow)]',
        // 다크: 목록 Hero 카드와 동일한 엣지 처리 (글로우 절제 + 1px 빛줄)
        'dark:border dark:border-white/10',
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_36px_-20px_rgba(0,0,0,0.8)]',
      ].join(' ')}
    >
      {/* 다크 전용 비네트 — 목록 Hero 카드와 동일 */}
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background:
            'radial-gradient(135% 135% at 30% 20%, rgba(8,14,36,0) 45%, rgba(8,14,36,0.35) 100%)',
        }}
      />
      {/* 미세 광택 — 목록 Hero 카드와 동일 패턴 */}
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
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[12px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {dday}
          </span>
          <span className="inline-flex items-center px-2.5 h-7 rounded-full bg-black/20 text-white text-[12px] font-semibold">
            <span className="mr-1">{v.emoji}</span>
            {t.categories[event.category]}
          </span>
          {event.group && (
            <span
              className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[12px] font-semibold"
              aria-label={t.groupOnlyBadge}
            >
              <span aria-hidden="true">{event.group.icon || '🔒'}</span>
              {t.groupOnlyBadge} · {event.group.name}
            </span>
          )}
        </div>

        <h1 className="text-white text-[23px] font-bold leading-[1.28] tracking-[-0.015em] mb-3">
          {event.title}
        </h1>

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
            <span className="inline-flex items-center gap-1 max-w-[55%]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
