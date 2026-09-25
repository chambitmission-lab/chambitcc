import type { EventAttendance } from '../../../../types/event'
import type { Translation } from '../../../../locales'

interface AttendeesCardProps {
  attendances?: EventAttendance[]
  t: Translation
}

const MAX_VISIBLE = 12

export const AttendeesCard = ({ attendances, t }: AttendeesCardProps) => {
  const attending = attendances?.filter(a => a.status === 'attending') ?? []
  const maybeCount = attendances?.filter(a => a.status === 'maybe').length ?? 0
  const notAttendingCount = attendances?.filter(a => a.status === 'not_attending').length ?? 0

  if (attending.length === 0 && maybeCount === 0) return null

  const visible = attending.slice(0, MAX_VISIBLE)
  const overflow = attending.length - visible.length

  const subCounts = [
    maybeCount > 0 ? t.attendeesMaybeCount.replace('{count}', String(maybeCount)) : null,
    notAttendingCount > 0
      ? t.attendeesNotAttendingCount.replace('{count}', String(notAttendingCount))
      : null,
  ].filter(Boolean)

  return (
    <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4 lg:p-6">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-ink-strong text-[15px] lg:text-[20px] font-bold tracking-[-0.01em]">
          🙌 {t.attendees}
        </h2>
        {attending.length > 0 && (
          <span className="inline-flex items-center px-2 h-5 lg:px-2.5 lg:h-7 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] lg:text-[14px] font-bold">
            {attending.length}
          </span>
        )}
      </div>

      {attending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {visible.map(a => {
            const name = a.user_name?.trim() || t.anonymous
            return (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 h-7 lg:h-10 lg:pr-3.5 lg:gap-2 rounded-full bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.06] text-gray-700 dark:text-white/80 text-[12px] lg:text-[15.5px] font-semibold"
              >
                <span className="w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-[var(--brand-soft-strong)] text-brand text-[10.5px] lg:text-[14px] font-bold flex items-center justify-center">
                  {name.charAt(0)}
                </span>
                {name}
              </span>
            )
          })}
          {overflow > 0 && (
            <span className="inline-flex items-center px-2.5 h-7 lg:h-10 lg:px-3.5 rounded-full bg-gray-50 dark:bg-white/[0.05] text-gray-500 dark:text-white/55 text-[12px] lg:text-[15.5px] font-semibold">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {subCounts.length > 0 && (
        <p className={`text-gray-400 dark:text-white/45 text-[12px] lg:text-[15px] font-medium ${attending.length > 0 ? 'mt-2.5' : ''}`}>
          {subCounts.join(' · ')}
        </p>
      )}
    </section>
  )
}
