import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { useTheme } from '../../../contexts/ThemeContext'
import { calendarDateKey, kstNow } from '../../../utils/date'
import { queryClient } from '../../../config/queryClient'
import { prefetchEventDetail } from '../../../hooks/useEvents'
import { preloadRoute } from '../../../utils/routePreload'
import { formatEventStartTime } from '../utils/dateGrouping'
import { dayParts, daysLeftLabel, eventDayKey, type WeekCard } from '../utils/weekPostcards'
import { postcardFrameFor, postcardStampFor } from '../utils/postcardFrames'
import '../styles/weekPostcard.css'

/**
 * /events 일정 목록 — 한 주 = 우편엽서 한 장 (2026-11-26 '향수 N2 풍경 엽서 세트, 읽기 쉽게').
 * 위: 그 주 계절의 교회 전경을 주마다 다른 구도로(풍경 엽서 No.=ISO 주 번호) + 필름 날짜 도장.
 * 아래: 80년대 '우편엽서' 머리(우표·소인·빨간 우편번호 칸) + 어르신 눈높이 일정 줄.
 * 감성은 머리·사진에만, 일정 줄은 큰 고딕 — 날짜·요일 온전히, 시간 굵게, 상태는 알약, 지난 일은 통째 흐리지 않는다.
 * 시안: /#/dev/events-board?v=final2
 */

const WD_FULL = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

const warm = (id: number) => {
  void preloadRoute(`/events/${id}`)
  prefetchEventDetail(queryClient, id)
}

const range = (days: string[]) => {
  const a = dayParts(days[0])
  const b = dayParts(days[6])
  return `${a.m}.${a.d} – ${b.m}.${b.d}`
}

const imprintOf = (key: string) => {
  const [y, m, d] = key.split('-')
  return `'${y.slice(2)} ${m} ${d}`
}

/** 소인 — 동그란 날짜 도장 + 물결선 */
const Postmark = ({ dayKey }: { dayKey: string }) => {
  const { m, d } = dayParts(dayKey)
  const y = dayKey.slice(0, 4)
  return (
    <svg viewBox="0 0 120 60" className="wpc-postmark" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="30" cy="30" r="25" />
        <circle cx="30" cy="30" r="19" strokeWidth="0.9" />
        {[18, 26, 34, 42].map((yy) => (
          <path key={yy} d={`M58 ${yy} q7 -4 14 0 t14 0 t14 0 t14 0`} />
        ))}
      </g>
      <text x="30" y="26" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor">참빛</text>
      <text x="30" y="38" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">{y}.{m}.{d}</text>
    </svg>
  )
}

