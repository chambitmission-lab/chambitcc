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
    <div className="relative mx-4 mb-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />
      {/* 헤더 — 달력 제어(오늘/이전/다음)를 우측 한곳에 모아 위계를 정리 */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="text-gray-900 dark:text-white text-[15px] font-bold tracking-[-0.01em]">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToday}
            className="px-3 h-8 mr-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 text-[12px] font-semibold transition-colors"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onPrev}
            className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 flex items-center justify-center transition-colors after:absolute after:-inset-1 after:content-['']"
            aria-label="이전 달"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 flex items-center justify-center transition-colors after:absolute after:-inset-1 after:content-['']"
            aria-label="다음 달"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
              i === 0 ? 'text-rose-500 dark:text-rose-300/90' : i === 6 ? 'text-brand' : 'text-gray-400 dark:text-white/45',
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
                inMonth && !isToday && 'hover:bg-gray-100 dark:hover:bg-white/[0.04]',
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
                      ? 'text-rose-500 dark:text-rose-300'
                      : dow === 6
                        ? 'text-brand'
                        : 'text-gray-700 dark:text-white/85',
                ].join(' ')}
              >
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white font-bold shadow-[0_4px_12px_-2px_var(--brand-glow)]">
                    {d.getDate()}
                  </span>
                ) : (
                  d.getDate()
                )}
              </span>
              {/* 일정 dot — 네온 글로우로 다크 배경에서도 한눈에 보이도록 */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex items-center gap-[3px]">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className={`block w-[5px] h-[5px] rounded-full ${CATEGORY_VISUAL[ev.category].dot} ${CATEGORY_VISUAL[ev.category].dotGlow}`}
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
