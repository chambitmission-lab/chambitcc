import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { KO_WEEKDAYS, calendarDateKey, kstNow } from '../../../utils/date'
import { buildEventDateMap, formatEventStartTime } from '../utils/dateGrouping'
import { daysLeftLabel } from '../utils/weekPostcards'
import '../styles/weekPostcard.css'
import '../styles/wallCalendar.css'

/**
 * /events 달력 — 교회에서 나눠 주던 벽달력 한 장(A) + 그 아래 하루 한 장 일력(D).
 * 칸 안에 일정 이름이 그대로 인쇄돼 있어 누르지 않아도 무슨 날인지 보이고,
 * 점선 아래 일력 칸엔 고른 날(없으면 오늘) 일정이 늘 펼쳐져 있다.
 * 시안 /#/dev/events-calendar (a·d)
 */

interface WallCalendarProps {
  date: Date
  events: Event[]
  /** 공휴일 'YYYY-MM-DD' → 이름 (임시·대체공휴일 포함) */
  holidays?: Map<string, string>
  /** 고른 날(YYYY-MM-DD). 없으면 이번 달을 볼 때 오늘을 펼친다 */
  selectedKey: string | null
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSelectDate: (d: Date) => void
  /** 일력 넘기기(전날·다음 날) — 달이 바뀌면 달력도 따라 넘긴다 */
  onStepDay: (d: Date) => void
  /** PC 레일에서만 — 종이 맨 아래 '다가오는 일정' */
  upcoming?: { event: Event; key: string }[]
  className?: string
}

// 달마다 손글씨 한마디 (0 = 1월)
const MONTH_WORD = [
  '새 마음으로 여는 달',
  '말씀으로 겨울을 나는 달',
  '새싹처럼 돋아나는 달',
  '부활의 기쁨을 나누는 달',
  '가정을 돌아보는 달',
  '푸르게 자라는 달',
  '쉼을 배우는 달',
  '한여름 은혜의 달',
  '열매를 기다리는 달',
  '열매 맺는 달',
  '감사가 익어 가는 달',
  '기다림의 달',
]
// 일력 한마디 (0 = 주일)
const SUNDAY_WORD = [
  '오늘은 주일, 예배당에서 만나요',
  '주일까지 여섯 밤',
  '주일까지 다섯 밤',
  '주일까지 네 밤',
  '주일까지 세 밤',
  '주일까지 두 밤',
  '내일이 주일이에요',
]

const parseKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const weekdayName = (d: Date) => (d.getDay() === 0 ? '주일' : `${KO_WEEKDAYS[d.getDay()]}요일`)
const fullDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdayName(d)}`
const shortHolidayName = (name: string) => (name.startsWith('대체공휴일') ? '대체휴일' : name)

/** 칸에 인쇄할 짧은 이름 — 우리말은 끝 낱말이 알맹이("…를 위한 공동의회" → "공동의회") */
const shortTitle = (title: string): string => {
  const words = title.trim().split(/\s+/)
  const last = words[words.length - 1]
  return last.length <= 2 && words.length > 1 ? words.slice(-2).join('') : last
}
/** 끝에 붙는 행사 낱말 — 줄을 낱말 경계에서 끊는 데 쓴다(긴 것부터) */
const LABEL_TAILS = [
  '기도회', '수련회', '부흥회', '헌신예배', '감사절', '세미나',
  '예배', '주일', '기도', '대회', '교육', '의회', '집회', '모임', '축제', '잔치', '행사',
  '김장', '심방', '세례', '입교', '성찬', '특강', '캠프', '여행', '찬양', '봉사', '훈련', '공부',
]
/** 칸 폭(네 글자)에 맞춰 두 줄로 — 낱말 중간에서 끊지 않는다
 *  "학습·세례·입교" → 학습 / 세례·입교, "추수감사주일" → 추수감사 / 주일, "새벽기도회" → 새벽 / 기도회 */
const twoLines = (label: string): string[] => {
  if (label.length <= 4) return [label]
  // 1) 가운뎃점으로 이어진 이름은 점 자리에서 — 두 줄 중 긴 쪽이 가장 짧아지는 곳
  const parts = label.split('·')
  if (parts.length > 1) {
    let best: string[] | null = null
    for (let i = 1; i < parts.length; i++) {
      const lines = [parts.slice(0, i).join('·'), parts.slice(i).join('·')]
      if (!best || Math.max(...lines.map((l) => l.length)) < Math.max(...best.map((l) => l.length))) best = lines
    }
    if (best && best.every((l) => l.replace(/·/g, '').length <= 4)) return best
  }
  // 2) 끝 낱말(기도회·주일·대회…)을 아랫줄로
  const tail = LABEL_TAILS.find((t) => label.endsWith(t) && label.length - t.length >= 1 && label.length - t.length <= 4)
  if (tail) return [label.slice(0, -tail.length), tail]
  // 3) 그 밖엔 글자 수로 고르게
  const cut = Math.min(4, Math.ceil(label.length / 2))
  return [label.slice(0, cut), label.slice(cut, cut + 4)]
}

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={dir === 'l' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
  </svg>
)

const WallCalendar = ({
  date,
  events,
  holidays,
  selectedKey,
  onPrev,
  onNext,
  onToday,
  onSelectDate,
  onStepDay,
  upcoming,
  className = '',
}: WallCalendarProps) => {
  const navigate = useNavigate()
  const eventMap = useMemo(() => buildEventDateMap(events), [events])
  const today = kstNow() // 서울 기준 '오늘'
  const todayKey = calendarDateKey(today)
  const year = date.getFullYear()
  const month = date.getMonth()

  const cells = useMemo(() => {
    const lead = new Date(year, month, 1).getDay()
    const days = new Date(year, month + 1, 0).getDate()
    const list: { d: Date; inMonth: boolean }[] = []
    for (let i = lead; i > 0; i--) list.push({ d: new Date(year, month, 1 - i), inMonth: false })
    for (let i = 1; i <= days; i++) list.push({ d: new Date(year, month, i), inMonth: true })
    while (list.length % 7 !== 0) list.push({ d: new Date(year, month, list.length - lead + 1), inMonth: false })
    return list
  }, [year, month])

  // 일력에 펼칠 날 — 고른 날, 없으면 (이번 달을 볼 때만) 오늘
  const viewingThisMonth = year === today.getFullYear() && month === today.getMonth()
  const shownKey = selectedKey ?? (viewingThisMonth ? todayKey : null)
  const shown = shownKey ? parseKey(shownKey) : null
  const shownEvents = shownKey ? (eventMap.get(shownKey) ?? []) : []
  const shownHoliday = shownKey ? holidays?.get(shownKey) : undefined
  const shownRed = !!shown && (shown.getDay() === 0 || !!shownHoliday)

  // 일정 없는 날엔 그 뒤 가장 가까운 일정으로 이어 준다
  const nextKey =
    shownKey && shownEvents.length === 0 ? [...eventMap.keys()].filter((k) => k > shownKey).sort()[0] : undefined
  const nextAfter = nextKey ? { key: nextKey, event: eventMap.get(nextKey)![0] } : null

  const step = (n: number) => {
    if (shown) onStepDay(new Date(shown.getFullYear(), shown.getMonth(), shown.getDate() + n))
  }
  const open = (id: number) => navigate(`/events/${id}`)

  return (
    <article className={`wpc wcal ${className}`}>
      {/* 머리 — 큰 달 숫자 + 손글씨 한마디 */}
      <header className="wcal-head">
        <span className="wcal-month wpc-serif" aria-hidden="true">{month + 1}</span>
        <h2 className="wcal-year">
          {year}년<span className="sr-only"> {month + 1}월</span>
        </h2>
        <div className="wcal-nav">
          <button type="button" onClick={onToday} className="wcal-nav-today">오늘</button>
          <button type="button" onClick={onPrev} aria-label="이전 달" className="wcal-nav-btn"><Chevron dir="l" /></button>
          <button type="button" onClick={onNext} aria-label="다음 달" className="wcal-nav-btn"><Chevron dir="r" /></button>
        </div>
        <p className="wpc-hand wcal-word">{MONTH_WORD[month]}</p>
      </header>

      <div className="wcal-wds" aria-hidden="true">
        {KO_WEEKDAYS.map((w, i) => (
          <span key={w} className={i === 0 ? 'is-red' : i === 6 ? 'is-sat' : ''}>{w}</span>
        ))}
      </div>

      <div className="wcal-grid">
        {cells.map(({ d, inMonth }) => {
          const key = calendarDateKey(d)
          const list = inMonth ? (eventMap.get(key) ?? []) : []
          const holidayName = holidays?.get(key)
          const isToday = key === todayKey
          const isSelected = inMonth && key === selectedKey
          // 공휴일은 요일과 상관없이 주일과 같은 붉은색
          const tone = d.getDay() === 0 || holidayName ? 'is-red' : d.getDay() === 6 ? 'is-sat' : ''
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDate(d)}
              aria-pressed={inMonth ? isSelected : undefined}
              aria-label={
                inMonth
                  ? `${fullDay(d)}${isToday ? ' 오늘' : ''}${holidayName ? ` ${holidayName}` : ''}${list.length ? ` 일정 ${list.length}개: ${list.map((e) => e.title).join(', ')}` : ''}`
                  : undefined
              }
              title={holidayName}
              className={`wcal-cell ${inMonth ? '' : 'is-out'} ${isSelected ? 'is-sel' : ''} ${isToday ? 'is-today' : ''}`}
            >
              <span className={`wcal-num wpc-serif ${tone}`}>{d.getDate()}</span>
              {inMonth && holidayName && <span className="wcal-holiday">{shortHolidayName(holidayName)}</span>}
              {list.length > 0 && (
                <span className="wcal-label">
                  {twoLines(shortTitle(list[0].title)).map((line, i) => <span key={i}>{line}</span>)}
                  {list.length > 1 && <i>외 {list.length - 1}</i>}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="wcal-foot wpc-serif">대한예수교장로회 참빛교회</p>
      <div className="wcal-tear" aria-hidden="true" />

      {/* 일력 한 장 — 고른 날(없으면 오늘) */}
      {shown && shownKey ? (
        <section className="wcal-day" aria-live="polite">
          <div key={shownKey} className="wcal-day-page">
            <div className="wcal-day-top">
              <span className={`wcal-day-num wpc-serif ${shownRed ? 'is-red' : ''}`}>{shown.getDate()}</span>
              <p className={`wcal-day-wd ${shownRed ? 'is-red' : ''}`}>
                {weekdayName(shown)}
                {shownKey === todayKey && <span className="wcal-chip">오늘</span>}
                {shownHoliday && <span className="wcal-day-holiday">{shownHoliday}</span>}
              </p>
              <div className="wcal-nav">
                <button type="button" onClick={() => step(-1)} aria-label="전날" className="wcal-nav-btn"><Chevron dir="l" /></button>
                <button type="button" onClick={() => step(1)} aria-label="다음 날" className="wcal-nav-btn"><Chevron dir="r" /></button>
              </div>
              <p className="wpc-hand wcal-day-word">{SUNDAY_WORD[shown.getDay()]}</p>
            </div>

            {shownEvents.length > 0 ? (
              <ul className="wcal-rows">
                {shownEvents.map((ev) => (
                  <li key={ev.id}>
                    <button type="button" onClick={() => open(ev.id)} className="wcal-row">
                      <span className="wcal-row-time">{formatEventStartTime(ev)}</span>
                      <span className="min-w-0 flex-1">
                        <b className="wcal-row-title">{ev.title}</b>
                        {ev.location && <span className="wcal-row-place">{ev.location}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                <p className="wcal-none">일정이 없는 날이에요.</p>
                {nextAfter && (
                  <button type="button" onClick={() => open(nextAfter.event.id)} className="wcal-next">
                    <span className="wcal-pill">
                      다음 일정{nextAfter.key > todayKey ? ` · ${daysLeftLabel(nextAfter.key)}` : ''}
                    </span>
                    <b>{nextAfter.event.title}</b>
                    <span className="wcal-next-when">
                      {fullDay(parseKey(nextAfter.key))} · {formatEventStartTime(nextAfter.event)}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <p className="wcal-hint">달력에서 날짜를 누르면 그날 일정이 여기에 크게 나와요.</p>
      )}

      {upcoming && upcoming.length > 0 && (
        <section className="wcal-up">
          <p className="wcal-up-title">다가오는 일정</p>
          {upcoming.map(({ event: ev, key }) => (
            <button key={ev.id} type="button" onClick={() => open(ev.id)} className="wcal-up-row">
              <span className="wcal-pill">{daysLeftLabel(key)}</span>
              <span className="min-w-0 flex-1">
                <b>{ev.title}</b>
                <span>{fullDay(parseKey(key))} · {formatEventStartTime(ev)}</span>
              </span>
            </button>
          ))}
        </section>
      )}
    </article>
  )
}

export default WallCalendar
