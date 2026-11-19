import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBibleVerse } from '../../../../api/bible'
import { bibleKeys } from '../../../../hooks/queryKeys'
import { useUpdateTypingGoal } from '../../../../hooks/useBibleTyping'
import { useMediaQuery } from '../../../../hooks/useMediaQuery'
import { chapterLabel } from '../../../../utils/bibleLabels'
import { DAILY_GOALS, type TypingMode, type TypingStats } from '../../../../api/bibleTyping'
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
  mode: TypingMode
  setMode: (m: TypingMode) => void
  ignorePunct: boolean
  setIgnorePunct: (v: boolean) => void
  bookName: (n: number) => string
  /** 이어 쓸 절 본문 — 허브 묶음이 함께 준다(null = 전권 완필). undefined(묶음 없음·비로그인)면 직접 받는다 */
  nextVerseText?: string | null
  onGo: (book: number, chapter: number, verse?: number) => void
  /** '골라 쓰기' — 바로 아래 골라 쓰기 카드로 데려간다 */
  onPick: () => void
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
 * 허브 첫 화면의 단 하나 — "오늘의 필사" (2026-11-19 A2 몰입 무대).
 * 숫자·버튼은 위아래 가는 줄에만(자리·쓰기 방식·연속·오늘 N/목표·설정 / 목표 진행선·골라 쓰기),
 * 가운데는 이어 쓸 말씀 하나만 크게. PC 는 버튼 없이 아무 키나 누르면 바로 이어 쓰기로,
 * 모바일은 화면 키보드 때문에 아래 버튼을 남긴다. 부호 무시·하루 목표는 ⚙ 팝오버로.
 * 시안: /#/dev/typing-hub?v=a2
 */
