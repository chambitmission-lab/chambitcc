// 커스텀 달력 — 한국식 표기(YYYY년 M월 D일 (요일))와 브랜드 테마 달력.
// 네이티브 <input type="date">는 브라우저 로케일을 따라 08/02/2026처럼
// 미국식으로 보이고 달력 디자인도 OS 기본이라, 앱 전역에서 이 컴포넌트를 쓴다.
// 앱 언어(ko/en)를 따라 라벨·표기가 바뀐다 — 영어 화면에서도 그대로 쓸 수 있게.
import { useState, useEffect, useMemo, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface DatePickerProps {
  value: string // YYYY-MM-DD 형식
  onChange: (date: string) => void
  placeholder?: string
  /** 주일(일요일) 중심 필드 — 일요일을 도드라지게 하고 '이번/다음 주일' 빠른 선택을 준다.
   *  다른 요일도 그대로 선택 가능(특별 예배 등 예외 상황). */
  sundayMode?: boolean
  /** 트리거 버튼 스타일 덮어쓰기 — 폼의 다른 입력과 테두리·높이를 맞출 때 */
  className?: string
  /** 생년월일 필드 — 연도 선택으로 열리고, 미래 날짜는 막고, '오늘' 버튼을 숨긴다 */
  birthMode?: boolean
  /** 선택 가능 하한/상한 (YYYY-MM-DD, 포함) */
  minDate?: string
  maxDate?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

/* 영어 라벨 — 2글자 요일은 S/T 중복 없이 좁은 격자에 들어가는 최소 단위 */
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAYS_EN_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_EN_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/* 화면에 나가는 문구 — 언어별로 한 곳에 모아 둔다 */
const TEXT = {
  ko: {
    placeholder: '날짜를 선택하세요',
    dialog: '날짜 선택',
    today: '오늘',
    thisSunday: '이번 주일',
    nextSunday: '다음 주일',
    pickYear: '연도 다시 고르기',
    prev: (unit: string) => `이전 ${unit}`,
    next: (unit: string) => `다음 ${unit}`,
    units: { days: '달', months: '해', years: '12년' },
  },
  en: {
    placeholder: 'Select a date',
    dialog: 'Select date',
    today: 'Today',
    thisSunday: 'This Sunday',
    nextSunday: 'Next Sunday',
    pickYear: 'Change year',
    prev: (unit: string) => `Previous ${unit}`,
    next: (unit: string) => `Next ${unit}`,
    units: { days: 'month', months: 'year', years: '12 years' },
  },
} as const

/** 연도 격자 한 장에 담는 개수 — 3열 × 4행 (월 선택 격자와 같은 모양) */
const YEAR_PAGE = 12

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const fromISO = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null
}
const todayISO = () => {
  const t = new Date()
  return toISO(t.getFullYear(), t.getMonth(), t.getDate())
}
// 다가오는 주일(일요일) — 오늘이 일요일이면 오늘
const sundayISO = (weeksAhead = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7) + weeksAhead * 7)
  return toISO(d.getFullYear(), d.getMonth(), d.getDate())
}

/** 트리거에서 요일만 따로 색칠할 수 있게 조각으로 돌려준다 */
const dateParts = (iso: string, isEn: boolean) => {
  const p = fromISO(iso)
  if (!p) return null
  const dow = new Date(p.y, p.m, p.d).getDay()
  return {
    date: isEn ? `${MONTHS_EN[p.m]} ${p.d}, ${p.y}` : `${p.y}년 ${p.m + 1}월 ${p.d}일`,
    weekday: isEn ? WEEKDAYS_EN_LONG[dow] : WEEKDAYS[dow],
    dow,
  }
}

const formatFull = (iso: string, isEn: boolean) => {
  const parts = dateParts(iso, isEn)
  return parts ? `${parts.date} (${parts.weekday})` : ''
}

