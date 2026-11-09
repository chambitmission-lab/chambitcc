import type { EducationProgram } from '../../../types/education'
import { programText } from '../../../types/education'
import { DAY_SHORT_EN, DAY_SHORT_KO, isLive, isOver, stripStage } from '../eduSchedule'
import type { EduSession } from '../eduSchedule'
import { toneVars, type Lang } from './eduTone'

// ── 이번 주 시간표 ─────────────────────────────────────
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // 월 → 주일

export const WeekSchedule = ({
  now,
  day,
  onDay,
  byDay,
  toneOf,
  language,
  onOpen,
}: {
  now: Date
  day: number
  onDay: (d: number) => void
  byDay: Record<number, Array<{ program: EducationProgram; session: EduSession }>>
  toneOf: (p: EducationProgram) => number
  language: Lang
  onOpen: (id: number) => void
}) => {
  const ko = language === 'ko'
  const today = now.getDay()
  const setDay = onDay
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((today + 6) % 7))
  const list = byDay[day] ?? []
  const dayNames = ko ? DAY_SHORT_KO : DAY_SHORT_EN

  return (
    <div className="edu-week">
      <div className="edu-days" role="tablist" aria-label={ko ? '요일' : 'Day'}>
        {WEEK_ORDER.map((d, i) => {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          const count = (byDay[d] ?? []).length
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={day === d}
              onClick={() => setDay(d)}
              className={`edu-day ${day === d ? 'is-on' : ''} ${d === today ? 'is-today' : ''}`}
            >
              {dayNames[d]}
              <span className="edu-day-num">{date.getDate()}</span>
              <span className="edu-day-dots" aria-label={ko ? `모임 ${count}개` : `${count} meetings`}>
                {Array.from({ length: Math.min(count, 4) }).map((_, k) => (
                  <i key={k} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="edu-timeline">
        {list.length === 0 ? (
          <p className="edu-timeline-empty">{ko ? '이 날은 정해진 모임이 없어요' : 'No meetings on this day'}</p>
        ) : (
          list.map(({ program, session }) => {
            const isToday = day === today
            const live = isToday && isLive(session, now)
            const over = isToday && !live && isOver(session, now)
            const place = [programText(program, 'location', language), programText(program, 'leader', language)]
              .filter((v) => v.trim())
              .join(' · ')
            return (
              <button
                key={`${program.id}-${session.key}`}
                type="button"
                onClick={() => onOpen(program.id)}
                className={`edu-tl-item ${over ? 'is-over' : ''}`}
                style={toneVars(toneOf(program))}
              >
                <span className="edu-tl-time">
                  {session.h % 12 || 12}:{String(session.mi).padStart(2, '0')}
                  <small>{ko ? (session.h < 12 ? '오전' : '오후') : session.h < 12 ? 'AM' : 'PM'}</small>
                </span>
                <span className="edu-tl-card">
                  <b>
                    {stripStage(programText(program, 'name', language))}
                    {session.ban && <span className="font-semibold"> · {session.ban}</span>}
                    {live && (
                      <span className="edu-pill is-live is-mini">
                        <i className="edu-live-dot" aria-hidden="true" />
                        {ko ? '지금' : 'Now'}
                      </span>
                    )}
                  </b>
                  {place && <span>{place}</span>}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
