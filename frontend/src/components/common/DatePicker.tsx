// 커스텀 달력 — 한국식 표기(YYYY년 M월 D일 (요일))와 브랜드 테마 달력.
// 네이티브 <input type="date">는 브라우저 로케일을 따라 08/02/2026처럼
// 미국식으로 보이고 달력 디자인도 OS 기본이라, 앱 전역에서 이 컴포넌트를 쓴다.
import { useState, useEffect, useMemo, useRef } from 'react'

interface DatePickerProps {
  value: string // YYYY-MM-DD 형식
  onChange: (date: string) => void
  placeholder?: string
  /** 주일(일요일) 중심 필드 — 일요일을 도드라지게 하고 '이번/다음 주일' 빠른 선택을 준다.
   *  다른 요일도 그대로 선택 가능(특별 예배 등 예외 상황). */
  sundayMode?: boolean
  /** 트리거 버튼 스타일 덮어쓰기 — 폼의 다른 입력과 테두리·높이를 맞출 때 */
  className?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

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
const koreanParts = (iso: string) => {
  const p = fromISO(iso)
  if (!p) return null
  const dow = new Date(p.y, p.m, p.d).getDay()
  return { date: `${p.y}년 ${p.m + 1}월 ${p.d}일`, weekday: WEEKDAYS[dow], dow }
}

const formatKorean = (iso: string) => {
  const parts = koreanParts(iso)
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
  placeholder = '날짜를 선택하세요',
  sundayMode = false,
  className,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<'days' | 'months'>('days')
  const parsed = fromISO(value)
  const now = new Date()
  const [view, setView] = useState({
    y: parsed?.y ?? now.getFullYear(),
    m: parsed?.m ?? now.getMonth(),
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // 열 때마다 선택된 날짜의 달로 이동 — 8월을 골라 두고 다시 열었을 때
  // 엉뚱하게 이번 달이 보이던 문제를 막는다. (이펙트가 아니라 여는 시점에
  // 맞춰 두면 여는 순간 이번 달이 한 프레임 스쳐 보이는 일도 없다)
  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    const p = fromISO(value)
    setPanel('days')
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
  const triggerParts = koreanParts(value)

  const pick = (iso: string) => {
    onChange(iso)
    setIsOpen(false)
  }

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

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
          <span className="text-gray-400 dark:text-white/35">{placeholder}</span>
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
          aria-label="날짜 선택"
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] origin-top animate-pop-in rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.35)] dark:border-white/[0.08] dark:bg-card-dark"
        >
          {/* 헤더 — 제목을 누르면 월 선택으로 전환 */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPanel((p) => (p === 'days' ? 'months' : 'days'))}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[15px] font-bold text-ink-strong transition-colors hover:bg-[var(--brand-soft)]"
            >
              {view.y}년 {view.m + 1}월
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform dark:text-white/40 ${panel === 'months' ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => (panel === 'days' ? shiftMonth(-1) : setView((v) => ({ ...v, y: v.y - 1 })))}
                aria-label={panel === 'days' ? '이전 달' : '이전 해'}
                className={navBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => (panel === 'days' ? shiftMonth(1) : setView((v) => ({ ...v, y: v.y + 1 })))}
                aria-label={panel === 'days' ? '다음 달' : '다음 해'}
                className={navBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {panel === 'months' ? (
            /* 월 선택 — 다른 해·먼 달로 한 번에 건너뛴다 */
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MONTHS.map((label, i) => {
                const active = i === view.m
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setView((v) => ({ ...v, m: i }))
                      setPanel('days')
                    }}
                    className={`rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95 ${
                      active
                        ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                        : 'text-ink hover:bg-[var(--brand-soft)]'
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
                {WEEKDAYS.map((w, i) => (
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

                  return (
                    <button
                      key={`${c.iso}-${i}`}
                      type="button"
                      onClick={() => pick(c.iso)}
                      aria-label={formatKorean(c.iso)}
                      aria-pressed={selected}
                      {...(isToday ? { 'aria-current': 'date' as const } : {})}
                      className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-[13px] tabular-nums transition-all active:scale-90 ${
                        selected
                          ? 'bg-brand font-bold text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
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
                  이번 주일
                </button>
                <button
                  type="button"
                  onClick={() => pick(sundayISO(1))}
                  className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
                >
                  다음 주일
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => pick(today)}
                className="flex-1 rounded-xl bg-[var(--brand-soft)] py-2 text-[12px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)] active:scale-95"
              >
                오늘
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
