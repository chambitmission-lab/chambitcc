import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { translations } from '../../../locales'
import { queryClient } from '../../../config/queryClient'
import { prefetchEventDetail } from '../../../hooks/useEvents'
import { preloadRoute } from '../../../utils/routePreload'
import { formatEventStartTime } from '../utils/dateGrouping'
import { buildWeekCard, dayParts, daysLeftLabel, eventDayKey, mondayOf } from '../utils/weekPostcards'
import { postcardFrameFor } from '../utils/postcardFrames'
import '../styles/weekPostcard.css'

/**
 * /events 맨 위 '가장 가까운 일정' — 우편엽서의 사진 면(2026-11-26 H2 큰 사진 엽서).
 * 아래 주간 엽서(WeekPostcard)는 쓰는 면만 두고, 사진은 여기 한 장만 크게 싣는다.
 * 사진 = 그 일정 주의 계절 교회 전경을 주 번호로 돌린 구도(참빛 풍경 엽서 No.N), 필름 날짜 도장 = 일정 날짜.
 * 시안: /#/dev/events-hero?v=h2
 */

const WD_FULL = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

interface EventHeroCardProps {
  event: Event
}

const EventHeroCard = ({ event }: EventHeroCardProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { theme } = useTheme()
  const t = translations[language]

  const key = eventDayKey(event)
  const { m, d, wd, date } = dayParts(key)
  const week = buildWeekCard(mondayOf(date), [], mondayOf(date))
  const sunday = dayParts(week.days[6]).date
  const frame = postcardFrameFor(week.no, sunday, theme === 'dark' ? 'dark' : 'light')
  const time = formatEventStartTime(event)
  const imprint = `'${key.slice(2, 4)} ${key.slice(5, 7)} ${key.slice(8, 10)}`

  // 상세 청크와 상세 응답을 같은 순간에 띄운다 — 누르는 때엔 둘 다 거의 도착해 있다
  const warm = () => {
    void preloadRoute(`/events/${event.id}`)
    prefetchEventDetail(queryClient, event.id)
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/events/${event.id}`)}
      onMouseEnter={warm}
      onTouchStart={warm}
      className="mx-4 mb-6 w-[calc(100%-2rem)] lg:mx-6 lg:w-[calc(100%-3rem)] text-left block group"
    >
      <article className="wpc">
        <div className="px-3 pt-3 lg:px-3.5 lg:pt-3.5">
          <figure className="wpc-film wpc-film-straight">
            <div className="relative overflow-hidden h-[180px] lg:h-[240px]">
              <img
                src={frame.src}
                alt=""
                aria-hidden="true"
                decoding="async"
                fetchPriority="high"
                className="wpc-film-img absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: frame.pos }}
              />
              <span className="wpc-film-wash" aria-hidden="true" />
              <span className="wpc-imprint-shade" aria-hidden="true" />
              <span className="wpc-imprint text-[16px] lg:text-[18px]">{imprint}</span>
              <span className="wpc-hand wpc-photo-label absolute left-3 top-2.5 lg:left-4 lg:top-3.5 text-[27px] lg:text-[34px] leading-none">
                가장 가까운 일정
              </span>
            </div>
            <figcaption className="wpc-hand wpc-caption pt-1.5 text-[19px] lg:text-[21px] leading-tight">
              참빛 풍경 엽서 No.{week.no} — {frame.caption}
            </figcaption>
          </figure>
        </div>

        <div className="px-4 pt-4 pb-4 lg:px-6 lg:pt-5 lg:pb-5">
          <div className="flex items-center gap-2">
            <span className="wpc-pill text-[14px] lg:text-[15px]">{daysLeftLabel(key)}</span>
            <span className="wpc-pill is-done text-[14px] lg:text-[15px]">{t.categories[event.category]}</span>
          </div>
          <h2 className="wpc-week mt-2.5 font-extrabold leading-[1.25] tracking-[-0.015em] text-[23px] lg:text-[30px] break-keep line-clamp-2">
            {event.title}
          </h2>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="wpc-week min-w-0 text-[16.5px] lg:text-[19px]">
              <b className="font-extrabold">
                {m}월 {d}일 {WD_FULL[wd]} · {time === '종일' ? '하루 종일' : time}
              </b>
              {event.location && <span className="opacity-80"> · {event.location}</span>}
              {event.attendance_count > 0 && <span className="opacity-80"> · {event.attendance_count}명 함께</span>}
            </p>
            <span className="wpc-accent shrink-0 inline-flex items-center gap-1 font-extrabold text-[16px] lg:text-[17px] group-hover:underline underline-offset-4">
              자세히
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </button>
  )
}

export default EventHeroCard
