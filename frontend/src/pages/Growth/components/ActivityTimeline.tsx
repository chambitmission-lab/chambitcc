import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TimelineEvent } from '../../../types/growth'

interface ActivityTimelineProps {
  events: TimelineEvent[]
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

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

const TimelineNode = ({ icon }: { icon: string }) => (
  <div className="relative shrink-0 w-10 flex flex-col items-center">
    <div
      className="
        z-10 w-9 h-9 rounded-full flex items-center justify-center text-[17px]
        bg-brand
        shadow-[0_2px_8px_var(--brand-glow)]
        ring-4 ring-background-light dark:ring-background-dark
      "
    >
      {icon}
    </div>
    {/* 세로 연결선 */}
    <div className="absolute top-9 bottom-0 w-px bg-gradient-to-b from-[var(--brand-soft-strong)] to-transparent" />
  </div>
)

const EventRow = ({ event }: { event: TimelineEvent }) => {
  const navigate = useNavigate()
  const clickable = !!event.link
  return (
    <div className="flex gap-3">
      <TimelineNode icon={event.icon} />
      <button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && navigate(event.link as string)}
        className={
          'flex-1 min-w-0 text-left mb-3 rounded-xl px-3.5 py-3 ' +
          'bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] ' +
          'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] ' +
          (clickable ? 'transition-transform active:scale-[0.99] hover:-translate-y-px' : '')
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[14px] font-bold text-gray-900 dark:text-white leading-snug tracking-[-0.01em]">
            {event.title}
          </div>
          {event.time && (
            <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40 tabular-nums pt-0.5">
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
    </div>
  )
}

const ActivityTimeline = ({
  events,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ActivityTimelineProps) => {
  let lastMonth = ''
  let lastDate = ''

  return (
    <div className="px-4 pt-6 pb-10">
      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 tracking-[-0.01em]">
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
          {events.map((event) => {
            const mKey = monthKey(event.date)
            const showMonth = mKey !== lastMonth
            const showDay = event.date !== lastDate
            lastMonth = mKey
            lastDate = event.date
            return (
              <Fragment key={event.id}>
                {showMonth && (
                  <div className="flex items-center gap-3 mt-5 mb-3 first:mt-0">
                    <span className="text-[12px] font-bold text-brand">
                      {monthLabel(event.date)}
                    </span>
                    <span className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
                  </div>
                )}
                {showDay && (
                  <div className="pl-[52px] mb-1.5">
                    <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55">
                      {dayLabel(event.date)}
                    </span>
                  </div>
                )}
                <EventRow event={event} />
              </Fragment>
            )
          })}
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
