import { useMemo } from 'react'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { buildEventDateMap } from '../utils/dateGrouping'

interface MiniMonthStripProps {
  date: Date
  events: Event[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSelectDate?: (d: Date) => void
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

const formatKey = (d: Date) =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`

const MiniMonthStrip = ({ date, events, onPrev, onNext, onToday, onSelectDate }: MiniMonthStripProps) => {
  const eventMap = useMemo(() => buildEventDateMap(events), [events])
  const today = new Date()
  const todayKey = formatKey(today)

  const cells = useMemo(() => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const list: { d: Date; inMonth: boolean }[] = []

    // 앞쪽 패딩 (지난 달 마지막 며칠)
    for (let i = startDayOfWeek; i > 0; i--) {
      list.push({ d: new Date(year, month, 1 - i), inMonth: false })
    }
    // 이번 달
    for (let i = 1; i <= daysInMonth; i++) {
      list.push({ d: new Date(year, month, i), inMonth: true })
    }
    // 6주 = 42칸으로 맞추는 대신 행 단위로만 채움
    while (list.length % 7 !== 0) {
      const last = list[list.length - 1].d
      list.push({ d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
    }
    return list
  }, [date])

  const monthLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월`

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-[#1c1c26] border border-white/[0.06] overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onToday}
          className="px-2.5 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white/80 text-[12px] font-semibold transition-colors"
        >
          오늘
        </button>
        <div className="text-white text-[15px] font-bold tracking-[-0.01em]">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/80 flex items-center justify-center transition-colors"
            aria-label="이전 달"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/80 flex items-center justify-center transition-colors"
            aria-label="다음 달"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={[
              'text-center text-[11px] font-bold py-1',
              i === 0 ? 'text-pink-300/80' : i === 6 ? 'text-purple-300/80' : 'text-white/45',
            ].join(' ')}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
        {cells.map(({ d, inMonth }, idx) => {
          const key = formatKey(d)
          const dayEvents = eventMap.get(key) ?? []
          const isToday = key === todayKey
          const dow = d.getDay()

          return (
            <button
              key={idx}
              type="button"
              disabled={!inMonth}
              onClick={() => inMonth && onSelectDate?.(d)}
              className={[
                'relative aspect-square flex flex-col items-center justify-center rounded-xl transition-colors',
                !inMonth && 'opacity-30 cursor-default',
                inMonth && !isToday && 'hover:bg-white/[0.04]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'text-[13px] font-semibold leading-none',
                  isToday
                    ? 'text-white'
                    : dow === 0
                      ? 'text-pink-300'
                      : dow === 6
                        ? 'text-purple-300'
                        : 'text-white/85',
                ].join(' ')}
              >
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-[0_4px_12px_-2px_rgba(168,85,247,0.6)]">
                    {d.getDate()}
                  </span>
                ) : (
                  d.getDate()
                )}
              </span>
              {/* 일정 dot */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className={`block w-1 h-1 rounded-full ${CATEGORY_VISUAL[ev.category].dot}`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MiniMonthStrip
