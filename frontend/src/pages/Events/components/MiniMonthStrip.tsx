import { Fragment, useMemo } from 'react'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { buildEventDateMap } from '../utils/dateGrouping'
import { kstNow } from '../../../utils/kstTime'

interface MiniMonthStripProps {
  date: Date
  events: Event[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSelectDate?: (d: Date) => void
  /** 배치 여백 — 본문(mx-4)과 우측 레일(여백 없음)이 같은 컴포넌트를 공유한다 */
  className?: string
  /** 고른 날(YYYY-MM-DD) — 테두리+바탕으로 표시 */
  selectedKey?: string | null
  /**
   * PC 레일용 큰 달력 — 날짜 18px·칸 높이 70px, 일정은 점 대신 "N개" 글자로.
   * 어르신이 모니터 거리에서 점 색을 구분하기 어렵다
   */
  large?: boolean
  /** 공휴일 'YYYY-MM-DD' → 이름 (임시·대체공휴일 포함). 일요일처럼 붉게, 큰 달력은 이름까지 */
  holidays?: Map<string, string>
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 큰 달력 칸(폭 ~50px)용 짧은 이름 — '대체공휴일(개천절)' 은 칸에 '대체휴일', 전체는 title·고른 날 패널에
const shortHolidayName = (name: string) => (name.startsWith('대체공휴일') ? '대체휴일' : name)

const formatKey = (d: Date) =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`

const MiniMonthStrip = ({
  date,
  events,
  onPrev,
  onNext,
  onToday,
  onSelectDate,
  className = 'mx-4 mb-4',
  selectedKey = null,
  large = false,
  holidays,
}: MiniMonthStripProps) => {
  const eventMap = useMemo(() => buildEventDateMap(events), [events])
  const today = kstNow()  // 서울 기준 '오늘'
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

  // 작은 달력은 칸에 이름이 안 들어가 아래에 이번 달 공휴일을 한 줄로 모아 보여 준다
  const monthHolidays = useMemo(() => {
    if (large || !holidays) return []
    return cells
      .filter(c => c.inMonth && holidays.has(formatKey(c.d)))
      .map(c => ({ day: c.d.getDate(), name: holidays.get(formatKey(c.d)) as string }))
  }, [cells, holidays, large])

  return (
    <div className={`relative rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden ${className}`}>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />
      {/* 헤더 — 달력 제어(오늘/이전/다음)를 우측 한곳에 모아 위계를 정리 */}
      <div className={`flex items-center justify-between ${large ? 'px-5 py-3.5' : 'px-4 py-2.5'}`}>
        <div className={`text-ink-strong font-bold tracking-[-0.01em] ${large ? 'text-[21px]' : 'text-[15px]'}`}>{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToday}
            className={`${large ? 'px-4 h-10 text-[15px]' : 'px-3 h-8 text-[12px]'} mr-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 font-semibold transition-colors`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onPrev}
            className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 flex items-center justify-center transition-colors after:absolute after:-inset-1 after:content-['']"
            aria-label="이전 달"
          >
            <svg width={large ? 19 : 15} height={large ? 19 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/80 flex items-center justify-center transition-colors after:absolute after:-inset-1 after:content-['']"
            aria-label="다음 달"
          >
            <svg width={large ? 19 : 15} height={large ? 19 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
              `text-center font-bold py-1 ${large ? 'text-[14px]' : 'text-[11px]'}`,
              i === 0 ? 'text-rose-500 dark:text-rose-300/90' : i === 6 ? 'text-brand' : 'text-gray-400 dark:text-white/45',
            ].join(' ')}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className={`grid grid-cols-7 px-2 pb-3 ${large ? 'gap-1' : 'gap-y-1'}`}>
        {cells.map(({ d, inMonth }, idx) => {
          const key = formatKey(d)
          const dayEvents = eventMap.get(key) ?? []
          const isToday = key === todayKey
          const isSelected = inMonth && key === selectedKey
          const dow = d.getDay()
          const holidayName = holidays?.get(key)
          // 공휴일은 요일과 상관없이 일요일과 같은 붉은색
          const isRedDay = dow === 0 || !!holidayName

          return (
            <button
              key={idx}
              type="button"
              disabled={!inMonth}
              onClick={() => inMonth && onSelectDate?.(d)}
              aria-pressed={onSelectDate ? isSelected : undefined}
              aria-label={
                large && inMonth
                  ? `${d.getMonth() + 1}월 ${d.getDate()}일${isToday ? ' 오늘' : ''}${holidayName ? ` ${holidayName}` : ''}${dayEvents.length ? ` 일정 ${dayEvents.length}개` : ''}`
                  : undefined
              }
              title={holidayName}
              className={[
                'relative flex flex-col items-center rounded-xl transition-colors',
                large ? 'min-h-[70px] justify-start pt-1.5 pb-1 gap-1 border-2' : 'aspect-square justify-center',
                large && (isSelected ? 'border-brand bg-[var(--brand-soft)]' : 'border-transparent'),
                !inMonth && 'opacity-30 cursor-default',
                inMonth && !isToday && !isSelected && 'hover:bg-gray-100 dark:hover:bg-white/[0.04]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  `${large ? 'text-[18px]' : 'text-[13px]'} font-semibold leading-none`,
                  isToday
                    ? 'text-white'
                    : isRedDay
                      ? 'text-rose-500 dark:text-rose-300'
                      : dow === 6
                        ? 'text-brand'
                        : 'text-gray-700 dark:text-white/85',
                ].join(' ')}
              >
                {isToday ? (
                  <span className={`inline-flex items-center justify-center ${large ? 'w-8 h-8' : 'w-7 h-7'} rounded-full bg-brand text-white font-bold shadow-[0_4px_12px_-2px_var(--brand-glow)]`}>
                    {d.getDate()}
                  </span>
                ) : (
                  d.getDate()
                )}
              </span>
              {/* 큰 달력: 공휴일 이름 — 칸 폭에 맞춰 말줄임(전체는 title·aria-label) */}
              {large && holidayName && (
                <span className="max-w-full px-0.5 truncate text-[11.5px] font-semibold leading-none text-rose-500 dark:text-rose-300">
                  {shortHolidayName(holidayName)}
                </span>
              )}
              {/* 큰 달력: 점 대신 "N개" 글자 — 색을 구분하지 않아도 읽힌다 */}
              {large && dayEvents.length > 0 && (
                <span className="px-1.5 rounded-md bg-brand text-white text-[12.5px] font-bold leading-[1.5] tabular-nums">
                  {dayEvents.length}개
                </span>
              )}
              {/* 일정 dot — 네온 글로우로 다크 배경에서도 한눈에 보이도록 */}
              {!large && dayEvents.length > 0 && (
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

      {monthHolidays.length > 0 && (
        <div className="mx-3 mb-3 -mt-1 px-3 py-2 rounded-xl bg-rose-50/70 dark:bg-rose-400/[0.07] text-[12px] leading-[1.6] text-rose-600 dark:text-rose-300 break-keep">
          {/* 항목 사이 공백이 줄바꿈 자리 — 항목 안(날짜+이름)은 끊지 않는다 */}
          {monthHolidays.map((h, i) => (
            <Fragment key={h.day}>
              {i > 0 && <span className="text-rose-300 dark:text-rose-300/40"> · </span>}
              <span className="whitespace-nowrap">
                <span className="font-bold tabular-nums">{h.day}일</span> {h.name}
              </span>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

export default MiniMonthStrip
