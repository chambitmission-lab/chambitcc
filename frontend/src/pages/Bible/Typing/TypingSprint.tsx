import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { getBibleVerse } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import { useSubmitTyping, useTypingStats } from '../../../hooks/useBibleTyping'
import { useBibleBooks } from '../../../hooks/useBible'
import { tokenStore } from '../../../utils/tokenStore'
import TypingPad, { type TypingFinish } from './TypingPad'
import { PASS_ACCURACY, cpmOf } from './hangulTyping'
import { formatDuration, useIgnorePunct } from './typingPrefs'
import './typing.css'

// 말씀 스프린트 — 성도들이 잘 아는 구절 다섯 개를 빠르고 정확하게.
// (책 번호, 장, 절). 짧고 널리 암송되는 절 위주로 고른다
const SPRINT_POOL: [number, number, number][] = [
  [1, 1, 1], [6, 1, 9], [19, 1, 1], [19, 23, 1], [19, 37, 5], [19, 46, 1], [19, 119, 105],
  [20, 3, 5], [20, 16, 9], [23, 41, 10], [24, 29, 11], [40, 5, 9], [40, 6, 33], [40, 11, 28],
  [43, 1, 1], [43, 3, 16], [43, 11, 25], [43, 14, 6], [45, 8, 28], [46, 13, 4], [47, 5, 17],
  [48, 2, 20], [49, 2, 8], [50, 4, 13], [52, 5, 16], [52, 5, 18], [55, 3, 16], [58, 11, 1],
  [60, 5, 7], [62, 4, 8],
]
const SPRINT_SIZE = 5

const pickSet = (): [number, number, number][] => {
  const pool = [...SPRINT_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, SPRINT_SIZE)
}

type Phase = 'ready' | 'countdown' | 'running' | 'done'

interface LapResult {
  accuracy: number
  keystrokes: number
  durationMs: number
  personalBest: boolean
}

