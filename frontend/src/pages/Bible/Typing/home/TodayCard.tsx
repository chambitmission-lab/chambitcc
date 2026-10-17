import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBibleVerse } from '../../../../api/bible'
import { bibleKeys } from '../../../../hooks/queryKeys'
import { useUpdateTypingGoal } from '../../../../hooks/useBibleTyping'
import { chapterLabel } from '../../../../utils/bibleLabels'
import { DAILY_GOALS, type TypingCalendar, type TypingMode, type TypingStats } from '../../../../api/bibleTyping'
import Lamp from './Lamp'
import { WEEKDAYS, addDays, kstToday, mondayOf } from './dates'
import { teaser } from './teaser'

// 처음 오는 성도의 첫 자리
const FIRST_SPOT = { book_number: 19, chapter: 23, verse: 1 }

const GOAL_COPY: Record<number, { name: string; hint: string }> = {
  1: { name: '가볍게', hint: '하루 1분' },
  3: { name: '꾸준히', hint: '하루 3분' },
  5: { name: '열심히', hint: '하루 5분' },
  10: { name: '깊이', hint: '하루 10분' },
}

interface TodayCardProps {
  loggedIn: boolean
  /** 로그인은 했는데 허브 묶음이 아직 안 왔다 — 첫 방문자 문구 대신 조용한 자리표시자를 그린다 */
  loading?: boolean
  stats?: TypingStats
  calendar?: TypingCalendar
  mode: TypingMode
  setMode: (m: TypingMode) => void
  ignorePunct: boolean
  setIgnorePunct: (v: boolean) => void
  bookName: (n: number) => string
  /** 이어 쓸 절 본문 — 허브 묶음이 함께 준다(null = 전권 완필). undefined(묶음 없음·비로그인)면 직접 받는다 */
  nextVerseText?: string | null
  onGo: (book: number, chapter: number, verse?: number) => void
}

const GoalPicker = ({ current, onPick, busy }: { current: number | null; onPick: (g: number) => void; busy: boolean }) => (
  <div className="bt-goal" role="radiogroup" aria-label="하루 목표">
    {DAILY_GOALS.map((g) => (
      <button
        key={g}
        type="button"
        role="radio"
        aria-checked={current === g}
        disabled={busy}
        className={`bt-goal__opt${current === g ? ' is-on' : ''}`}
        onClick={() => onPick(g)}
      >
        <span className="bt-goal__name">{GOAL_COPY[g].name}</span>
        <b>{g}절</b>
        <span className="bt-goal__hint">{GOAL_COPY[g].hint}</span>
      </button>
    ))}
  </div>
)

/**
 * 허브 첫 화면의 단 하나 — "오늘의 필사".
 * 등잔(연속 기록·오늘 채운 기름) + 이번 주 7칸 + 이어 쓸 말씀 첫 줄 + 버튼 하나.
 * 모드·문장부호는 아래 작은 줄로 내린다(매일 오는 사람은 고를 게 없다).
 */
