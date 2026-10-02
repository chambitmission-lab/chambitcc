import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useChapterTyping, useSubmitTyping } from '../../../hooks/useBibleTyping'
import { tokenStore } from '../../../utils/tokenStore'
import type { TypingMode } from '../../../api/bibleTyping'
import type { BibleVerse } from '../../../types/bible'
import TypingPad, { type TypingFinish } from './TypingPad'
import { PASS_ACCURACY, cpmOf } from './hangulTyping'
import { formatDuration, sessionPath, useIgnorePunct } from './typingPrefs'
import './typing.css'

interface SessionVerse {
  id: number
  verse: number
  label: string
  text: string
  /** 병합 구간의 딸린 절 id — 함께 읽음 처리한다 */
  extraIds: number[]
}

interface Outcome {
  status: 'saving' | 'passed' | 'failed'
  accuracy: number
  cpm: number
  newlyRead?: boolean
  personalBest?: boolean
  note?: string
}

interface SessionResult {
  verseId: number
  accuracy: number
  keystrokes: number
  durationMs: number
}

const toSessionVerses = (verses: BibleVerse[]): SessionVerse[] => {
  const byNumber = new Map(verses.map((v) => [v.verse, v.id]))
  return verses
    .filter((v) => !v.merged_into)
    .map((v) => ({
      id: v.id,
      verse: v.verse,
      label: v.verse_label || String(v.verse),
      text: v.text,
      extraIds: (v.merged_verses ?? [])
        .filter((n) => n !== v.verse)
        .map((n) => byNumber.get(n))
        .filter((id): id is number => typeof id === 'number'),
    }))
}

