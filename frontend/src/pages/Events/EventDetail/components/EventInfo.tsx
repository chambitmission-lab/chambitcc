import type { ReactNode } from 'react'
import type { Event } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { toKstCalendarDate } from '../../../../utils/kstTime'
import { formatEventTime, formatEventDateLabel } from '../../utils/dateGrouping'

interface EventInfoProps {
  event: Event
  t: Translation
}

const isSameKstDay = (a: string, b: string): boolean => {
  const d1 = toKstCalendarDate(a)
  const d2 = toKstCalendarDate(b)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const InfoRow = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0 pt-0.5">
      <div className="text-gray-400 dark:text-white/45 text-[11px] font-semibold mb-0.5">{label}</div>
      <div className="text-ink-strong text-[14px] font-semibold leading-[1.45]">{children}</div>
    </div>
  </div>
)

export const EventInfo = ({ event, t }: EventInfoProps) => {
  const sameDay = isSameKstDay(event.start_datetime, event.end_datetime)
  const startLabel = formatEventDateLabel(event.start_datetime)
  const startTime = formatEventTime(event.start_datetime)
  const endLabel = formatEventDateLabel(event.end_datetime)
  const endTime = formatEventTime(event.end_datetime)

  return (
    <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <div className="flex flex-col gap-3.5">
        <InfoRow
          label={`${t.startDate} · ${t.endDate}`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        >
          {sameDay ? (
            <>{startLabel} {startTime} ~ {endTime}</>
          ) : (
            <>
              {startLabel} {startTime}
              <span className="mx-1 text-gray-400 dark:text-white/40">→</span>
              {endLabel} {endTime}
            </>
          )}
        </InfoRow>

        {event.location && (
          <InfoRow
            label={t.location}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          >
            {event.location}
          </InfoRow>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] text-gray-500 dark:text-white/55 text-[12.5px] font-medium">
        <span className="inline-flex items-center gap-1">
          👥 {t.attendanceCount} <span className="text-brand font-bold">{event.attendance_count}</span>
        </span>
        <span className="text-gray-300 dark:text-white/25">·</span>
        <span className="inline-flex items-center gap-1">
          👁️ {t.views} {event.views}
        </span>
      </div>
    </section>
  )
}
