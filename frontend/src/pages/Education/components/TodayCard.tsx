import type { EducationProgram } from '../../../types/education'
import { programText } from '../../../types/education'
import { DAY_SHORT_EN, DAY_SHORT_KO, isLive, isOver, stripStage } from '../eduSchedule'
import type { EduSession } from '../eduSchedule'
import { toneVars, type Lang } from './eduTone'

// ── 히어로 오른쪽: 오늘의 모임 / 다음 모임 (PC 전용) ──────────
// 히어로 글이 왼쪽에만 있어 PC 에서 오른쪽 위가 비던 자리. "언제 가면 되지?"에 첫 화면에서 답한다.
//   오늘 남은 모임(진행 중 + 앞으로)이 있으면 → 오늘 카드
//   없으면(원래 없는 날 / 다 끝남) → 가장 가까운 다음 모임 날의 모임들
// 모양: 달력 한 장(요일·날짜) 머리 + 점으로 이은 세로 일정선. 첫 모임만 '곧'으로 띄운다.
const TODAY_MAX = 3

/** 첫 모임까지 남은 시간 — 하루 넘게 남았으면 굳이 말하지 않는다 */
const untilLabel = (minutes: number, ko: boolean) => {
  if (minutes <= 0 || minutes >= 24 * 60) return ''
  if (minutes < 60) return ko ? `${minutes}분 뒤` : `in ${minutes}m`
  const h = Math.floor(minutes / 60)
  return ko ? `${h}시간 뒤` : `in ${h}h`
}

export const TodayCard = ({
  now,
  byDay,
  toneOf,
  categoryName,
  language,
  onOpen,
  onShowDay,
}: {
  now: Date
  byDay: Record<number, Array<{ program: EducationProgram; session: EduSession }>>
  toneOf: (p: EducationProgram) => number
  categoryName: (p: EducationProgram) => string
  language: Lang
  onOpen: (id: number) => void
  onShowDay: (d: number) => void
}) => {
  const ko = language === 'ko'
  const today = now.getDay()
  const todayAll = byDay[today] ?? []
  const remaining = todayAll.filter(({ session }) => !isOver(session, now))
  const doneCount = todayAll.length - remaining.length

  let mode: 'today' | 'next' = 'today'
  let day = today
  let inDays = 0
  let list = remaining
  if (remaining.length === 0) {
    // 다음 모임 날 찾기 — 7일 뒤(다음 주 같은 요일)까지
    const k = [1, 2, 3, 4, 5, 6, 7].find((n) => (byDay[(today + n) % 7] ?? []).length > 0)
    if (k == null) return null // 시간이 읽히는 모임이 하나도 없다 → 카드 자체를 숨긴다
    mode = 'next'
    inDays = k
    day = (today + k) % 7
    list = byDay[day] ?? []
  }

  const date = new Date(now)
  date.setDate(now.getDate() + inDays)
  const dayFull = ko ? (day === 0 ? '주일' : `${DAY_SHORT_KO[day]}요일`) : date.toLocaleDateString('en', { weekday: 'long' })
  const relLabel =
    mode === 'today'
      ? ko ? '오늘' : 'Today'
      : inDays === 1
        ? ko ? '내일' : 'Tomorrow'
        : ko ? `${inDays}일 뒤` : `In ${inDays} days`
  const kicker =
    mode === 'today'
      ? ko ? '오늘 열리는 모임' : 'Happening today'
      : todayAll.length > 0
        ? ko ? '오늘 모임은 모두 끝났어요' : "Today's meetings are over"
        : ko ? '오늘은 쉬어 가는 날' : 'No meetings today'
  const title =
    mode === 'today'
      ? ko ? `남은 모임 ${list.length}개` : `${list.length} still ahead`
      : ko ? `${relLabel} ${dayFull}에 만나요` : `See you ${relLabel.toLowerCase()}`
  const shown = list.slice(0, TODAY_MAX)
  const more = list.length - shown.length
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const footNote =
    more > 0
      ? ko ? `외 ${more}개` : `+${more} more`
      : mode === 'today' && doneCount > 0
        ? ko ? `끝난 모임 ${doneCount}개` : `${doneCount} finished`
        : ''

  return (
    <aside className={`edu-today ${mode === 'next' ? 'is-next' : 'is-today'}`} aria-label={kicker}>
      <div className="edu-today-head">
        <span className="edu-today-cal" aria-hidden="true">
          <small>{ko ? `${date.getMonth() + 1}월` : date.toLocaleDateString('en', { month: 'short' })}</small>
          <b>{date.getDate()}</b>
          <em>{ko ? DAY_SHORT_KO[day] : DAY_SHORT_EN[day]}</em>
        </span>
        <div className="min-w-0">
          <p className="edu-today-kicker">
            {mode === 'today' && <i className="edu-live-dot" aria-hidden="true" />}
            {kicker}
          </p>
          <h2 className="edu-today-title">{title}</h2>
        </div>
      </div>

      <ol className="edu-today-list">
        {shown.map(({ program, session }, i) => {
          const live = mode === 'today' && isLive(session, now)
          const until = i === 0 && !live ? untilLabel(inDays * 1440 + session.h * 60 + session.mi - nowMin, ko) : ''
          const place = programText(program, 'location', language).trim()
          const cat = categoryName(program)
          return (
            <li key={`${program.id}-${session.key}`} style={toneVars(toneOf(program))}>
              <button
                type="button"
                onClick={() => onOpen(program.id)}
                className={`edu-today-item ${i === 0 ? 'is-first' : ''} ${live ? 'is-live' : ''}`}
              >
                <span className="edu-today-time">
                  {session.h % 12 || 12}:{String(session.mi).padStart(2, '0')}
                  <small>{ko ? (session.h < 12 ? '오전' : '오후') : session.h < 12 ? 'AM' : 'PM'}</small>
                </span>
                <span className="edu-today-dot" aria-hidden="true" />
                <span className="edu-today-body">
                  {cat && <span className="edu-today-cat">{cat}</span>}
                  <b>
                    {stripStage(programText(program, 'name', language))}
                    {session.ban && <span className="edu-today-ban"> · {session.ban}</span>}
                  </b>
                  {place && <span className="edu-today-place">{place}</span>}
                </span>
                {live ? (
                  <span className="edu-pill is-live is-mini shrink-0">
                    <i className="edu-live-dot" aria-hidden="true" />
                    {ko ? '지금' : 'Now'}
                  </span>
                ) : (
                  until && <span className="edu-today-until">{until}</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      <button type="button" className="edu-today-foot" onClick={() => onShowDay(day)}>
        <span className="edu-today-foot-note">{footNote}</span>
        <span className="edu-today-link">
          {ko ? '이번 주 시간표' : 'This week'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </aside>
  )
}