// 일요일 빨강 · 토요일 파랑 — 한국 달력 관례
const dowTone = (dow: number) =>
  dow === 0
    ? 'text-rose-500 dark:text-rose-400'
    : dow === 6
      ? 'text-sky-600 dark:text-sky-400'
      : 'text-gray-400 dark:text-white/45'

/** 해당 달을 6주(42칸) 그리드로 — 앞뒤 달 날짜로 빈칸을 메운다 */
const buildGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1).getDay()
  const cells: Array<{ d: number; iso: string; inMonth: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const dt = new Date(year, month, i - first + 1)
    cells.push({
      d: dt.getDate(),
      iso: toISO(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      inMonth: dt.getMonth() === month,
    })
  }
  return cells
}

const DatePicker = ({
  value,
  onChange,
  placeholder,
  sundayMode = false,
  className,
  birthMode = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const { language } = useLanguage()
  const isEn = language === 'en'
  const text = isEn ? TEXT.en : TEXT.ko
  const weekdayLabels = isEn ? WEEKDAYS_EN : WEEKDAYS
  /* 월 격자는 3열이라 영어는 3글자 약어 — 'September'는 칸을 넘긴다 */
  const monthLabels = isEn ? MONTHS_EN : MONTHS
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<'days' | 'months' | 'years'>('days')
  const parsed = fromISO(value)
  const now = new Date()
  /* 고른 값이 없으면 언제나 올해·이번 달에서 출발한다 — 생년월일도 마찬가지로
   * 임의의 과거 연도를 기본값처럼 보여주지 않는다 (연도 격자로 뒤로 넘겨 고른다) */
  const [view, setView] = useState({
    y: parsed?.y ?? now.getFullYear(),
    m: parsed?.m ?? now.getMonth(),
  })
  const containerRef = useRef<HTMLDivElement>(null)

  /* 생년월일은 미래가 있을 수 없으니 오늘을 상한으로 둔다 (maxDate가 오면 그쪽 우선) */
  const upperBound = maxDate ?? (birthMode ? todayISO() : undefined)
  // ISO 문자열은 사전순 비교가 곧 날짜 비교
  const isOutOfRange = (iso: string) =>
    (minDate !== undefined && iso < minDate) || (upperBound !== undefined && iso > upperBound)

  // 열 때마다 선택된 날짜의 달로 이동 — 8월을 골라 두고 다시 열었을 때
  // 엉뚱하게 이번 달이 보이던 문제를 막는다. (이펙트가 아니라 여는 시점에
  // 맞춰 두면 여는 순간 이번 달이 한 프레임 스쳐 보이는 일도 없다)
  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    const p = fromISO(value)
    /* 생년월일은 값이 없으면 연도부터 — 1990년대를 찾으려 달 화살표를
     * 수백 번 누르게 하지 않는다. 이미 고른 값이 있으면 그 달을 보여준다. */
    setPanel(birthMode && !p ? 'years' : 'days')
    if (p) setView({ y: p.y, m: p.m })
    setIsOpen(true)
  }

  // 바깥 클릭 · Esc 로 닫기
  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const cells = useMemo(() => buildGrid(view.y, view.m), [view])
  const today = todayISO()
  const triggerParts = dateParts(value, isEn)

  const pick = (iso: string) => {
    if (isOutOfRange(iso)) return
    onChange(iso)
    setIsOpen(false)
  }

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  /* 화살표는 보고 있는 패널의 단위로 움직인다 — 일: 한 달, 월: 한 해, 연: 12년 */
  const shiftView = (delta: number) => {
    if (panel === 'days') shiftMonth(delta)
    else if (panel === 'months') setView((v) => ({ ...v, y: v.y + delta }))
    else setView((v) => ({ ...v, y: v.y + delta * YEAR_PAGE }))
  }

  /* 제목을 누를 때마다 일 → 월 → 연 → 일로 좁혔다 넓힌다 */
  const cyclePanel = () =>
    setPanel((p) => (p === 'days' ? 'months' : p === 'months' ? 'years' : 'days'))

  const yearPageStart = Math.floor(view.y / YEAR_PAGE) * YEAR_PAGE
  const navLabels = text.units

  const navBtn =
    'grid h-8 w-8 place-items-center rounded-lg text-gray-500 dark:text-white/60 transition-colors hover:bg-[var(--brand-soft)] hover:text-brand active:scale-95'

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={
          className ??
          // brand 계열은 CSS 변수 색이라 border-brand/60 같은 투명도 수식자가
          // Tailwind에서 생성되지 않는다 — 단색 토큰이나 arbitrary 값으로 쓴다
          'flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-[14px] text-ink-strong transition-colors hover:border-brand focus:border-brand focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03]'
        }
      >
        {/* 형식이 깨진 값이 들어와도 빈칸으로 보이지 않게 원문을 그대로 노출 */}
        {!value ? (
          <span className="text-gray-400 dark:text-white/35">{placeholder ?? text.placeholder}</span>
        ) : !triggerParts ? (
          <span className="font-semibold">{value}</span>
        ) : (
          <span className="font-semibold tabular-nums">
            {triggerParts.date}{' '}
            <span className={dowTone(triggerParts.dow)}>({triggerParts.weekday})</span>
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-colors ${isOpen ? 'text-brand' : 'text-gray-400 dark:text-white/40'}`}
        >
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </button>

      {/* 달력 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={text.dialog}
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] origin-top animate-pop-in rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.35)] dark:border-white/[0.08] dark:bg-card-dark"
        >
          {/* 헤더 — 제목을 누르면 일 → 월 → 연 순으로 넓혀 고른다 */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={cyclePanel}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[15px] font-bold text-ink-strong transition-colors hover:bg-[var(--brand-soft)]"
            >
              {panel === 'years'
                ? `${yearPageStart} ~ ${yearPageStart + YEAR_PAGE - 1}${isEn ? '' : '년'}`
                : panel === 'months'
                  ? `${view.y}${isEn ? '' : '년'}`
                  : isEn
                    ? `${MONTHS_EN_LONG[view.m]} ${view.y}`
                    : `${view.y}년 ${view.m + 1}월`}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform dark:text-white/40 ${panel !== 'days' ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => shiftView(-1)}
                aria-label={text.prev(navLabels[panel])}
                className={navBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => shiftView(1)}
                aria-label={text.next(navLabels[panel])}
                className={navBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {panel === 'years' ? (
            /* 연도 선택 — 생년월일처럼 먼 해로 갈 때 12년씩 넘긴다 */
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {Array.from({ length: YEAR_PAGE }, (_, i) => yearPageStart + i).map((year) => {
                /* 채워진 강조는 '실제로 고른 값'에만 — 보고 있는 해를 칠하면
                 * 아무것도 안 골랐는데 이미 선택된 것처럼 보인다. 올해는 테두리로만 표시. */
                const selected = parsed?.y === year
                const isCurrentYear = year === now.getFullYear()
                /* 그 해가 통째로 범위를 벗어나면(예: 미래) 고를 수 없다 */
                const disabled =
                  isOutOfRange(toISO(year, 11, 31)) && isOutOfRange(toISO(year, 0, 1))
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setView((v) => ({ ...v, y: year }))
                      setPanel('months')
                    }}
                    className={`rounded-xl py-2.5 text-[13px] font-semibold tabular-nums transition-all active:scale-95 ${
                      selected
                        ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                        : disabled
                          ? 'cursor-not-allowed text-gray-300 dark:text-white/20'
                          : `text-ink hover:bg-[var(--brand-soft)]${
                              isCurrentYear ? ' font-bold ring-1 ring-inset ring-brand' : ''
                            }`
                    }`}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          ) : panel === 'months' ? (
            /* 월 선택 — 다른 해·먼 달로 한 번에 건너뛴다 */
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {monthLabels.map((label, i) => {
                /* 연도 격자와 같은 규칙 — 고른 달만 채우고, 이번 달은 테두리로만 */
                const selected = parsed?.y === view.y && parsed?.m === i
                const isCurrentMonth = view.y === now.getFullYear() && i === now.getMonth()
                /* 그 달의 하루도 고를 수 없으면 비활성 */
                const lastDay = new Date(view.y, i + 1, 0).getDate()
                const disabled =
                  isOutOfRange(toISO(view.y, i, 1)) && isOutOfRange(toISO(view.y, i, lastDay))
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setView((v) => ({ ...v, m: i }))
                      setPanel('days')
                    }}
                    className={`rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95 ${
                      selected
                        ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                        : disabled
                          ? 'cursor-not-allowed text-gray-300 dark:text-white/20'
                          : `text-ink hover:bg-[var(--brand-soft)]${
                              isCurrentMonth ? ' font-bold ring-1 ring-inset ring-brand' : ''
                            }`
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              {/* 요일 */}
              <div className="grid grid-cols-7">
                {weekdayLabels.map((w, i) => (
                  <div
                    key={w}
                    className={`py-1 text-center text-[11px] font-bold ${
                      i === 0
                        ? 'text-rose-500 dark:text-rose-400'
                        : i === 6
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-gray-400 dark:text-white/40'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* 날짜 */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((c, i) => {
                  const col = i % 7
                  const selected = c.iso === value
                  const isToday = c.iso === today

                  // 일요일은 빨강·토요일은 파랑 — 한국 달력 관례.
                  // 주일 모드에서는 여기에 더해 일요일을 굵게 하고 평일·토요일을
                  // 한 단계 물러나게 해서, 색을 바꾸지 않고도 주일이 먼저 눈에 들어온다.
                  let tone = 'text-gray-300 dark:text-white/20' // 앞뒤 달 날짜
                  if (c.inMonth) {
                    if (col === 0) {
                      tone = `text-rose-500 dark:text-rose-400${sundayMode ? ' font-bold' : ''}`
                    } else if (col === 6) {
                      tone = sundayMode
                        ? 'text-sky-600/70 dark:text-sky-400/70'
                        : 'text-sky-600 dark:text-sky-400'
                    } else {
                      tone = sundayMode ? 'text-ink-muted' : 'text-ink-strong'
                    }
                  }

                  const disabled = isOutOfRange(c.iso)

                  return (
                    <button
                      key={`${c.iso}-${i}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(c.iso)}
                      aria-label={formatFull(c.iso, isEn)}
                      aria-pressed={selected}
                      {...(isToday ? { 'aria-current': 'date' as const } : {})}
                      className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-[13px] tabular-nums transition-all active:scale-90 ${
                        selected
                          ? 'bg-brand font-bold text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                          : disabled
                            ? 'cursor-not-allowed text-gray-300 dark:text-white/15'
                            : `${tone} hover:bg-[var(--brand-soft)] ${isToday ? 'font-bold ring-1 ring-inset ring-brand' : ''}`
                      }`}
                    >
                      {c.d}
                      {/* 주일 표식 — 선택 전에도 어느 칸이 주일인지 한눈에 */}
                      {sundayMode && col === 0 && c.inMonth && !selected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rose-500 dark:bg-rose-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 빠른 선택 */}
          <div className="mt-2 flex gap-1.5 border-t border-black/[0.05] pt-2 dark:border-white/[0.06]">
            {sundayMode ? (
              <>
                <button
                  type="button"
                  onClick={() => pick(sundayISO(0))}
                  className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
                >
                  {text.thisSunday}
                </button>
                <button
                  type="button"
                  onClick={() => pick(sundayISO(1))}
                  className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
                >
                  {text.nextSunday}
                </button>
              </>
            ) : birthMode ? (
              /* 생년월일엔 '오늘'이 의미가 없다 — 대신 연도 격자로 되돌아가는 길을 준다 */
              <button
                type="button"
                onClick={() => setPanel('years')}
                className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
              >
                {text.pickYear}
              </button>
            ) : (
              !isOutOfRange(today) && (
                <button
                  type="button"
                  onClick={() => pick(today)}
                  className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
                >
                  {text.today}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
