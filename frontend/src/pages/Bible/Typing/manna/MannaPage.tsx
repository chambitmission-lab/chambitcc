import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock'
import { useCountUp } from '../../../../hooks/useCountUp'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../../components/bible/BibleSideRail'
import {
  getMannaSet,
  type MannaKind,
  type MannaLive,
  type MannaLiveEvent,
  type MannaRival,
  type MannaRunResult,
  type MannaSet,
} from '../../../../api/bibleTyping'
import { bibleTypingKeys, useMannaLive, useMannaRival, useMannaSummary, useSubmitManna } from '../../../../hooks/useBibleTyping'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import { safeStorage } from '../../../../utils/safeStorage'
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import { tokenStore } from '../../../../utils/tokenStore'
import { showToast } from '../../../../utils/toast'
import { notificationStream } from '../../../../utils/notificationStream'
import { parseApiDate } from '../../../../utils/dateUtils'
import { shareOrDownload } from '../dailyCard'
import { playTypingSound, primeTypingSound } from '../typingSound'
import SoundMenu from '../SoundMenu'
import {
  ITEMS,
  MANNA_MODES,
  MAX_JARS,
  MannaGame,
  SLOW_SECONDS,
  PLACES,
  type MannaBanner,
  type MannaFlow,
  type MannaHud,
  type MannaMode,
  type MannaResult,
  type MannaVerseView,
} from './mannaEngine'
import { renderMannaCard } from './mannaCard'
import MannaBoards from './MannaBoards'
import { BURST_EVERY, burstText, isTouchDevice } from './mannaSkin'
import { DropResultHero, DropTop } from './MannaSkins'
import '../typing.css'
import './manna.css'
import './manna-skins.css'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'

const MODE_KEY = 'manna-mode'
const KIND_KEY = 'manna-kind'
const modeLabel = (m: MannaMode) => MANNA_MODES.find((x) => x.key === m)?.label ?? ''
// 순위가 먼저, 나와의 관계는 뒤에 — "바로 위 1위"처럼 붙여 읽히면 뜻이 흐려진다
const RELATION_LABEL = {
  leader: (rank: number) => `오늘 ${rank}위`,
  above: (rank: number) => `${rank}위 · 내 바로 앞`,
  below: (rank: number) => `${rank}위 · 나를 추격 중`,
  self: (rank: number) => `오늘의 나 ${rank}위`,
} as const

type Rival = NonNullable<MannaRival['rival']>

const Dunes = () => (
  <svg className="mn-dunes" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden>
    <path className="mn-dunes__back" d="M0 24 C 60 8, 120 36, 200 20 S 330 4, 400 22 V56 H0Z" />
    <path className="mn-dunes__front" d="M0 38 C 80 24, 150 48, 240 34 S 360 26, 400 36 V56 H0Z" />
  </svg>
)

const Avatar = ({ name, url, className = '' }: { name: string; url: string | null; className?: string }) =>
  url ? (
    <img className={`mn-ava ${className}`} src={url} alt="" loading="lazy" />
  ) : (
    <span className={`mn-ava ${className}`} aria-hidden>
      {name.trim().charAt(0) || '?'}
    </span>
  )