const EventRow = ({ ev }: { ev: Event }) => {
  const navigate = useNavigate()
  const key = eventDayKey(ev)
  const { d, wd } = dayParts(key)
  const todayKey = calendarDateKey(kstNow())
  const gone = key < todayKey
  const sun = wd === 0
  const time = formatEventStartTime(ev)
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/events/${ev.id}`)}
        onMouseEnter={() => warm(ev.id)}
        onTouchStart={() => warm(ev.id)}
        className={`wpc-row w-full text-left flex gap-3 py-3.5 lg:gap-4 lg:py-4 ${gone ? 'is-gone' : ''}`}
      >
        <span className="shrink-0 w-[50px] lg:w-[58px] text-center">
          <span className={`wpc-day block font-extrabold tabular-nums leading-none text-[28px] lg:text-[32px] ${sun ? 'is-sun' : ''}`}>{d}</span>
          <span className={`wpc-wd block mt-1.5 font-bold text-[13px] lg:text-[14px] ${sun ? 'is-sun' : ''}`}>{WD_FULL[wd]}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-start justify-between gap-2">
            <span className="wpc-title font-bold leading-[1.35] break-keep text-[18px] lg:text-[20px]">{ev.title}</span>
            <span className={`wpc-pill shrink-0 text-[13px] lg:text-[14px] ${gone ? 'is-done' : ''}`}>{gone ? '마쳤어요' : daysLeftLabel(key)}</span>
          </span>
          <span className="wpc-meta block mt-1 text-[15px] lg:text-[16.5px]">
            <b className="font-bold">{time === '종일' ? '하루 종일' : time}</b>
            {ev.location && <span> · {ev.location}</span>}
            {!gone && ev.attendance_count > 0 && <span> · {ev.attendance_count}명 함께</span>}
          </span>
        </span>
      </button>
    </li>
  )
}

const TodayBand = () => {
  const now = kstNow()
  return (
    <li className="wpc-today text-[15px] lg:text-[16.5px]">
      <span className="wpc-today-chip">오늘</span>
      <span className="font-bold">
        {now.getMonth() + 1}월 {now.getDate()}일 {WD_FULL[now.getDay()]}
      </span>
      <span className="opacity-75">· 일정 없는 날</span>
    </li>
  )
}

const WeekPostcard = ({ week, first }: { week: WeekCard; first?: boolean }) => {
  const { theme } = useTheme()
  const t = theme === 'dark' ? 'dark' : 'light'
  const sunday = dayParts(week.days[6]).date
  const frame = postcardFrameFor(week.no, sunday, t)
  const stamp = postcardStampFor(sunday, t)

  // 이번 주면 '오늘' 띠를 오늘 일정이 아닌 첫 미래 일정 앞에 끼운다(오늘 일정이 있으면 띠 없이 그 줄이 곧 오늘)
  const todayKey = calendarDateKey(kstNow())
  const hasToday = week.days.includes(todayKey)
  const items: ({ kind: 'ev'; ev: Event } | { kind: 'today' })[] = []
  let placed = !hasToday
  for (const ev of week.events) {
    const k = eventDayKey(ev)
    if (!placed && k >= todayKey) {
      if (k !== todayKey) items.push({ kind: 'today' })
      placed = true
    }
    items.push({ kind: 'ev', ev })
  }
  if (!placed) items.push({ kind: 'today' })

  return (
    <article className="wpc">
      <div className="px-3 pt-3 lg:px-3.5 lg:pt-3.5">
        <figure className="wpc-film">
          <div className="relative overflow-hidden h-[150px] lg:h-[170px]">
            <img src={frame.src} alt="" aria-hidden="true" decoding="async" className="wpc-film-img absolute inset-0 w-full h-full object-cover" style={{ objectPosition: frame.pos }} />
            <span className="wpc-film-wash" aria-hidden="true" />
            <span className="wpc-imprint-shade" aria-hidden="true" />
            <span className="wpc-imprint text-[15px] lg:text-[16px]">{imprintOf(week.mondayKey)}</span>
          </div>
          <figcaption className="wpc-hand wpc-caption pt-1.5 text-[19px] lg:text-[21px] leading-tight">
            {first ? '참빛 풍경 엽서 ' : ''}No.{week.no} — {frame.caption}
          </figcaption>
        </figure>
      </div>

      <div className="px-4 pt-3 pb-3 lg:px-5 lg:pt-3.5 lg:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-0.5 min-w-0">
            <h3 className="flex items-baseline gap-2.5">
              <span className="wpc-serif wpc-post font-extrabold tracking-[0.5em] text-[15px] lg:text-[17px]">우편엽서</span>
              <span className="wpc-week font-extrabold text-[17px] lg:text-[19px]">{week.title}</span>
            </h3>
            <p className="wpc-sub mt-1 text-[13.5px] font-bold tabular-nums">
              {week.sundayName} · {range(week.days)}
            </p>
          </div>
          <div className="relative shrink-0 pt-0.5">
            <span className="absolute -left-[62px] top-[14px] w-[96px]">
              <Postmark dayKey={week.mondayKey} />
            </span>
            <span className="wpc-stamp w-[44px] h-[53px] lg:w-[50px] lg:h-[60px]">
              <img src={stamp} alt="" aria-hidden="true" decoding="async" className="w-full h-full object-cover object-[88%_60%]" />
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="wpc-to min-w-0 flex-1 pb-0.5 text-[13px] lg:text-[14px]">
            <span className="font-bold mr-2 opacity-70">받는 사람</span>
            <span className="wpc-hand wpc-accent text-[23px] lg:text-[26px]">참빛 식구들에게</span>
          </p>
          <span className="wpc-zip shrink-0" aria-hidden="true">
            <i /><i /><i /><b>-</b><i /><i /><i />
          </span>
        </div>

        <ul className="wpc-rows mt-3">
          {items.map((it) => (it.kind === 'today' ? <TodayBand key="today" /> : <EventRow key={it.ev.id} ev={it.ev} />))}
        </ul>
        <p className="wpc-hand wpc-accent text-right mt-1 text-[24px] lg:text-[26px]">— 참빛교회에서</p>
      </div>
    </article>
  )
}

/** 이번 주보다 앞선 일정 — 접어 두었다가 꺼내 본다. 펼치면 같은 종이 한 장에 날짜·제목 한 줄씩 */
export const PastPostcards = ({ events, defaultOpen = false }: { events: Event[]; defaultOpen?: boolean }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(defaultOpen)
  if (events.length === 0) return null
  if (!open)
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="wpc-hand text-[23px] lg:text-[26px] text-gray-600 dark:text-white/70 underline decoration-dashed underline-offset-4"
        >
          지난 일정 {events.length}개 꺼내 보기
        </button>
      </div>
    )
  return (
    <div>
      {open && (
        <article className="wpc px-4 pt-3 pb-2 lg:px-5 lg:pt-4 lg:pb-3">
          <div className="flex items-baseline justify-between gap-2 pb-2">
            <h3 className="wpc-hand wpc-week text-[27px] lg:text-[30px] leading-none">
              지난 일정 <span className="text-[20px] opacity-60">{events.length}개</span>
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-expanded={true}
              className="wpc-accent shrink-0 h-9 px-3 rounded-full text-[14px] font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              접기
            </button>
          </div>
          <ul className="wpc-rows">
            {events.map((ev) => {
              const { m, d, wd } = dayParts(eventDayKey(ev))
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${ev.id}`)}
                    onMouseEnter={() => warm(ev.id)}
                    onTouchStart={() => warm(ev.id)}
                    className="wpc-row is-gone w-full text-left flex items-baseline gap-3 py-3"
                  >
                    <span className={`wpc-day shrink-0 min-w-[116px] whitespace-nowrap font-bold tabular-nums text-[15px] lg:text-[16px] ${wd === 0 ? 'is-sun' : ''}`}>
                      {m}월 {d}일 {WD_FULL[wd]}
                    </span>
                    <span className="wpc-title flex-1 min-w-0 font-bold break-keep text-[16px] lg:text-[17.5px]">{ev.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </article>
      )}
    </div>
  )
}

export default WeekPostcard
