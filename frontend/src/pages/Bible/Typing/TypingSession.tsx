import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
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
  maxCombo: number
}

// PC 무대 아래로 미리 보여 줄 다음 절 수
const STAGE_AHEAD = 2
// 장 지도 링 — r=44 원의 둘레
const RING_C = 2 * Math.PI * 44

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
  // PC 는 '필사 책상' — 지금 절만 무대에 올리고, 장 전체는 오른쪽 지도로 본다
  const isDesk = useMediaQuery('(min-width: 1024px)')

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
  // 무대 전환 방향(1 = 다음 절로, -1 = 앞 절로)
  const [dir, setDir] = useState<1 | -1>(1)
  const activeRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
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

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    },
    [],
  )

  // 지금 쓰는 절을 화면 위쪽으로 — 모바일 키보드가 아래 절반을 덮는다.
  // body 가 스크롤러라 sticky 대신 scrollIntoView 로 붙든다. PC 책상은 무대가 제자리라 필요 없다
  const scrollToActive = useCallback(() => {
    activeRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])
  useEffect(() => {
    if (current === null || isDesk) return
    const t = setTimeout(scrollToActive, 60)
    return () => clearTimeout(t)
  }, [current, scrollToActive, isDesk])
  // PC 장 지도 — 지금 절 칩이 지도 상자 안에 보이도록(페이지는 건드리지 않는다)
  useEffect(() => {
    if (!isDesk || current === null) return
    const box = mapRef.current
    const chip = box?.querySelector<HTMLElement>(`[data-map-idx="${current}"]`)
    if (!box || !chip) return
    const top = chip.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + chip.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({
        top: top - box.clientHeight / 2 + chip.offsetHeight / 2,
        behavior: 'smooth',
      })
    }
  }, [current, isDesk])
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || isDesk) return
    let last = vv.height
    const onResize = () => {
      // 키보드가 올라와 화면이 크게 줄었을 때만 다시 맞춘다
      if (last - vv.height > 120) scrollToActive()
      last = vv.height
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollToActive, isDesk])

  const goTo = (idx: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setDir(current !== null && idx < current ? -1 : 1)
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
      setOutcome({
        status: 'failed',
        accuracy: r.accuracy,
        cpm,
        note: '한꺼번에 들어온 입력은 기록되지 않아요. 직접 써 볼까요?',
      })
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
        next = {
          status: passed ? 'passed' : 'failed',
          accuracy: r.accuracy,
          cpm,
          note: '기록을 저장하지 못했어요 — 연결을 확인해 주세요',
        }
      }
    } else {
      next = {
        status: passed ? 'passed' : 'failed',
        accuracy: r.accuracy,
        cpm,
      }
    }
    setOutcome(next)
    if (!passed) return

    setResults((prev) => [
      ...prev,
      {
        verseId: sv.id,
        accuracy: next.accuracy,
        keystrokes: r.keystrokes,
        durationMs: r.durationMs,
        maxCombo: r.maxCombo,
      },
    ])
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
    advanceTimer.current = setTimeout(
      () => {
        if (ni === null) {
          setShowSummary(true)
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.7 },
            colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'],
          })
        } else {
          goTo(ni)
        }
      },
      next.personalBest ? 1400 : 900,
    )
  }

  const nextChapter = useMemo(() => {
    if (!book) return null
    if (chapter < book.chapter_count)
      return {
        book: bookNumber,
        chapter: chapter + 1,
        name: book.book_name_ko,
      }
    const nb = books?.find((b) => b.book_number === bookNumber + 1)
    return nb ? { book: nb.book_number, chapter: 1, name: nb.book_name_ko } : null
  }, [book, books, bookNumber, chapter])

  const doneCount = verses.filter((v) => done.has(v.id)).length
  const summary = useMemo(() => {
    const totalMs = results.reduce((s, r) => s + r.durationMs, 0)
    const keys = results.reduce((s, r) => s + r.keystrokes, 0)
    const acc = results.length ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0
    const bestCombo = results.reduce((m, r) => Math.max(m, r.maxCombo), 0)
    return {
      count: results.length,
      totalMs,
      cpm: cpmOf(keys, totalMs),
      acc,
      bestCombo,
    }
  }, [results])

  // 키보드 단축키 — Tab/Shift+Tab 절 이동, Esc 처음부터, 틀린 뒤 Enter 다시 쓰기,
  // 입력칸 밖에서 글자를 치면 바로 입력칸으로. 최신 상태는 ref 로 읽어 리스너는 한 번만 단다
  const keyState = useRef({
    current,
    outcome,
    showSummary,
    count: verses.length,
    goTo,
  })
  useEffect(() => {
    keyState.current = { current, outcome, showSummary, count: verses.length, goTo }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = keyState.current
      if (st.showSummary || st.current === null) return
      const cur = st.current
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const ni = e.shiftKey ? cur - 1 : cur + 1
        e.preventDefault()
        if (ni >= 0 && ni < st.count) st.goTo(ni)
        return
      }
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Escape') {
        if (document.querySelector('[role="dialog"]')) return
        e.preventDefault()
        st.goTo(cur)
        return
      }
      if (e.key === 'Enter' && st.outcome?.status === 'failed') {
        e.preventDefault()
        e.stopPropagation()
        st.goTo(cur)
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = document.activeElement
        const typingElsewhere =
          el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)
        if (!typingElsewhere)
          document.querySelector<HTMLTextAreaElement>('.bt-active .bt-input:not(:disabled)')?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  const keepAsCard = () => {
    const first = verses.find((v) => results.some((r) => r.verseId === v.id)) ?? verses[0]
    if (!first) return
    navigate('/bible/photo-verse', {
      state: {
        presetVerse: {
          text: first.text,
          refLabel: `${bookName} ${chapter}:${first.label}`,
        },
      },
    })
  }

  const modeLabel = mode === 'memorize' ? '암송 쓰기' : '따라 쓰기'

  const renderActive = (v: SessionVerse, i: number) => {
    const isDone = done.has(v.id)
    return (
      <div ref={activeRef} className={`bt-card bt-active${outcome?.status === 'passed' ? ' is-sealed' : ''}`}>
        {outcome?.status === 'passed' && (
          <span className="bt-seal" aria-hidden>
            새김
          </span>
        )}
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
    )
  }

  const curVerse = current !== null ? verses[current] : null
  const prevVerse = current !== null && current > 0 ? verses[current - 1] : null
  const aheadVerses = current !== null ? verses.slice(current + 1, current + 1 + STAGE_AHEAD) : []
  const ghostText = (v: SessionVerse) => (mode === 'memorize' && !done.has(v.id) ? v.text.replace(/[^\s]/g, '·') : v.text)
  const pct = verses.length ? doneCount / verses.length : 0

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className={`bt-shell bt-shell--session${isDesk ? ' bt-shell--desk' : ''}`}>
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

          {!isDesk && (
            <div className="bt-session-progress">
              <div className="bt-session-progress__bar">
                <span
                  style={{
                    width: `${verses.length ? (doneCount / verses.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="bt-session-progress__text">
                {doneCount}/{verses.length}절
              </span>
            </div>
          )}

          {!loggedIn && (
            <p className="bt-note">
              지금은 연습으로만 쓸 수 있어요. <Link to="/login">로그인</Link>
              하면 필사 기록·읽음 처리·칭호가 저장돼요.
            </p>
          )}

          {isLoading && <p className="bt-empty">말씀을 불러오는 중…</p>}
          {error && <p className="bt-empty">말씀을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}

          {isDesk && curVerse ? (
            <div className="bt-desk">
              <section className="bt-stage" style={{ ['--bt-dir' as string]: dir }}>
                {prevVerse && (
                  <button
                    key={`p${prevVerse.id}`}
                    type="button"
                    className="bt-stage__ctx bt-stage__ctx--prev"
                    onClick={() => goTo(current! - 1)}
                  >
                    <span className="bt-verse-no">{prevVerse.label}</span>
                    <span className="bt-stage__ctx-text">{ghostText(prevVerse)}</span>
                    {done.has(prevVerse.id) && (
                      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                        check_circle
                      </span>
                    )}
                  </button>
                )}
                <div key={curVerse.id} className="bt-stage__slide">
                  {renderActive(curVerse, current!)}
                </div>
                {aheadVerses.map((v, k) => (
                  <button
                    key={`n${v.id}`}
                    type="button"
                    className="bt-stage__ctx bt-stage__ctx--next"
                    style={{ ['--bt-fade' as string]: k }}
                    onClick={() => goTo(current! + 1 + k)}
                  >
                    <span className="bt-verse-no">{v.label}</span>
                    <span className="bt-stage__ctx-text">{ghostText(v)}</span>
                    {done.has(v.id) && (
                      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
                <p className="bt-keys" aria-label="키보드 단축키">
                  <span>
                    <kbd>Tab</kbd> 다음 절
                  </span>
                  <span>
                    <kbd>Shift</kbd>+<kbd>Tab</kbd> 앞 절
                  </span>
                  <span>
                    <kbd>Esc</kbd> 처음부터
                  </span>
                  <span>
                    <kbd>Enter</kbd> 완료·다시 쓰기
                  </span>
                  {mode === 'memorize' && (
                    <>
                      <span>
                        <kbd>Alt</kbd>+<kbd>H</kbd> 초성
                      </span>
                      <span>
                        <kbd>Alt</kbd>+<kbd>P</kbd> 잠깐 보기
                      </span>
                    </>
                  )}
                </p>
              </section>

              <aside className="bt-desk__side" aria-label="장 진행">
                <div className="bt-card bt-ringcard">
                  <div className="bt-ring" role="img" aria-label={`${verses.length}절 중 ${doneCount}절 필사`}>
                    <svg viewBox="0 0 100 100" aria-hidden>
                      <circle className="bt-ring__track" cx="50" cy="50" r="44" />
                      <circle
                        className="bt-ring__fill"
                        cx="50"
                        cy="50"
                        r="44"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - pct)}
                      />
                    </svg>
                    <span className="bt-ring__label">
                      <b className="brand-text-gradient">{Math.round(pct * 100)}</b>
                      <small>%</small>
                    </span>
                  </div>
                  <div className="bt-ringcard__body">
                    <span className="bt-ringcard__count">
                      {doneCount}/{verses.length}절
                    </span>
                    <span className="bt-ringcard__sub">
                      {doneCount === verses.length && verses.length > 0 ? '이 장을 다 새겼어요' : `${verses.length - doneCount}절 남았어요`}
                    </span>
                  </div>
                </div>

                <dl className="bt-card bt-sessionstats">
                  <div>
                    <dt>이번에 쓴 절</dt>
                    <dd>{summary.count}</dd>
                  </div>
                  <div>
                    <dt>평균 타수</dt>
                    <dd>{summary.cpm}</dd>
                  </div>
                  <div>
                    <dt>정확도</dt>
                    <dd>{summary.count ? `${Math.round(summary.acc * 100)}%` : '–'}</dd>
                  </div>
                  <div>
                    <dt>최고 연속</dt>
                    <dd>{summary.bestCombo}</dd>
                  </div>
                </dl>

                <div className="bt-card bt-map">
                  <p className="bt-map__title">장 지도</p>
                  <div ref={mapRef} className="bt-map__grid">
                    {verses.map((v, i) => (
                      <button
                        key={v.id}
                        type="button"
                        data-map-idx={i}
                        className={[
                          'bt-map__chip',
                          done.has(v.id) ? 'is-done' : '',
                          sessionDone.has(v.id) ? 'is-fresh' : '',
                          i === current ? 'is-now' : '',
                        ].join(' ')}
                        onClick={() => goTo(i)}
                        title={mode === 'memorize' && !done.has(v.id) ? `${v.label}절` : `${v.label}절 · ${v.text}`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <ol className="bt-verses">
              {verses.map((v, i) => {
                const isActive = i === current
                const isDone = done.has(v.id)
                if (isActive) return <li key={v.id}>{renderActive(v, i)}</li>
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
          )}
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
            <p className="bt-summary__time">
              걸린 시간 {formatDuration(summary.totalMs)}
              {summary.bestCombo >= 10 && <> · 최고 {summary.bestCombo}자 연속 정확</>}
            </p>
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