/** "n분 남음" 같은 남은 시간 — 1분 미만은 초 */
const leftLabel = (ms: number) => {
  if (ms <= 0) return '곧 마감'
  const m = Math.floor(ms / 60000)
  if (m >= 1) return `${m}분 남음`
  return `${Math.max(1, Math.floor(ms / 1000))}초 남음`
}
const untilLabel = (ms: number) => {
  const m = Math.ceil(ms / 60000)
  if (m < 60) return `${Math.max(1, m)}분 뒤`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 ${m % 60 ? `${m % 60}분 ` : ''}뒤`
  return `${Math.floor(h / 24)}일 뒤`
}
const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Phase = 'start' | 'loading' | 'playing' | 'over'

interface Finished {
  set: MannaSet
  mode: MannaMode
  result: MannaResult
  saved: MannaRunResult | null
  saveFailed: boolean
  rival: Rival | null
  liveKey: string | null
}

/**
 * 만나 내리기 — 하늘에서 순서대로 내려오는 말씀 단어를 쳐서 거두고, 한 절씩 새겨 가나안까지.
 * 오늘의 만나(교회 전체가 같은 판·난이도별 순위·부서 대항전)와 연습 판.
 * 고스트 라이벌(같은 판을 친 바로 위 사람과 절 단위로 겨룸)·라이브 한 판(정해진 창에 교회 전체가 동시에).
 */
const MannaPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const loggedIn = !!tokenStore.getAccess()
  const { data: summary } = useMannaSummary()
  const submit = useSubmitManna()
  // 드롭 제목 서체(Black Han Sans)는 이 화면에서만 붙인다
  useEffect(() => {
    void ensureFontFamily('blackHanSans')
  }, [])

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
  // 이번 판의 라이벌·라이브는 시작 순간에 고정한다(플레이 중 재조회로 바뀌지 않게)
  const [playing, setPlaying] = useState<{ rival: Rival | null; liveKey: string | null }>({ rival: null, liveKey: null })

  const { data: rivalData } = useMannaRival(mode, loggedIn && kind === 'daily' && phase !== 'playing')
  const { data: live } = useMannaLive(loggedIn)
  const liveNow = live?.current ?? null
  // 라이브는 오늘의 만나 · 보통 난이도로만 들어간다
  const liveEligible = !!liveNow && kind === 'daily' && mode === (live?.mode ?? 'normal')

  const start = async (opts?: { live?: boolean }) => {
    // 휴대폰은 화면 키보드 입력이 '사용자 동작'으로 안 쳐서 소리가 잠긴 채로 남는다 — 시작 버튼 탭에서 미리 깨운다
    primeTypingSound()
    if (opts?.live && live) {
      setKind('daily')
      setMode(live.mode)
    }
    const k: MannaKind = opts?.live ? 'daily' : kind
    const m: MannaMode = opts?.live && live ? live.mode : mode
    setPhase('loading')
    try {
      // 늘 서버에서 새로 받는다 — 복원된 옛 판(어제 날짜)으로 치면 서버가 연습으로 돌려 순위에 안 들어간다
      const data = await qc.fetchQuery({
        queryKey: [...bibleTypingKeys.manna(), 'set', k],
        queryFn: () => getMannaSet(k),
        staleTime: 0,
      })
      if (!data.verses.length) throw new Error('empty')
      setPlaying({
        // 라이벌은 지금 난이도 것만(라이브로 난이도가 바뀌면 다음 판부터)
        rival: k === 'daily' && loggedIn && rivalData?.mode === m ? (rivalData.rival ?? null) : null,
        liveKey: k === 'daily' && (opts?.live || liveEligible) ? (liveNow?.key ?? null) : null,
      })
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
      setFinished({ set, mode: playedMode, result, saved: null, saveFailed: false, rival: playing.rival, liveKey: playing.liveKey })
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
          checkpoints: result.checkpoints,
        },
        {
          onSuccess: (saved) => setFinished((f) => (f ? { ...f, saved } : f)),
          onError: () => setFinished((f) => (f ? { ...f, saveFailed: true } : f)),
        },
      )
    },
    // submit.mutate 는 안정적이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [set, mode, loggedIn, playing, summary],
  )

  const best = summary?.best[mode] ?? 0
  const today = summary?.today
  const rival = kind === 'daily' ? (rivalData?.rival ?? null) : null
  const myToday = rivalData?.me ?? null

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session mn-shell mn-skin mn-skin--drop">
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
              <DropTop mode={mode} loggedIn={loggedIn} summary={summary} live={live} rival={rival} />

              <div className="mn-hero__body">
                {loggedIn && live && (liveNow || live.next) && (
                  <LiveCallout live={live} onJoin={() => void start({ live: true })} disabled={phase === 'loading'} />
                )}

                {loggedIn && (
                  <div className="mn-kpis">
                    <div className="mn-kpi">
                      <b>{best > 0 ? fmt(best) : '–'}</b>
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

                {loggedIn && rival && (
                  <div className={`mn-rivalcard is-${rival.relation}`}>
                    <Avatar name={rival.name} url={rival.avatar_url} className="mn-rivalcard__ava" />
                    <div className="mn-rivalcard__body">
                      <span className="mn-rivalcard__eyebrow">
                        {rival.relation === 'self' ? '오늘의 라이벌 없음' : '오늘의 라이벌'} · {RELATION_LABEL[rival.relation](rival.rank)}
                      </span>
                      <strong className="mn-rivalcard__name">
                        {rival.name}
                        {rival.is_me ? ' (나)' : ''} <em>{fmt(rival.score)}점</em>
                      </strong>
                      <span className="mn-rivalcard__sub">
                        {rival.relation === 'self'
                          ? '아직 다른 사람이 없어요 · 오늘의 나와 절마다 겨뤄요'
                          : rival.relation === 'below'
                            ? `내가 1위예요 · ${fmt(rival.score)}점으로 뒤쫓고 있어요`
                            : myToday
                              ? `${fmt(Math.max(0, rival.score - myToday.score + 1))}점만 더 거두면 앞서요 · 절마다 비교해 드려요`
                              : '같은 판이라 절마다 점수를 비교해 드려요'}
                      </span>
                    </div>
                    <span className="mn-rivalcard__vs" aria-hidden>
                      VS
                    </span>
                  </div>
                )}

                <button type="button" className="mn-cta" disabled={phase === 'loading'} onClick={() => void start()}>
                  {phase === 'loading' ? (
                    '만나를 준비하는 중…'
                  ) : (
                    <>
                      {liveEligible ? '라이브 드롭 받으러 가기' : '드롭 받으러 가기'}
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
                      <span className="mn-m mn-m--static mn-m--decoy">여호아</span>
                      벌레 먹은 만나 — 말씀과 <b>한 글자만</b> 달라요. 치면 감점, 그냥 두면 +20
                    </li>
                    <li>
                      <span className="mn-m mn-m--static mn-m--gold">여호와</span>
                      <b>핵심 말씀</b> — 절마다 하나, 거두면 점수 3배
                    </li>
                    <li>
                      <span className="mn-m mn-m--static is-low">말씀을</span>
                      <b>아슬아슬</b> — 땅에 닿기 직전에 거두면 1.5배
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
                    <li className="mn-legend__wide">
                      <span className="material-icons-round" aria-hidden>
                        groups
                      </span>
                      <span>
                        <b>고스트 라이벌</b> — 오늘 바로 위 사람과 절마다 점수를 비교해요 · 앞지르면 그 사람에게 알림이 가요
                      </span>
                    </li>
                  </ul>
                </details>
              </div>
            </section>
          )}

          {loggedIn && <MannaBoards mode={finished && phase === 'over' ? finished.mode : mode} onModeChange={setMode} live={live ?? null} />}
        </main>
      </div>

      {phase === 'playing' && set && (
        <MannaGameLayer
          set={set}
          mode={mode}
          rival={playing.rival}
          liveKey={playing.liveKey}
          liveEndsAt={playing.liveKey && liveNow ? liveNow.ends_at : null}
          onOver={onOver}
          onQuitEarly={() => setPhase('start')}
        />
      )}
    </div>
  )
}

// ── 라이브 한 판 안내(시작 카드) ─────────────────────────

const LiveCallout = ({ live, onJoin, disabled }: { live: MannaLive; onJoin: () => void; disabled: boolean }) => {
  const now = useTickingNow(1000, !!live.current)
  if (live.current) {
    const left = parseApiDate(live.current.ends_at).getTime() - now
    return (
      <div className="mn-live mn-live--on">
        <span className="mn-live__dot" aria-hidden />
        <div className="mn-live__body">
          <strong>만나 라이브 진행 중 · {leftLabel(left)}</strong>
          <span>
            교회 전체가 지금 같은 판을 쳐요 · {modeLabel(live.mode)} · 지금 {live.current.board.players}명
          </span>
        </div>
        <button type="button" className="mn-live__btn" disabled={disabled} onClick={onJoin}>
          참여
        </button>
      </div>
    )
  }
  if (!live.next) return null
  const until = parseApiDate(live.next.starts_at).getTime() - now
  return (
    <div className="mn-live">
      <span className="material-icons-round mn-live__icon" aria-hidden>
        podcasts
      </span>
      <div className="mn-live__body">
        <strong>
          다음 만나 라이브 · {live.next.weekday}요일 {hhmm(live.next.starts_at)}
        </strong>
        <span>
          {untilLabel(until)} · {live.minutes}분 동안 교회 전체가 동시에 · 끝난 사람 점수가 실시간으로 흘러요
        </span>
      </div>
    </div>
  )
}

// ── 한 판 ─────────────────────────────────────────────

const MannaGameLayer = ({
  set,
  mode,
  rival,
  liveKey,
  liveEndsAt,
  onOver,
  onQuitEarly,
}: {
  set: MannaSet
  mode: MannaMode
  rival: Rival | null
  liveKey: string | null
  liveEndsAt: string | null
  onOver: (r: MannaResult) => void
  onQuitEarly: () => void
}) => {
  // 휴대폰 타이핑은 화면 키보드가 아래 절반을 덮는다 — 남은 낮고 넓은 무대에 맞춰 가로로 흘려 보낸다
  const flow: MannaFlow = isTouchDevice() ? 'left' : 'down'
  const layerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<MannaGame | null>(null)
  const pendingEnter = useRef(false)
  const keySoundAt = useRef(0)

  const [hud, setHud] = useState<MannaHud>({ score: 0, combo: 0, mult: 1, jars: MAX_JARS, done: 0, fever: false, slow: false })
  const [verse, setVerse] = useState<MannaVerseView | null>(null)
  const [banner, setBanner] = useState<MannaBanner | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string; tone?: 'live' | 'rival' } | null>(null)
  const [ticker, setTicker] = useState<{ id: number; text: string } | null>(null)
  const [paused, setPaused] = useState(false)
  const [lostJar, setLostJar] = useState(-1)
  // 10콤보마다 화면 가운데 한 번 터지는 문구(스킨마다 말투가 다르다)
  const [burst, setBurst] = useState<{ id: number; text: string } | null>(null)
  const lastBurst = useRef(0)
  const prevJars = useRef(MAX_JARS)
  const aheadRef = useRef<boolean | null>(null)
  const rivalRef = useRef(rival)
  const onOverRef = useRef(onOver)
  useEffect(() => {
    onOverRef.current = onOver
    rivalRef.current = rival
  }, [onOver, rival])
  const now = useTickingNow(1000, !!liveEndsAt)

  // 게임 층이 떠 있는 동안 뒤 페이지는 스크롤되지 않게
  useBodyScrollLock()

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
    return () => {
      vv?.removeEventListener('resize', fit)
      vv?.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    // 마운트마다 새 판 — StrictMode 는 붙였다 떼고 다시 붙이므로 '한 번만' 막으면 정리된 판만 남는다
    const stage = stageRef.current
    if (!stage) return
    prevJars.current = MAX_JARS
    aheadRef.current = null
    const game = new MannaGame({
      stage,
      verses: set.verses.map((v) => ({ ref: v.ref, text: v.text })),
      mode,
      seed: set.seed,
      flow,
      callbacks: {
        onHud: (h) => {
          if (h.jars < prevJars.current) setLostJar(h.jars)
          prevJars.current = h.jars
          if (h.combo < lastBurst.current) lastBurst.current = 0
          if (h.combo >= BURST_EVERY && h.combo % BURST_EVERY === 0 && h.combo !== lastBurst.current) {
            lastBurst.current = h.combo
            setBurst({ id: Date.now(), text: burstText(h.combo) })
          }
          setHud(h)
        },
        onVerse: setVerse,
        onBanner: (b) => {
          setBanner(b)
          // 고스트 라이벌 — 절을 새길 때 같은 자리에서 비교해 앞지름·역전을 알린다
          const rv = rivalRef.current
          if (!b || !rv || rv.is_me) return
          const theirs = rv.checkpoints[b.done - 1]
          const ahead = theirs === undefined ? b.score > rv.score : b.score > theirs
          if (aheadRef.current !== null && ahead !== aheadRef.current) {
            setToast({ id: Date.now(), text: ahead ? `${rv.name}님을 앞질렀어요!` : `${rv.name}님이 다시 앞섰어요`, tone: 'rival' })
          }
          aheadRef.current = ahead
        },
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
  }, [set, mode, flow])

  // 라이브 — 창 안에서 한 판을 마친 사람의 점수가 흘러간다
  useEffect(() => {
    if (!liveKey) return
    const off = notificationStream.on('manna_live', (raw) => {
      try {
        const ev = JSON.parse(raw) as MannaLiveEvent
        if (ev.live_key !== liveKey) return
        setTicker({
          id: Date.now(),
          text: `${ev.name}님 ${fmt(ev.score)}점${ev.reached_canaan ? ' · 가나안 도착' : ` · ${ev.verses_done}절`}${ev.rank ? ` · 지금 ${ev.rank}위` : ''}`,
        })
      } catch {
        /* 무시 */
      }
    })
    return off
  }, [liveKey])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 900)
    return () => clearTimeout(t)
  }, [burst])
  useEffect(() => {
    if (!ticker) return
    const t = setTimeout(() => setTicker(null), 3600)
    return () => clearTimeout(t)
  }, [ticker])

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
  // 라이벌이 지금 내가 치는 절을 다 새겼을 때의 점수 — 이걸 넘기면 이 절에서 앞선다
  const rivalTarget = rival ? rival.checkpoints[hud.done] : undefined
  const rivalStopped = !!rival && rivalTarget === undefined
  const rivalDelta = rival ? hud.score - (rivalStopped ? rival.score : (rivalTarget ?? 0)) : 0
  const liveLeft = liveEndsAt ? parseApiDate(liveEndsAt).getTime() - now : null

  return createPortal(
    <div
      ref={layerRef}
      className={`mn-game mn-skin--drop${flow === 'left' ? ' is-flow-left' : ''}${hud.fever ? ' is-fever' : ''}${hud.slow ? ' is-slow' : ''}${mode === 'easy' ? ' is-easy' : ''}${paused ? ' is-paused' : ''}`}
      style={{ '--mn-dawn': Math.min(1, hud.done / (set.verses.length - 1 || 1)).toFixed(2) } as CSSProperties}
      role="application"
      aria-label="만나 내리기"
    >
      <div className="mn-sky" aria-hidden />
      <div className="mn-sun" aria-hidden />
      <div className="mn-game__glow" aria-hidden />
      {/* 구름기둥 — 화면 양옆에서 피어오르는 구름(단어 뒤) */}
      <div className={`mn-cloudveil${hud.slow ? ' is-on' : ''}`} aria-hidden>
        <i />
        <i />
      </div>

      <header className="mn-hud">
        <div className="mn-hud__place">
          <button type="button" className="mn-hud__btn" onClick={() => pause(true)} aria-label="잠시 멈춤">
            <span className="material-icons-round">pause</span>
          </button>
          <span>
            <span className="mn-hud__day">
              {liveKey ? (
                <>
                  <i className="mn-hud__live">LIVE</i>
                  {liveLeft !== null ? leftLabel(liveLeft) : '라이브'} · {modeLabel(mode)}
                </>
              ) : (
                <>
                  {hud.done + 1}일째 · {set.kind === 'daily' ? '오늘의 만나' : '연습'} · {modeLabel(mode)}
                </>
              )}
            </span>
            <span className="mn-hud__name">{place}</span>
          </span>
        </div>
        <div className="mn-hud__score">
          <span className="mn-hud__num">{fmt(hud.score)}</span>
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
          {rival && !rival.is_me && (
            <span
              className="mn-track__ghost"
              style={{ left: `calc(4px + (100% - 8px) * ${Math.min(1, rival.verses_done / (set.verses.length || 1))})` }}
              title={`${rival.name} ${rival.verses_done}절`}
              aria-hidden
            >
              {rival.name.trim().charAt(0)}
            </span>
          )}
        </div>
      </div>
      <div className="mn-chips">
        {rival && !rival.is_me && (
          <span className={`mn-chip mn-chip--rival${rivalDelta >= 0 ? ' is-ahead' : ' is-behind'}`} aria-live="polite">
            <Avatar name={rival.name} url={rival.avatar_url} className="mn-chip__ava" />
            {rival.name}
            {rivalStopped ? ` 멈춤` : ''}
            <b>
              {rivalDelta >= 0 ? '+' : '−'}
              {fmt(Math.abs(rivalDelta))}
            </b>
          </span>
        )}
        {rival && rival.is_me && (
          <span className={`mn-chip mn-chip--rival${rivalDelta >= 0 ? ' is-ahead' : ' is-behind'}`}>
            오늘의 나
            <b>
              {rivalDelta >= 0 ? '+' : '−'}
              {fmt(Math.abs(rivalDelta))}
            </b>
          </span>
        )}
        {hud.fever && <span className="mn-chip mn-chip--fever">여섯째 날 · 점수 2배</span>}
        {hud.slow && (
          <span className="mn-chip mn-chip--slow" style={{ '--mn-slow-sec': `${SLOW_SECONDS}s` } as CSSProperties}>
            구름기둥 · 천천히
          </span>
        )}
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
                    (verse.states[i] === 'got'
                      ? `mn-w-got${i === verse.fresh ? ' is-fresh' : ''}`
                      : verse.states[i] === 'miss'
                        ? 'mn-w-miss'
                        : `mn-w-blank${i === verse.turn ? ' is-next' : ''}`) + (i === verse.gold ? ' is-gold' : '')
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
        {flow === 'left' ? <div className="mn-stage__basket" aria-hidden /> : <Dunes />}
        <div className="mn-stage__closeline" aria-hidden />
        {ticker && (
          <div key={ticker.id} className="mn-ticker" role="status">
            <span className="mn-ticker__live">LIVE</span>
            {ticker.text}
          </div>
        )}
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
              // 화면 키보드는 keydown 이 'Unidentified' 로 오거나 아예 안 와서 — 그때는 입력 자체로 소리를 낸다
              if (performance.now() - keySoundAt.current > 80) {
                const ne = e.nativeEvent as InputEvent
                playTypingSound(ne.inputType?.startsWith('delete') ? 'back' : ne.data?.includes(' ') ? 'space' : 'key')
              }
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
              const kind = e.key === ' ' ? 'space' : e.key === 'Backspace' ? 'back' : e.key.length === 1 || e.key === 'Process' || e.keyCode === 229 ? 'key' : null
              if (kind) {
                playTypingSound(kind)
                keySoundAt.current = performance.now()
              }
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
            {rival && <RivalCompare rival={rival} banner={banner} />}
          </div>
        </div>
      )}

      {burst && (
        <div key={burst.id} className="mn-burst" aria-hidden>
          {burst.text}
        </div>
      )}

      {toast && (
        <div key={toast.id} className={`mn-toast${toast.tone ? ` mn-toast--${toast.tone}` : ''}`} role="status">
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
            <p className="mn-overlay__text">만나는 기다려 줘요 · 지금 {fmt(hud.score)}점</p>
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

/** 새김 카드 안 — 같은 자리에서 라이벌은 몇 점이었나 */
const RivalCompare = ({ rival, banner }: { rival: Rival; banner: MannaBanner }) => {
  const theirs = rival.checkpoints[banner.done - 1]
  const who = rival.is_me ? '오늘의 나' : `${rival.name}님`
  if (theirs === undefined) {
    const ahead = banner.score > rival.score
    return (
      <p className={`mn-banner__rival${ahead ? ' is-ahead' : ' is-behind'}`}>
        {who}은 {rival.verses_done}절에서 멈췄어요 · {ahead ? `이미 ${fmt(banner.score - rival.score)}점 앞서요` : `${fmt(rival.score - banner.score + 1)}점 더 거두면 앞서요`}
      </p>
    )
  }
  const d = banner.score - theirs
  return (
    <p className={`mn-banner__rival${d >= 0 ? ' is-ahead' : ' is-behind'}`}>
      {who}은 여기서 {fmt(theirs)}점 · 나 {fmt(banner.score)}점 ({d >= 0 ? '+' : '−'}
      {fmt(Math.abs(d))})
    </p>
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
  const { result, saved, set, mode, rival, liveKey } = finished
  const [sharing, setSharing] = useState(false)
  const shownScore = useCountUp(result.score)
  const place = PLACES[Math.min(result.versesDone, PLACES.length - 1)]
  const kindLabel = set.kind === 'daily' ? '오늘의 만나' : '연습'
  const liveLine = saved?.live && saved.live.rank ? `라이브 ${saved.live.players}명 중 ${saved.live.rank}위` : liveKey ? '라이브 순위에 올라갔어요' : null
  const rivalDelta = rival && !rival.is_me ? result.score - rival.score : null

  const share = async () => {
    setSharing(true)
    try {
      const blob = await renderMannaCard({
        dark: document.documentElement.classList.contains('dark'),
        result,
        verses: set.verses.length,
        kindLabel,
        modeLabel: modeLabel(mode),
        date: set.date,
        rank: saved?.kind === 'daily' ? saved.rank : null,
        isBest: !!saved?.is_best,
        rivalName: rival && !rival.is_me ? rival.name : null,
        rivalDelta,
        live: !!liveKey,
      })
      if (!blob) throw new Error('canvas')
      const r = await shareOrDownload(blob, `만나드롭-${set.date}.png`, `만나 내리기 · ${place}까지 ${fmt(result.score)}점`)
      if (r === 'downloaded') showToast('카드 이미지를 저장했어요', 'success')
    } catch {
      showToast('카드를 만들지 못했어요', 'error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <section className="mn-result">
      <DropResultHero
        result={result}
        saved={saved}
        verses={set.verses.length}
        shownScore={shownScore}
        rivalDelta={rivalDelta}
        rivalName={rival && !rival.is_me ? rival.name : null}
        dateLabel={set.date.slice(5).replace('-', '.')}
        live={!!liveKey}
      />

      {(liveLine || saving || (saved && !saved.counted) || saved?.demoted || finished.saveFailed || !loggedIn) && (
        <div className="mn-result__notes">
          {liveLine && <p className="mn-result__note is-live">{liveLine}</p>}
          {saved && saved.overtook.length > 0 && (
            <p className="mn-result__note">{saved.overtook.join(', ')}님을 앞질렀어요 · 알림이 갔어요</p>
          )}
          {saving && <p className="mn-result__note">기록을 남기는 중…</p>}
          {saved && !saved.counted && <p className="mn-result__note">사람이 내기 어려운 기록이라 순위에는 들어가지 않았어요</p>}
          {saved?.demoted && <p className="mn-result__note">어제 날짜의 판이라 연습으로 남겼어요 — 다시 시작하면 오늘 판으로 순위에 올라가요</p>}
          {finished.saveFailed && <p className="mn-result__note">기록을 저장하지 못했어요 — 연결을 확인해 주세요</p>}
          {!loggedIn && (
            <p className="mn-result__note">
              <Link to="/login">로그인</Link>하면 기록이 남고 순위에 올라가요
            </p>
          )}
        </div>
      )}

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
          {rivalDelta !== null && rivalDelta < 0 ? '한 판 더 · 역전하러' : '한 판 더'}
        </button>
        <button type="button" className="bt-btn bt-btn--block" disabled={sharing} onClick={() => void share()}>
          <span className="material-icons-round" aria-hidden>
            ios_share
          </span>
          {sharing ? '만드는 중…' : '스토리로 나누기'}
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
export default MannaPage