const TodayCard = ({
  loggedIn,
  loading = false,
  stats,
  mode,
  setMode,
  ignorePunct,
  setIgnorePunct,
  bookName,
  nextVerseText,
  onGo,
  onPick,
}: TodayCardProps) => {
  const [editingGoal, setEditingGoal] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const updateGoal = useUpdateTypingGoal()
  const isDesk = useMediaQuery('(min-width: 1024px)')
  const cardRef = useRef<HTMLElement>(null)
  const setRef = useRef<HTMLSpanElement>(null)

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

  const { book_number: goBook, chapter: goChapter, verse: goVerse } = spot
  const goNext = useCallback(() => onGo(goBook, goChapter, goVerse), [onGo, goBook, goChapter, goVerse])

  // PC — 허브에서 입력칸 밖에 있을 때 글자 키를 누르면 바로 이어 쓰기로 들어간다 (Monkeytype 처럼 버튼 없이).
  // 다른 입력칸·버튼에 포커스가 있거나 조합키(Ctrl+K 등)면 건드리지 않는다
  const startable = !loading && !choosingGoal && !settingsOpen && !!nextVerse?.text
  useEffect(() => {
    if (!isDesk || !startable) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return
      const el = document.activeElement
      if (el && el !== document.body && el !== cardRef.current) return
      if (e.key === 'Enter' || e.key === 'Process' || (e.key.length === 1 && e.key !== ' ')) {
        e.preventDefault()
        goNext()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isDesk, startable, goNext])

  // 설정 팝오버 — 바깥을 누르거나 Esc 면 닫는다
  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (e: PointerEvent) => {
      if (!setRef.current?.contains(e.target as Node)) setSettingsOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  if (loading) {
    return (
      <section className="bt-today bt-stage" aria-busy="true" aria-label="오늘의 필사 불러오는 중">
        <span className="bt-skel bt-skel--bar" />
        <span className="bt-skel bt-skel--verse" />
        <span className="bt-skel bt-skel--verse is-short" />
        <span className="bt-skel bt-skel--track" />
        {!isDesk && <span className="bt-skel bt-skel--cta" />}
      </section>
    )
  }

  const shortRef = `${bookName(spot.book_number)} ${spot.chapter}:${spot.verse}`
  const progress = loggedIn ? Math.min(1, today / Math.max(1, goal)) : 0
  const footLabel = !loggedIn
    ? '매일 한 절, 등불을 켜요'
    : met
      ? `오늘 목표 ${goal}절 달성 · 더 써도 좋아요`
      : today === 0
        ? `오늘 목표 ${goal}절`
        : `${remaining}절 더 쓰면 오늘 목표`

  return (
    <section
      ref={cardRef}
      className={`bt-today bt-stage${met ? ' is-met' : ''}`}
      aria-labelledby="bt-today-title"
      tabIndex={isDesk ? -1 : undefined}
    >
      <header className="bt-stage__top">
        <h1 id="bt-today-title" className="bt-stage__ref">
          <span className="sr-only">오늘의 필사 · </span>
          {isFirst && <span className="bt-stage__first">처음이라면</span>}
          {shortRef}
        </h1>
        <div className="bt-stage__seg" role="radiogroup" aria-label="쓰기 방식">
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
        <span
          className="bt-stage__stat"
          title={loggedIn ? (stats?.rest_used_this_week ? '이번 주 쉼표를 썼어요' : '한 주에 하루는 쉬어도 등불이 꺼지지 않아요') : undefined}
        >
          {loggedIn ? (
            <>
              <span className={`bt-stage__flame${streak > 0 || today > 0 ? '' : ' is-off'}`} aria-hidden />
              <span className="sr-only">연속 </span>
              {streak}일
              <span className="bt-stage__sep" aria-hidden />
              오늘 <b>{today}</b>/{goal}
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>하면 기록이 남아요
            </>
          )}
        </span>
        <span className="bt-stage__set" ref={setRef}>
          <button
            type="button"
            className="bt-stage__icon"
            aria-label="쓰기 설정"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <span className="material-icons-round" aria-hidden>
              tune
            </span>
          </button>
          {settingsOpen && (
            <div className="bt-stage__pop" role="dialog" aria-label="쓰기 설정">
              <div className="bt-stage__pop-row">
                <span>
                  <b>문장부호 건너뛰기</b>
                  <small>쉼표·마침표는 안 쳐도 돼요</small>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ignorePunct}
                  aria-label="문장부호 건너뛰기"
                  className={`bt-stage__switch${ignorePunct ? ' is-on' : ''}`}
                  onClick={() => setIgnorePunct(!ignorePunct)}
                >
                  <i />
                </button>
              </div>
              {loggedIn && stats?.daily_goal !== null && (
                <button
                  type="button"
                  className="bt-stage__pop-row bt-stage__pop-goal"
                  onClick={() => {
                    setSettingsOpen(false)
                    setEditingGoal(true)
                  }}
                >
                  <span>
                    <b>하루 목표 {goal}절</b>
                    <small>등잔에 기름이 차는 기준이에요</small>
                  </span>
                  <span className="bt-stage__pop-more">
                    바꾸기
                    <span className="material-icons-round" aria-hidden>
                      chevron_right
                    </span>
                  </span>
                </button>
              )}
            </div>
          )}
        </span>
      </header>

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
        <button type="button" className="bt-stage__stage" onClick={goNext} aria-label={`${ref} 이어 쓰기`}>
          <span className={`bt-stage__verse${mode === 'memorize' ? ' is-masked' : ''}`}>
            {isDesk && <i className="bt-stage__caret" aria-hidden />}
            {nextVerse?.text ? (mode === 'memorize' ? `${teaser(nextVerse.text, 2)} (기억으로 이어 쓰기)` : nextVerse.text) : ' '}
          </span>
        </button>
      )}

      <div className={`bt-stage__track${met ? ' is-met' : ''}`} aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      <footer className="bt-stage__foot">
        <span className="bt-stage__goal">{footLabel}</span>
        {isDesk && !choosingGoal && (
          <span className="bt-stage__keys">
            <kbd>아무 키</kbd>나 누르면 시작
          </span>
        )}
        <button type="button" className="bt-stage__pick" onClick={onPick}>
          골라 쓰기
          <span className="material-icons-round" aria-hidden>
            south
          </span>
        </button>
      </footer>

      {!isDesk && !choosingGoal && (
        <button type="button" className="bt-btn bt-btn--primary bt-btn--block bt-stage__cta" onClick={goNext}>
          {cta}
          <span className="material-icons-round" aria-hidden>
            arrow_forward
          </span>
        </button>
      )}
    </section>
  )
}

export default TodayCard