const TypingSession = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [search] = useSearchParams()
  const bookNumber = Number(params.book) || 0
  const chapter = Number(params.chapter) || 0
  const mode: TypingMode = search.get('mode') === 'memorize' ? 'memorize' : 'copy'
  const startVerse = Number(search.get('v')) || 0
  const loggedIn = !!tokenStore.getAccess()

  const { data: books } = useBibleBooks()
  const { data: chapterData, isLoading, error } = useBibleChapter(bookNumber, chapter)
  const { data: typedIds } = useChapterTyping(bookNumber, chapter)
  const submit = useSubmitTyping()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()

  const book = books?.find((b) => b.book_number === bookNumber)
  const bookName = chapterData?.book_name_ko ?? book?.book_name_ko ?? ''
  const verses = useMemo(() => toSessionVerses(chapterData?.verses ?? []), [chapterData])

  const [sessionDone, setSessionDone] = useState<Set<number>>(() => new Set())
  const done = useMemo(() => {
    const s = new Set<number>(typedIds ?? [])
    sessionDone.forEach((id) => s.add(id))
    return s
  }, [typedIds, sessionDone])

  const [active, setActive] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [results, setResults] = useState<SessionResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 시작 절 — ?v= 가 있으면 그 절, 없으면 아직 안 쓴 첫 절. 첫 글자를 치는 순간(onStart)
  // active 로 굳혀, 그 뒤 진행 목록이 다시 와도 쓰던 절이 바뀌지 않게 한다
  const defaultIdx = useMemo(() => {
    if (verses.length === 0) return null
    if (loggedIn && typedIds === undefined) return null
    let idx = startVerse ? verses.findIndex((v) => v.verse === startVerse) : -1
    if (idx < 0) idx = verses.findIndex((v) => !(typedIds ?? []).includes(v.id))
    return idx < 0 ? 0 : idx
  }, [verses, typedIds, startVerse, loggedIn])
  const current = active ?? defaultIdx

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
  }, [])

  // 지금 쓰는 절을 화면 위쪽으로 — 모바일 키보드가 아래 절반을 덮는다.
  // body 가 스크롤러라 sticky 대신 scrollIntoView 로 붙든다
  const scrollToActive = useCallback(() => {
    activeRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])
  useEffect(() => {
    if (current === null) return
    const t = setTimeout(scrollToActive, 60)
    return () => clearTimeout(t)
  }, [current, scrollToActive])
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let last = vv.height
    const onResize = () => {
      // 키보드가 올라와 화면이 크게 줄었을 때만 다시 맞춘다
      if (last - vv.height > 120) scrollToActive()
      last = vv.height
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollToActive])

  const goTo = (idx: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setActive(idx)
    setAttempt((n) => n + 1)
    setOutcome(null)
  }

  const nextIndex = (from: number, doneSet: Set<number>) => {
    for (let i = from + 1; i < verses.length; i++) if (!doneSet.has(verses[i].id)) return i
    for (let i = 0; i < from; i++) if (!doneSet.has(verses[i].id)) return i
    return null
  }

  const handleFinish = async (sv: SessionVerse, r: TypingFinish) => {
    const cpm = cpmOf(r.keystrokes, r.durationMs)
    if (r.suspicious) {
      setOutcome({ status: 'failed', accuracy: r.accuracy, cpm, note: '한꺼번에 들어온 입력은 기록되지 않아요. 직접 써 볼까요?' })
      return
    }
    let passed = r.accuracy >= PASS_ACCURACY
    let next: Outcome = { status: 'saving', accuracy: r.accuracy, cpm }
    setOutcome(next)
    if (loggedIn) {
      try {
        const res = await submit.mutateAsync({
          verse_id: sv.id,
          mode,
          accuracy: r.accuracy,
          char_count: r.charCount,
          keystrokes: r.keystrokes,
          duration_ms: r.durationMs,
          merged_verse_ids: sv.extraIds,
        })
        passed = res.passed
        next = {
          status: passed ? 'passed' : 'failed',
          accuracy: res.accuracy,
          cpm: res.cpm,
          newlyRead: res.marked_read_ids.length > 0,
          personalBest: res.personal_best,
          note: res.counted ? undefined : '너무 빠른 입력이라 기록으로 인정되지 않았어요',
        }
      } catch {
        next = { status: passed ? 'passed' : 'failed', accuracy: r.accuracy, cpm, note: '기록을 저장하지 못했어요 — 연결을 확인해 주세요' }
      }
    } else {
      next = { status: passed ? 'passed' : 'failed', accuracy: r.accuracy, cpm }
    }
    setOutcome(next)
    if (!passed) return

    setResults((prev) => [...prev, { verseId: sv.id, accuracy: next.accuracy, keystrokes: r.keystrokes, durationMs: r.durationMs }])
    // 이미 다 쓴 장을 다시 쓰는 중이면 남은 절이 없어도 차례로 이어 간다(마지막 절에서 마무리)
    const wasComplete = verses.every((v) => done.has(v.id))
    const newDone = new Set(done)
    newDone.add(sv.id)
    sv.extraIds.forEach((id) => newDone.add(id))
    setSessionDone((prev) => {
      const s = new Set(prev)
      s.add(sv.id)
      sv.extraIds.forEach((id) => s.add(id))
      return s
    })
    const idx = verses.findIndex((v) => v.id === sv.id)
    const ni = wasComplete ? (idx < verses.length - 1 ? idx + 1 : null) : nextIndex(idx, newDone)
    advanceTimer.current = setTimeout(() => {
      if (ni === null) {
        setShowSummary(true)
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'] })
      } else {
        goTo(ni)
      }
    }, next.personalBest ? 1400 : 900)
  }

  const nextChapter = useMemo(() => {
    if (!book) return null
    if (chapter < book.chapter_count) return { book: bookNumber, chapter: chapter + 1, name: book.book_name_ko }
    const nb = books?.find((b) => b.book_number === bookNumber + 1)
    return nb ? { book: nb.book_number, chapter: 1, name: nb.book_name_ko } : null
  }, [book, books, bookNumber, chapter])

  const doneCount = verses.filter((v) => done.has(v.id)).length
  const summary = useMemo(() => {
    const totalMs = results.reduce((s, r) => s + r.durationMs, 0)
    const keys = results.reduce((s, r) => s + r.keystrokes, 0)
    const acc = results.length ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0
    return { count: results.length, totalMs, cpm: cpmOf(keys, totalMs), acc }
  }, [results])

  const keepAsCard = () => {
    const first = verses.find((v) => results.some((r) => r.verseId === v.id)) ?? verses[0]
    if (!first) return
    navigate('/bible/photo-verse', {
      state: { presetVerse: { text: first.text, refLabel: `${bookName} ${chapter}:${first.label}` } },
    })
  }

  const modeLabel = mode === 'memorize' ? '암송 쓰기' : '따라 쓰기'

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1180px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">{modeLabel}</span>
              <h1 className="bt-head__title">
                {bookName} {chapter}장
              </h1>
            </div>
            <button
              type="button"
              className={`bt-chip${ignorePunct ? ' is-on' : ''}`}
              onClick={() => setIgnorePunct(!ignorePunct)}
              aria-pressed={ignorePunct}
              title="쉼표·마침표 같은 문장부호를 치지 않아도 되게 합니다"
            >
              부호 무시
            </button>
          </header>

          <div className="bt-session-progress">
            <div className="bt-session-progress__bar">
              <span style={{ width: `${verses.length ? (doneCount / verses.length) * 100 : 0}%` }} />
            </div>
            <span className="bt-session-progress__text">
              {doneCount}/{verses.length}절
            </span>
          </div>

          {!loggedIn && (
            <p className="bt-note">
              지금은 연습으로만 쓸 수 있어요. <Link to="/login">로그인</Link>하면 필사 기록·읽음 처리·칭호가 저장돼요.
            </p>
          )}

          {isLoading && <p className="bt-empty">말씀을 불러오는 중…</p>}
          {error && <p className="bt-empty">말씀을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}

          <ol className="bt-verses">
            {verses.map((v, i) => {
              const isActive = i === current
              const isDone = done.has(v.id)
              if (isActive) {
                return (
                  <li key={v.id}>
                    <div ref={activeRef} className="bt-card bt-active">
                      <div className="bt-card__label">
                        <span className="bt-verse-no">{v.label}절</span>
                        {isDone && outcome?.status !== 'passed' && <span className="bt-badge">이미 쓴 절</span>}
                      </div>
                      <TypingPad
                        key={`${v.id}-${attempt}-${ignorePunct ? 1 : 0}`}
                        text={v.text}
                        mode={mode}
                        ignorePunct={ignorePunct}
                        disabled={outcome !== null && outcome.status !== 'failed'}
                        onStart={() => setActive(i)}
                        onFinish={(r) => void handleFinish(v, r)}
                      />
                      {outcome && (
                        <div className={`bt-outcome bt-outcome--${outcome.status}`} role="status">
                          {outcome.status === 'saving' && <span>기록하는 중…</span>}
                          {outcome.status === 'passed' && (
                            <>
                              <span className="material-icons-round" aria-hidden>
                                check_circle
                              </span>
                              <span>
                                정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> · <b>{outcome.cpm}</b>타/분
                                {outcome.newlyRead && ' · 읽음 완료'}
                              </span>
                              {outcome.personalBest && <span className="bt-badge bt-badge--best">개인 최고 기록!</span>}
                            </>
                          )}
                          {outcome.status === 'failed' && (
                            <>
                              <span>
                                {outcome.note ?? (
                                  <>
                                    정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> — 95% 이상이면 완료돼요
                                  </>
                                )}
                              </span>
                              <span className="bt-outcome__actions">
                                <button type="button" className="bt-btn bt-btn--primary" onClick={() => goTo(i)}>
                                  다시 쓰기
                                </button>
                                {i < verses.length - 1 && (
                                  <button type="button" className="bt-btn" onClick={() => goTo(i + 1)}>
                                    다음 절
                                  </button>
                                )}
                              </span>
                            </>
                          )}
                          {outcome.status === 'passed' && outcome.note && <span className="bt-outcome__note">{outcome.note}</span>}
                        </div>
                      )}
                    </div>
                  </li>
                )
              }
              return (
                <li key={v.id}>
                  <button type="button" className={`bt-row${isDone ? ' is-done' : ''}`} onClick={() => goTo(i)}>
                    <span className="bt-verse-no">{v.label}</span>
                    <span className={`bt-row__text${mode === 'memorize' && !isDone ? ' is-masked' : ''}`}>
                      {mode === 'memorize' && !isDone ? v.text.replace(/[^\s]/g, '·') : v.text}
                    </span>
                    {isDone && (
                      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                        check_circle
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </main>
      </div>

      {showSummary && (
        <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-summary-title">
          <div className="bt-summary__card">
            <span className="bt-summary__seal" aria-hidden>
              <span className="material-icons-round">history_edu</span>
            </span>
            <p className="bt-summary__eyebrow">필사 완료</p>
            <h2 id="bt-summary-title" className="bt-summary__title">
              {bookName} {chapter}장을 온전히 새겼어요
            </h2>
            <dl className="bt-summary__stats">
              <div>
                <dt>이번에 쓴 절</dt>
                <dd className="brand-text-gradient">{summary.count}</dd>
              </div>
              <div>
                <dt>평균 타수</dt>
                <dd className="brand-text-gradient">{summary.cpm}</dd>
              </div>
              <div>
                <dt>정확도</dt>
                <dd className="brand-text-gradient">{Math.round(summary.acc * 100)}%</dd>
              </div>
            </dl>
            <p className="bt-summary__time">걸린 시간 {formatDuration(summary.totalMs)}</p>
            <div className="bt-summary__actions">
              {nextChapter && (
                <button
                  type="button"
                  className="bt-btn bt-btn--primary bt-btn--block"
                  onClick={() => {
                    setShowSummary(false)
                    setResults([])
                    setSessionDone(new Set())
                    setActive(null)
                    setOutcome(null)
                    navigate(sessionPath(nextChapter.book, nextChapter.chapter, mode), { replace: true })
                  }}
                >
                  이어서 {nextChapter.name} {nextChapter.chapter}장 쓰기
                </button>
              )}
              <button type="button" className="bt-btn bt-btn--block" onClick={keepAsCard}>
                말씀 카드로 간직하기
              </button>
              <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={() => navigate('/bible/typing')}>
                필사 홈으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TypingSession
