import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../../components/bible/BibleSideRail'
import { getMannaSet, type MannaKind, type MannaRunResult, type MannaSet } from '../../../../api/bibleTyping'
import { bibleTypingKeys, useMannaSummary, useSubmitManna } from '../../../../hooks/useBibleTyping'
import { safeStorage } from '../../../../utils/safeStorage'
import { tokenStore } from '../../../../utils/tokenStore'
import { showToast } from '../../../../utils/toast'
import { shareOrDownload } from '../dailyCard'
import { playTypingSound } from '../typingSound'
import SoundMenu from '../SoundMenu'
import {
  ITEMS,
  MANNA_MODES,
  MAX_JARS,
  MannaGame,
  PLACES,
  type MannaBanner,
  type MannaHud,
  type MannaMode,
  type MannaResult,
  type MannaVerseView,
} from './mannaEngine'
import { renderMannaCard } from './mannaCard'
import MannaBoards from './MannaBoards'
import '../typing.css'
import './manna.css'

const MODE_KEY = 'manna-mode'
const KIND_KEY = 'manna-kind'
const modeLabel = (m: MannaMode) => MANNA_MODES.find((x) => x.key === m)?.label ?? ''

// 시작 카드에서 순서대로 내려오는 미리보기(요 3:16 앞머리)
const PREVIEW_WORDS = ['하나님이', '세상을', '이처럼', '사랑하사']

const Dunes = () => (
  <svg className="mn-dunes" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden>
    <path className="mn-dunes__back" d="M0 24 C 60 8, 120 36, 200 20 S 330 4, 400 22 V56 H0Z" />
    <path className="mn-dunes__front" d="M0 38 C 80 24, 150 48, 240 34 S 360 26, 400 36 V56 H0Z" />
  </svg>
)

type Phase = 'start' | 'loading' | 'playing' | 'over'

interface Finished {
  set: MannaSet
  mode: MannaMode
  result: MannaResult
  saved: MannaRunResult | null
  saveFailed: boolean
}

/**
 * 만나 내리기 — 하늘에서 순서대로 내려오는 말씀 단어를 쳐서 거두고, 한 절씩 새겨 가나안까지.
 * 오늘의 만나(교회 전체가 같은 판·난이도별 순위·부서 대항전)와 연습 판.
 */
const MannaPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const loggedIn = !!tokenStore.getAccess()
  const { data: summary } = useMannaSummary()
  const submit = useSubmitManna()

  const [mode, setModeState] = useState<MannaMode>(() => {
    const v = safeStorage.get(MODE_KEY)
    return MANNA_MODES.some((m) => m.key === v) ? (v as MannaMode) : 'normal'
  })
  const [kind, setKindState] = useState<MannaKind>(() => (safeStorage.get(KIND_KEY) === 'free' ? 'free' : 'daily'))
  const setMode = (m: MannaMode) => {
    setModeState(m)
    safeStorage.set(MODE_KEY, m)
  }
  const setKind = (k: MannaKind) => {
    setKindState(k)
    safeStorage.set(KIND_KEY, k)
  }

  const [phase, setPhase] = useState<Phase>('start')
  const [set, setSet] = useState<MannaSet | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)

  const start = async () => {
    setPhase('loading')
    try {
      const data = await qc.fetchQuery({
        queryKey: [...bibleTypingKeys.manna(), 'set', kind],
        queryFn: () => getMannaSet(kind),
        // 오늘의 만나는 하루 같은 판 — 잠깐은 캐시로, 연습 판은 매번 새로
        staleTime: kind === 'daily' ? 60_000 : 0,
      })
      if (!data.verses.length) throw new Error('empty')
      setSet(data)
      setPhase('playing')
    } catch {
      showToast('만나를 내릴 말씀을 불러오지 못했어요', 'error')
      setPhase('start')
    }
  }

  const onOver = useCallback(
    (result: MannaResult) => {
      if (!set) return
      const playedMode = mode
      setFinished({ set, mode: playedMode, result, saved: null, saveFailed: false })
      setPhase('over')
      window.scrollTo({ top: 0 })
      if (result.reachedCanaan) {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: ['#f3c96b', '#fff9ea', '#f0b98a', '#9fdcff'] })
      }
      if (!loggedIn || (result.versesDone === 0 && result.wordsCaught === 0)) return
      submit.mutate(
        {
          kind: set.kind,
          mode: playedMode,
          set_date: set.date,
          score: result.score,
          verses_done: result.versesDone,
          perfect_verses: result.perfectVerses,
          words_caught: result.wordsCaught,
          words_missed: result.wordsMissed,
          max_combo: result.maxCombo,
          duration_ms: result.durationMs,
        },
        {
          onSuccess: (saved) => setFinished((f) => (f ? { ...f, saved } : f)),
          onError: () => setFinished((f) => (f ? { ...f, saveFailed: true } : f)),
        },
      )
    },
    // submit.mutate 는 안정적이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [set, mode, loggedIn],
  )

  const best = summary?.best[mode] ?? 0
  const today = summary?.today

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session mn-shell">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">필사 미니게임</span>
              <h1 className="bt-head__title">만나 내리기</h1>
            </div>
            <SoundMenu />
          </header>

          {phase === 'over' && finished ? (
            <MannaResultCard
              finished={finished}
              loggedIn={loggedIn}
              saving={submit.isPending}
              onAgain={() => void start()}
              onBack={() => setPhase('start')}
            />
          ) : (
            <section className="mn-hero">
              <div className="mn-hero__stage">
                <div className="mn-sky" aria-hidden />
                <div className="mn-sun" aria-hidden />
                <div className="mn-rain" aria-hidden>
                  {PREVIEW_WORDS.map((w, i) => (
                    <span
                      key={w}
                      className={`mn-m mn-m--static${i === 0 ? ' is-turn' : ''}`}
                      style={{ position: 'absolute', left: `${6 + i * 22}%`, top: 128 + (i % 2) * 6, animationDelay: `${i * 0.55}s` }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
                <Dunes />
                <div className="mn-hero__top">
                  <span className="mn-pill">
                    <span className="material-icons-round" style={{ fontSize: 14 }} aria-hidden>
                      keyboard
                    </span>
                    필사 미니게임
                  </span>
                  {summary && summary.players_today > 0 && <span className="mn-pill mn-pill--live">오늘 {summary.players_today}명 거두는 중</span>}
                </div>
                <div className="mn-hero__title-wrap">
                  <p className="mn-hero__eyebrow">출애굽기 16장 · 광야의 아침</p>
                  <h2 className="mn-hero__title">
                    말씀이 <em>쏟아져요</em>
                  </h2>
                </div>
              </div>

              <div className="mn-hero__body">
                <p className="mn-hero__lede">
                  단어가 <b>순서대로</b> 내려와요. 땅에 닿기 전에 차례대로 쳐서 거두고, 여덟 절을 새겨 <b>가나안</b>까지.
                </p>

                {loggedIn && (
                  <div className="mn-kpis">
                    <div className="mn-kpi">
                      <b>{best > 0 ? best.toLocaleString('ko-KR') : '–'}</b>
                      <span>{modeLabel(mode)} 최고점</span>
                    </div>
                    <div className="mn-kpi">
                      <b>{today?.rank ? `${today.rank}위` : '–'}</b>
                      <span>{today?.rank ? `오늘 ${modeLabel(today.mode)}` : '오늘 순위'}</span>
                    </div>
                    <div className="mn-kpi">
                      <b>{summary?.players_today ?? 0}명</b>
                      <span>오늘 참여</span>
                    </div>
                  </div>
                )}

                <div className="mn-seg" role="radiogroup" aria-label="판 종류" data-on={kind === 'free' ? 1 : 0}>
                  <span className="mn-seg__thumb" aria-hidden />
                  <button type="button" role="radio" aria-checked={kind === 'daily'} className={`mn-seg__btn${kind === 'daily' ? ' is-on' : ''}`} onClick={() => setKind('daily')}>
                    <strong>오늘의 만나</strong>
                    <span>모두 같은 판 · 순위</span>
                  </button>
                  <button type="button" role="radio" aria-checked={kind === 'free'} className={`mn-seg__btn${kind === 'free' ? ' is-on' : ''}`} onClick={() => setKind('free')}>
                    <strong>연습</strong>
                    <span>매번 다른 말씀</span>
                  </button>
                </div>

                <div className="mn-modes" role="radiogroup" aria-label="난이도">
                  {MANNA_MODES.map((m, li) => (
                    <button
                      key={m.key}
                      type="button"
                      role="radio"
                      aria-checked={mode === m.key}
                      className={`mn-mode${mode === m.key ? ' is-on' : ''}`}
                      onClick={() => setMode(m.key)}
                    >
                      <span className="mn-mode__lv" aria-hidden>
                        {[0, 1, 2].map((k) => (
                          <i key={k} className={k <= li ? 'is-on' : ''} />
                        ))}
                      </span>
                      <strong>{m.label}</strong>
                      <span>{m.desc}</span>
                    </button>
                  ))}
                </div>

                <button type="button" className="mn-cta" disabled={phase === 'loading'} onClick={() => void start()}>
                  {phase === 'loading' ? (
                    '만나를 준비하는 중…'
                  ) : (
                    <>
                      광야로 나가기
                      <span className="material-icons-round" aria-hidden>
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                {!loggedIn && (
                  <p className="mn-hero__meta">
                    <Link to="/login">로그인</Link>하면 오늘의 만나 순위와 부서 대항전에 올라가요
                  </p>
                )}

                <details className="mn-howto">
                  <summary>
                    <span className="material-icons-round" aria-hidden>
                      menu_book
                    </span>
                    만나 도감 · 놀이 방법
                  </summary>
                  <ul className="mn-legend">
                    <li>
                      <span className="mn-m mn-m--static is-turn">사랑하사</span>
                      금빛 <b>차례</b> 단어를 치고 스페이스나 엔터. 놓치면 항아리 하나가 비어요(모두 {MAX_JARS}개)
                    </li>
                    <li>
                      <span className="mn-m mn-m--static mn-m--decoy">원망</span>
                      벌레 먹은 만나 — 치면 감점, 그냥 두면 +20
                    </li>
                    {(Object.keys(ITEMS) as (keyof typeof ITEMS)[]).map((k) => (
                      <li key={k}>
                        <span className={`mn-m mn-m--static mn-m--item mn-m--${k}`}>{ITEMS[k].text}</span>
                        {ITEMS[k].desc}
                      </li>
                    ))}
                    <li className="mn-legend__wide">
                      <span className="material-icons-round" aria-hidden>
                        auto_awesome
                      </span>
                      <span>
                        한 절을 하나도 놓치지 않으면 <b>온전히 새김</b> +500 · 세 절마다 <b>여섯째 날</b> 10초 동안 점수 두 배
                      </span>
                    </li>
                  </ul>
                </details>
              </div>
            </section>
          )}

          {loggedIn && <MannaBoards mode={finished && phase === 'over' ? finished.mode : mode} onModeChange={setMode} />}
        </main>
      </div>

      {phase === 'playing' && set && (
        <MannaGameLayer
          set={set}
          mode={mode}
          onOver={onOver}
          onQuitEarly={() => setPhase('start')}
        />
      )}
    </div>
  )
}

// ── 한 판 ─────────────────────────────────────────────

const MannaGameLayer = ({
  set,
  mode,
  onOver,
  onQuitEarly,
}: {
  set: MannaSet
  mode: MannaMode
  onOver: (r: MannaResult) => void
  onQuitEarly: () => void
}) => {
  const layerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<MannaGame | null>(null)
  const pendingEnter = useRef(false)

  const [hud, setHud] = useState<MannaHud>({ score: 0, combo: 0, mult: 1, jars: MAX_JARS, done: 0, fever: false, slow: false })
  const [verse, setVerse] = useState<MannaVerseView | null>(null)
  const [banner, setBanner] = useState<MannaBanner | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [paused, setPaused] = useState(false)
  const [lostJar, setLostJar] = useState(-1)
  const prevJars = useRef(MAX_JARS)
  const onOverRef = useRef(onOver)
  useEffect(() => {
    onOverRef.current = onOver
  }, [onOver])

  // 화면 키보드가 올라와도 입력칸이 보이게 — 보이는 영역에 맞춘다
  useEffect(() => {
    const layer = layerRef.current
    const vv = window.visualViewport
    if (!layer) return
    const fit = () => {
      if (!vv) return
      layer.style.setProperty('--mn-vvh', `${vv.height}px`)
      layer.style.setProperty('--mn-vvt', `${vv.offsetTop}px`)
    }
    fit()
    vv?.addEventListener('resize', fit)
    vv?.addEventListener('scroll', fit)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      vv?.removeEventListener('resize', fit)
      vv?.removeEventListener('scroll', fit)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    // 마운트마다 새 판 — StrictMode 는 붙였다 떼고 다시 붙이므로 '한 번만' 막으면 정리된 판만 남는다
    const stage = stageRef.current
    if (!stage) return
    prevJars.current = MAX_JARS
    const game = new MannaGame({
      stage,
      verses: set.verses.map((v) => ({ ref: v.ref, text: v.text })),
      mode,
      seed: set.seed,
      callbacks: {
        onHud: (h) => {
          if (h.jars < prevJars.current) setLostJar(h.jars)
          prevJars.current = h.jars
          setHud(h)
        },
        onVerse: setVerse,
        onBanner: setBanner,
        onToast: (text) => setToast({ id: Date.now(), text }),
        onShake: () => {
          const bar = barRef.current
          if (!bar) return
          bar.classList.remove('is-shake')
          void bar.offsetWidth
          bar.classList.add('is-shake')
        },
        onOver: (r) => onOverRef.current(r),
      },
    })
    gameRef.current = game
    game.start()
    inputRef.current?.focus()
    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [set, mode])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const pause = useCallback((p: boolean) => {
    gameRef.current?.setPaused(p)
    setPaused(p)
    if (!p) setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pause(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [pause])

  const submitInput = () => {
    const input = inputRef.current
    if (!input) return
    const v = input.value
    input.value = ''
    gameRef.current?.submit(v)
    gameRef.current?.aim('')
  }

  const quit = () => {
    const g = gameRef.current
    if (!g || (hud.score === 0 && hud.done === 0)) {
      onQuitEarly()
      return
    }
    g.quit()
  }

  const place = PLACES[Math.min(hud.done, PLACES.length - 1)]

  return createPortal(
    <div
      ref={layerRef}
      className={`mn-game${hud.fever ? ' is-fever' : ''}${hud.slow ? ' is-slow' : ''}${mode === 'easy' ? ' is-easy' : ''}`}
      style={{ '--mn-dawn': Math.min(1, hud.done / (set.verses.length - 1 || 1)).toFixed(2) } as CSSProperties}
      role="application"
      aria-label="만나 내리기"
    >
      <div className="mn-sky" aria-hidden />
      <div className="mn-sun" aria-hidden />
      <div className="mn-game__glow" aria-hidden />

      <header className="mn-hud">
        <div className="mn-hud__place">
          <button type="button" className="mn-hud__btn" onClick={() => pause(true)} aria-label="잠시 멈춤">
            <span className="material-icons-round">pause</span>
          </button>
          <span>
            <span className="mn-hud__day">
              {hud.done + 1}일째 · {set.kind === 'daily' ? '오늘의 만나' : '연습'} · {modeLabel(mode)}
            </span>
            <span className="mn-hud__name">{place}</span>
          </span>
        </div>
        <div className="mn-hud__score">
          <span className="mn-hud__num">{hud.score.toLocaleString('ko-KR')}</span>
          {hud.combo >= 2 ? (
            <span key={hud.combo} className="mn-hud__combo">
              {hud.combo} 콤보{hud.mult > 1 ? ` ×${hud.mult}` : ''}
            </span>
          ) : (
            <span className="mn-hud__combo mn-hud__combo--empty" />
          )}
        </div>
        <div className="mn-hud__right">
          <span className="mn-jars" aria-label={`만나 항아리 ${hud.jars}개 남음`}>
            {Array.from({ length: MAX_JARS }, (_, i) => (
              <svg key={i} viewBox="0 0 16 20" className={`mn-jar${i < hud.jars ? ' is-full' : ''}${i === lostJar ? ' is-lost' : ''}`} aria-hidden>
                <path d="M5 1.5h6M5.5 1.5v3C2.5 6 1.5 8.5 1.5 12c0 4 2.5 6.5 6.5 6.5s6.5-2.5 6.5-6.5c0-3.5-1-6-4-7.5v-3" />
              </svg>
            ))}
          </span>
        </div>
      </header>
      <div className="mn-track" aria-label={`노정 ${hud.done}/${set.verses.length} · 지금 ${place}`}>
        <div className="mn-track__rail">
          <span className="mn-track__fill" style={{ width: `calc((100% - 8px) * ${Math.min(1, hud.done / (set.verses.length || 1))})` }} />
          {Array.from({ length: set.verses.length + 1 }, (_, i) => (
            <span
              key={i}
              className={`mn-track__dot${i < hud.done ? ' is-done' : ''}${i === hud.done ? ' is-now' : ''}${i === set.verses.length && i !== hud.done ? ' is-goal' : ''}`}
            />
          ))}
        </div>
      </div>
      <div className="mn-chips">
        {hud.fever && <span className="mn-chip mn-chip--fever">여섯째 날 · 점수 2배</span>}
        {hud.slow && <span className="mn-chip mn-chip--slow">구름기둥 · 천천히</span>}
      </div>

      {verse && (
        <section className={`mn-verse${mode === 'easy' ? ' is-hint' : ''}`} aria-live="polite">
          <div className="mn-verse__card">
            <p className="mn-verse__ref">
              {verse.ref}
              <span className="mn-verse__count">
                {verse.index + 1}/{set.verses.length}절
              </span>
            </p>
            <p className="mn-verse__line">
              {verse.words.map((w, i) => (
                <span
                  key={`${verse.index}-${i}`}
                  className={
                    verse.states[i] === 'got'
                      ? `mn-w-got${i === verse.fresh ? ' is-fresh' : ''}`
                      : verse.states[i] === 'miss'
                        ? 'mn-w-miss'
                        : `mn-w-blank${i === verse.turn ? ' is-next' : ''}`
                  }
                >
                  {w}
                </span>
              ))}
            </p>
          </div>
        </section>
      )}

      <div className="mn-stage" ref={stageRef} onPointerDown={() => setTimeout(() => inputRef.current?.focus(), 0)}>
        <Dunes />
      </div>

      <div className="mn-typebar" ref={barRef}>
        <div className="mn-typebar__field">
          <input
            ref={inputRef}
            className="mn-input"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
            placeholder="금빛 '차례' 단어를 입력"
            aria-label="단어 입력"
            onInput={(e) => {
              const input = e.currentTarget
              const v = input.value
              if (/\s/.test(v)) {
                const parts = v.split(/\s+/)
                const rest = parts.pop() ?? ''
                parts.filter(Boolean).forEach((p) => gameRef.current?.submit(p))
                input.value = rest
              }
              gameRef.current?.aim(input.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                // 한글 조합 중 엔터는 조합이 끝난 뒤에 거둔다
                if (e.nativeEvent.isComposing || e.keyCode === 229) {
                  pendingEnter.current = true
                  return
                }
                submitInput()
                return
              }
              if (e.key === 'Escape') {
                pause(true)
                return
              }
              if (e.key === ' ') playTypingSound('space')
              else if (e.key === 'Backspace') playTypingSound('back')
              else if (e.key.length === 1 || e.key === 'Process') playTypingSound('key')
            }}
            onCompositionEnd={() => {
              if (pendingEnter.current) {
                pendingEnter.current = false
                setTimeout(submitInput, 0)
              }
            }}
          />
          <button
            type="button"
            className="mn-send"
            aria-label="거두기"
            // 화면 키보드가 내려가지 않게 입력칸 포커스를 지킨다
            onPointerDown={(e) => e.preventDefault()}
            onClick={submitInput}
          >
            <span className="material-icons-round" aria-hidden>
              arrow_upward
            </span>
          </button>
        </div>
        <p className="mn-typebar__hint">
          말씀은 순서대로 내려와요 · <kbd>Space</kbd> 또는 <kbd>Enter</kbd>로 거두기
        </p>
      </div>

      {banner && (
        <div className="mn-banner" role="status">
          <div className="mn-banner__card">
            <span className="mn-seal" aria-hidden>
              새김
            </span>
            <p className="mn-banner__ref">{banner.perfect ? `${banner.ref} · 온전히 새김` : banner.ref}</p>
            <p className="mn-banner__text">{banner.text}</p>
            <p className="mn-banner__next">
              {banner.perfect ? `한 단어도 놓치지 않았어요 +${banner.bonus}` : `놓친 단어 ${banner.missed}개`}
              {banner.last ? ' · 가나안에 닿았어요!' : ` · 다음 노정 ${banner.nextPlace}`}
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div key={toast.id} className="mn-toast" role="status">
          {toast.text}
        </div>
      )}

      {paused && (
        <div className="mn-overlay">
          <div className="mn-overlay__card">
            <span className="mn-overlay__icon" aria-hidden>
              <span className="material-icons-round">pause</span>
            </span>
            <p className="mn-overlay__title">잠시 쉬는 중</p>
            <p className="mn-overlay__text">만나는 기다려 줘요 · 지금 {hud.score.toLocaleString('ko-KR')}점</p>
            <div className="mn-overlay__score">
              <span className="mn-pill">{place}</span>
              <span className="mn-pill">
                {hud.done}/{set.verses.length}절
              </span>
              <span className="mn-pill">항아리 {hud.jars}</span>
            </div>
            <button type="button" className="mn-cta" onClick={() => pause(false)}>
              이어서 거두기
            </button>
            <button
              type="button"
              className="mn-cta mn-cta--ghost"
              onClick={() => {
                setPaused(false)
                quit()
              }}
            >
              여기서 마치기
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

// ── 결과 ─────────────────────────────────────────────

const MannaResultCard = ({
  finished,
  loggedIn,
  saving,
  onAgain,
  onBack,
}: {
  finished: Finished
  loggedIn: boolean
  saving: boolean
  onAgain: () => void
  onBack: () => void
}) => {
  const { result, saved, set, mode } = finished
  const [sharing, setSharing] = useState(false)
  const shownScore = useCountUp(result.score)
  const place = PLACES[Math.min(result.versesDone, PLACES.length - 1)]
  const kindLabel = set.kind === 'daily' ? '오늘의 만나' : '연습'
  const rankLine =
    saved && saved.kind === 'daily' && saved.rank ? `오늘의 만나 ${modeLabel(mode)} ${saved.players}명 중 ${saved.rank}위` : null

  const share = async () => {
    setSharing(true)
    try {
      const blob = await renderMannaCard({
        eyebrow: `${kindLabel} · ${modeLabel(mode)} · ${set.date.replace(/-/g, '.')}`,
        place,
        score: result.score,
        statLine: `새긴 말씀 ${result.versesDone}절 · 온전히 ${result.perfectVerses}절 · 최고 콤보 ${result.maxCombo}`,
        refs: result.refs,
        rankLine,
      })
      if (!blob) throw new Error('canvas')
      const r = await shareOrDownload(blob, `만나내리기-${set.date}.png`, `만나 내리기 · ${place}까지 ${result.score.toLocaleString('ko-KR')}점`)
      if (r === 'downloaded') showToast('카드 이미지를 저장했어요', 'success')
    } catch {
      showToast('카드를 만들지 못했어요', 'error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <section className="mn-result">
      <div className="mn-result__sky" style={{ '--mn-dawn': result.reachedCanaan ? 1 : Math.min(0.85, result.versesDone / (set.verses.length || 1)) } as CSSProperties}>
        <div className="mn-sky" aria-hidden />
        <div className="mn-sun" aria-hidden />
        <Dunes />
        <p className="mn-result__eyebrow">
          <span className="mn-pill">{kindLabel}</span>
          <span className="mn-pill">{modeLabel(mode)}</span>
        </p>
        <h2 className="mn-result__title">
          {result.reachedCanaan ? '가나안에 닿았어요' : `${place}까지 왔어요`}
          {saved?.is_best && <span className="mn-badge">NEW 최고 기록</span>}
        </h2>
        <p className="mn-result__score">
          {shownScore.toLocaleString('ko-KR')}
          <small>점</small>
        </p>
        {rankLine && (
          <p className="mn-result__rank">
            <span className="material-icons-round" aria-hidden>
              emoji_events
            </span>
            {rankLine}
          </p>
        )}
        {saving && <p className="mn-result__note">기록을 남기는 중…</p>}
        {saved && !saved.counted && <p className="mn-result__note">사람이 내기 어려운 기록이라 순위에는 들어가지 않았어요</p>}
        {finished.saveFailed && <p className="mn-result__note">기록을 저장하지 못했어요 — 연결을 확인해 주세요</p>}
        {!loggedIn && (
          <p className="mn-result__note">
            <Link to="/login">로그인</Link>하면 기록이 남고 순위에 올라가요
          </p>
        )}
      </div>

      <div className="mn-stats">
        <div>
          <span className="material-icons-round" aria-hidden>
            edit_note
          </span>
          <b>{result.versesDone}</b>
          <span>새긴 말씀</span>
        </div>
        <div>
          <span className="material-icons-round" aria-hidden>
            auto_awesome
          </span>
          <b>{result.perfectVerses}</b>
          <span>온전히 새김</span>
        </div>
        <div>
          <span className="material-icons-round" aria-hidden>
            bolt
          </span>
          <b>{result.maxCombo}</b>
          <span>최고 콤보</span>
        </div>
      </div>

      {result.refs.length > 0 && (
        <div className="mn-refs">
          <span className="mn-refs__title">오늘 새긴 말씀</span>
          {result.refs.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      )}

      <div className="mn-result__actions">
        <button type="button" className="mn-cta" onClick={onAgain}>
          <span className="material-icons-round" aria-hidden>
            replay
          </span>
          다시 거두기
        </button>
        <button type="button" className="bt-btn bt-btn--block" disabled={sharing} onClick={() => void share()}>
          <span className="material-icons-round" aria-hidden>
            ios_share
          </span>
          {sharing ? '만드는 중…' : '카드로 나누기'}
        </button>
        <button type="button" className="bt-btn bt-btn--block" onClick={onBack}>
          <span className="material-icons-round" aria-hidden>
            tune
          </span>
          판 바꾸기
        </button>
      </div>
    </section>
  )
}

/** 결과 점수를 0에서 올려 세운다(움직임 줄이기면 바로) */
const useCountUp = (target: number, ms = 900) => {
  const [v, setV] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? target : 0,
  )
  useEffect(() => {
    const dur = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export default MannaPage