const TodayCard = ({
  loggedIn,
  loading = false,
  stats,
  calendar,
  mode,
  setMode,
  ignorePunct,
  setIgnorePunct,
  bookName,
  nextVerseText,
  onGo,
}: TodayCardProps) => {
  const [editingGoal, setEditingGoal] = useState(false)
  const updateGoal = useUpdateTypingGoal()

  const spot = stats?.next_position ?? FIRST_SPOT
  // 로그인 사용자의 본문은 묶음이 준다(전권 완필이면 null) — 묶음을 기다리는 동안 시편 23:1 을 따로 받던 요청을 없앤다
  const { data: fetchedVerse } = useQuery({
    queryKey: bibleKeys.verse(spot.book_number, spot.chapter, spot.verse),
    queryFn: () => getBibleVerse(spot.book_number, spot.chapter, spot.verse),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !loggedIn && nextVerseText === undefined,
  })
  const nextVerse = nextVerseText !== undefined ? (nextVerseText ? { text: nextVerseText } : undefined) : fetchedVerse

  const goal = stats?.daily_goal ?? 3
  const today = stats?.today_verses ?? 0
  const streak = stats?.current_streak ?? 0
  const met = loggedIn && today >= goal
  const remaining = Math.max(0, goal - today)
  const choosingGoal = loggedIn && !!stats && (stats.daily_goal === null || editingGoal)

  const todayStr = calendar?.today ?? kstToday()
  const monday = mondayOf(todayStr)
  const rests = new Set(stats?.rest_days ?? [])
  const week = WEEKDAYS.map((label, i) => {
    const date = addDays(monday, i)
    const n = calendar?.days[date] ?? 0
    const state =
      date > todayStr
        ? 'future'
        : n > 0
          ? n >= goal
            ? 'full'
            : 'done'
          : rests.has(date)
            ? 'rest'
            : date === todayStr
              ? 'today'
              : 'miss'
    return { date, label, n, state, isToday: date === todayStr }
  })

  const ref = `${bookName(spot.book_number)} ${chapterLabel(spot.book_number, spot.chapter)} ${spot.verse}절`
  const isFirst = !stats?.next_position

  const cta = !loggedIn
    ? '시편 23편부터 써 보기'
    : today === 0
      ? `오늘 ${goal}절 쓰기`
      : remaining > 0
        ? `${remaining}절 더 쓰면 오늘 목표 달성`
        : '목표 달성! 조금 더 쓰기'

  const pickGoal = (g: number) =>
    updateGoal.mutate(g, {
      onSuccess: () => setEditingGoal(false),
    })

  if (loading) {
    return (
      <section className="bt-today bt-today--loading" aria-busy="true" aria-label="오늘의 필사 불러오는 중">
        <div className="bt-today__top">
          <Lamp fill={0} lit={false} className="bt-today__lamp" />
          <div className="bt-today__head">
            <p className="bt-today__eyebrow">오늘의 필사</p>
            <span className="bt-skel bt-skel--title" />
            <span className="bt-skel bt-skel--sub" />
          </div>
        </div>
        <span className="bt-skel bt-skel--week" />
        <span className="bt-skel bt-skel--next" />
        <span className="bt-skel bt-skel--cta" />
      </section>
    )
  }

  return (
    <section className={`bt-today${met ? ' is-met' : ''}`} aria-labelledby="bt-today-title">
      <div className="bt-today__top">
        <Lamp fill={loggedIn ? today / Math.max(1, goal) : 0} lit={loggedIn && (streak > 0 || today > 0)} full={met} className="bt-today__lamp" />
        <div className="bt-today__head">
          <p className="bt-today__eyebrow">오늘의 필사</p>
          {loggedIn ? (
            <>
              <h1 id="bt-today-title" className="bt-today__title">
                {streak > 0 ? (
                  <>
                    <b>{streak}</b>일째 등불이 켜져 있어요
                  </>
                ) : (
                  '오늘 첫 불을 밝혀 볼까요?'
                )}
              </h1>
              <p className="bt-today__sub">
                오늘 <b>{today}</b>/{goal}절
                <span aria-hidden> · </span>
                {stats?.rest_used_this_week ? '이번 주 쉼표를 썼어요' : '한 주에 하루는 쉬어도 꺼지지 않아요'}
              </p>
            </>
          ) : (
            <>
              <h1 id="bt-today-title" className="bt-today__title">
                매일 한 절, 등불을 켜요
              </h1>
              <p className="bt-today__sub">
                <Link to="/login">로그인</Link>하면 연속 기록·하루 목표가 저장돼요
              </p>
            </>
          )}
        </div>
      </div>

      {loggedIn && (
        <ol className="bt-week" aria-label="이번 주 필사">
          {week.map((d) => (
            <li
              key={d.date}
              className={`bt-week__day is-${d.state}${d.isToday ? ' is-now' : ''}`}
              title={d.state === 'rest' ? `${d.label} · 쉼표` : d.n ? `${d.label} · ${d.n}절` : d.label}
            >
              <span className="bt-week__dot" aria-hidden>
                {d.state === 'rest' ? ',' : null}
              </span>
              <span className="bt-week__label">{d.label}</span>
            </li>
          ))}
        </ol>
      )}

      {choosingGoal ? (
        <div className="bt-today__goal">
          <p className="bt-today__goal-q">{stats?.daily_goal === null ? '하루에 몇 절씩 써 볼까요?' : '하루 목표 바꾸기'}</p>
          <GoalPicker current={stats?.daily_goal ?? null} onPick={pickGoal} busy={updateGoal.isPending} />
          {stats?.daily_goal !== null && (
            <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={() => setEditingGoal(false)}>
              그대로 둘게요
            </button>
          )}
        </div>
      ) : (
        <>
          <button type="button" className="bt-today__next" onClick={() => onGo(spot.book_number, spot.chapter, spot.verse)}>
            <span className="bt-today__ref">
              {isFirst ? '처음이라면 여기서부터' : '이어서'} · {ref}
            </span>
            <span className={`bt-today__verse${mode === 'memorize' ? ' is-masked' : ''}`}>
              {nextVerse?.text
                ? mode === 'memorize'
                  ? `${teaser(nextVerse.text, 2)} (기억으로 이어 쓰기)`
                  : nextVerse.text
                : ' '}
            </span>
          </button>
          <button
            type="button"
            className="bt-btn bt-btn--primary bt-btn--block bt-today__cta"
            onClick={() => onGo(spot.book_number, spot.chapter, spot.verse)}
          >
            {cta}
            <span className="material-icons-round" aria-hidden>
              arrow_forward
            </span>
          </button>
        </>
      )}

      <div className="bt-today__opts">
        <div className="bt-mini-seg" role="radiogroup" aria-label="쓰기 방식">
          {(
            [
              ['copy', '따라 쓰기'],
              ['memorize', '암송 쓰기'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={mode === k} className={mode === k ? 'is-on' : ''} onClick={() => setMode(k)}>
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`bt-chip bt-chip--sm${ignorePunct ? ' is-on' : ''}`}
          aria-pressed={ignorePunct}
          onClick={() => setIgnorePunct(!ignorePunct)}
          title="쉼표·마침표는 치지 않아도 돼요"
        >
          부호 무시
        </button>
        {loggedIn && stats?.daily_goal !== null && !choosingGoal && (
          <button type="button" className="bt-today__goal-link" onClick={() => setEditingGoal(true)}>
            목표 {goal}절 · 바꾸기
          </button>
        )}
      </div>
    </section>
  )
}

export default TodayCard