const TypingSprint = () => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()
  const { data: stats } = useTypingStats()
  // 단일 절 응답엔 책 이름이 없다 — 책 목록(24시간 캐시)에서 찾는다
  const { data: books } = useBibleBooks()
  const submit = useSubmitTyping()

  const [set, setSet] = useState(pickSet)
  const [phase, setPhase] = useState<Phase>('ready')
  const [count, setCount] = useState(3)
  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [retryNote, setRetryNote] = useState<string | null>(null)
  const [laps, setLaps] = useState<LapResult[]>([])
  const [clockMs, setClockMs] = useState(0)
  const startedAt = useRef<number | null>(null)
  const [bestBefore, setBestBefore] = useState(0)

  const verseQueries = useQueries({
    queries: set.map(([b, c, v]) => ({
      queryKey: bibleKeys.verse(b, c, v),
      queryFn: () => getBibleVerse(b, c, v),
      staleTime: 1000 * 60 * 60 * 24,
    })),
  })
  const verses = verseQueries.map((q) => q.data)
  const ready = verses.every(Boolean)

  // 카운트다운
  useEffect(() => {
    if (phase !== 'countdown') return
    const t = setTimeout(() => {
      if (count <= 1) {
        startedAt.current = Date.now()
        setClockMs(0)
        setPhase('running')
      }
      setCount((n) => n - 1)
    }, 700)
    return () => clearTimeout(t)
  }, [phase, count])

  // 경기 시계
  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setClockMs(Date.now() - (startedAt.current ?? Date.now())), 100)
    return () => clearInterval(t)
  }, [phase])

  const start = () => {
    setBestBefore(stats?.best_cpm ?? 0)
    setLaps([])
    setIndex(0)
    setAttempt((n) => n + 1)
    setRetryNote(null)
    setCount(3)
    setPhase('countdown')
  }

  const again = () => {
    setSet(pickSet())
    setPhase('ready')
  }

  const handleFinish = (r: TypingFinish) => {
    const verse = verses[index]
    if (!verse) return
    if (r.suspicious || r.accuracy < PASS_ACCURACY) {
      // 스프린트는 시계가 계속 간다 — 그 절을 다시 쓴다
      setRetryNote(r.suspicious ? '직접 써야 기록돼요!' : `정확도 ${Math.round(r.accuracy * 100)}% — 한 번 더!`)
      setAttempt((n) => n + 1)
      return
    }
    setRetryNote(null)
    const lap: LapResult = { accuracy: r.accuracy, keystrokes: r.keystrokes, durationMs: r.durationMs, personalBest: false }
    setLaps((prev) => [...prev, lap])
    if (loggedIn) {
      submit.mutate(
        {
          verse_id: verse.id,
          mode: 'sprint',
          accuracy: r.accuracy,
          char_count: r.charCount,
          keystrokes: r.keystrokes,
          duration_ms: r.durationMs,
          merged_verse_ids: [],
        },
        {
          onSuccess: (res) => {
            if (res.personal_best) {
              setLaps((prev) => prev.map((l) => (l === lap ? { ...l, personalBest: true } : l)))
            }
          },
        },
      )
    }
    if (index + 1 >= set.length) {
      setClockMs(Date.now() - (startedAt.current ?? Date.now()))
      setPhase('done')
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.65 }, colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'] })
    } else {
      setIndex((n) => n + 1)
      setAttempt((n) => n + 1)
    }
  }

  const totalMs = phase === 'running' || phase === 'done' ? clockMs : 0

  const result = useMemo(() => {
    const keys = laps.reduce((s, l) => s + l.keystrokes, 0)
    const typingMs = laps.reduce((s, l) => s + l.durationMs, 0)
    const acc = laps.length ? laps.reduce((s, l) => s + l.accuracy, 0) / laps.length : 0
    return { cpm: cpmOf(keys, typingMs), acc, pb: laps.some((l) => l.personalBest) }
  }, [laps])

  const current = verses[index]
  const refOf = (i: number) => {
    const [b, c, n] = set[i]
    const name = books?.find((bk) => bk.book_number === b)?.book_name_ko
    return name ? `${name} ${c}:${n}` : ''
  }

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">말씀 스프린트</span>
              <h1 className="bt-head__title">익숙한 말씀 {SPRINT_SIZE}절, 빠르고 정확하게</h1>
            </div>
          </header>

          {phase === 'ready' && (
            <section className="bt-card bt-sprint-intro">
              <span className="bt-sprint-intro__icon material-icons-round" aria-hidden>
                timer
              </span>
              <p className="bt-sprint-intro__lead">
                시계는 첫 절이 뜨는 순간부터 달려요. 정확도 95%를 넘겨야 다음 절로 넘어갑니다.
              </p>
              {loggedIn && (stats?.best_cpm ?? 0) > 0 && (
                <p className="bt-sprint-intro__best">
                  나의 최고 타수 <b className="brand-text-gradient">{stats?.best_cpm}</b>타/분
                </p>
              )}
              <ul className="bt-sprint-refs">
                {set.map((_, i) => (
                  <li key={i}>{refOf(i) || '…'}</li>
                ))}
              </ul>
              <label className="bt-toggle">
                <input type="checkbox" checked={ignorePunct} onChange={(e) => setIgnorePunct(e.target.checked)} />
                <span>문장부호 무시</span>
              </label>
              <button type="button" className="bt-btn bt-btn--primary bt-btn--block" disabled={!ready} onClick={start}>
                {ready ? '시작하기' : '말씀 준비 중…'}
              </button>
              {!loggedIn && (
                <p className="bt-note">
                  <Link to="/login">로그인</Link>하면 기록과 칭호가 저장돼요.
                </p>
              )}
            </section>
          )}

          {phase === 'countdown' && (
            <div className="bt-countdown" aria-live="assertive">
              <span key={count}>{count}</span>
            </div>
          )}

          {phase === 'running' && current && (
            <section className="bt-card bt-active">
              <div className="bt-sprint-bar">
                <span className="bt-sprint-bar__ref">
                  {index + 1}/{set.length} · {refOf(index)}
                </span>
                <span className="bt-sprint-bar__clock">{formatDuration(totalMs)}</span>
              </div>
              <div className="bt-sprint-dots" aria-hidden>
                {set.map((_, i) => (
                  <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />
                ))}
              </div>
              <TypingPad
                key={`${index}-${attempt}`}
                text={current.text}
                mode="sprint"
                ignorePunct={ignorePunct}
                onFinish={handleFinish}
              />
              {retryNote && (
                <div className="bt-outcome bt-outcome--failed" role="status">
                  {retryNote}
                </div>
              )}
            </section>
          )}

          {phase === 'done' && (
            <section className="bt-card bt-sprint-result">
              <p className="bt-summary__eyebrow">완주!</p>
              <p className="bt-sprint-result__time brand-text-gradient">{formatDuration(totalMs)}</p>
              {result.pb && <span className="bt-badge bt-badge--best">개인 최고 타수 경신!</span>}
              <dl className="bt-summary__stats">
                <div>
                  <dt>평균 타수</dt>
                  <dd className="brand-text-gradient">{result.cpm}</dd>
                </div>
                <div>
                  <dt>정확도</dt>
                  <dd className="brand-text-gradient">{Math.round(result.acc * 100)}%</dd>
                </div>
                <div>
                  <dt>이전 최고</dt>
                  <dd>{bestBefore || '-'}</dd>
                </div>
              </dl>
              <ul className="bt-sprint-refs">
                {set.map((_, i) => (
                  <li key={i}>
                    {refOf(i)}
                    {laps[i] && <span> · {cpmOf(laps[i].keystrokes, laps[i].durationMs)}타</span>}
                  </li>
                ))}
              </ul>
              <div className="bt-summary__actions">
                <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={again}>
                  새 말씀으로 다시 도전
                </button>
                <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={() => navigate('/bible/typing')}>
                  필사 홈으로
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default TypingSprint
