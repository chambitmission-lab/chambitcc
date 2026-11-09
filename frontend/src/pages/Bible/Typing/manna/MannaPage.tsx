import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../../components/bible/BibleSideRail'
import { getMannaSet, type MannaKind, type MannaSet } from '../../../../api/bibleTyping'
import { bibleTypingKeys, useMannaLive, useMannaRival, useMannaSummary, useSubmitManna } from '../../../../hooks/useBibleTyping'
import { safeStorage } from '../../../../utils/safeStorage'
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import { tokenStore } from '../../../../utils/tokenStore'
import { showToast } from '../../../../utils/toast'
import { primeTypingSound } from '../typingSound'
import SoundMenu from '../SoundMenu'
import { ITEMS, MANNA_MODES, MAX_JARS, type MannaMode, type MannaResult } from './mannaEngine'
import MannaBoards from './MannaBoards'
import { DropTop } from './MannaSkins'
import { Avatar } from './MannaAvatar'
import { LiveCallout } from './LiveCallout'
import { MannaGameLayer } from './MannaGameLayer'
import { MannaResultCard } from './MannaResultCard'
import { modeLabel, type Finished, type Rival } from './mannaPageShared'
import '../typing.css'
import './manna.css'
import './manna-skins.css'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'

const MODE_KEY = 'manna-mode'
const KIND_KEY = 'manna-kind'
// 순위가 먼저, 나와의 관계는 뒤에 — "바로 위 1위"처럼 붙여 읽히면 뜻이 흐려진다
const RELATION_LABEL = {
  leader: (rank: number) => `오늘 ${rank}위`,
  above: (rank: number) => `${rank}위 · 내 바로 앞`,
  below: (rank: number) => `${rank}위 · 나를 추격 중`,
  self: (rank: number) => `오늘의 나 ${rank}위`,
} as const

type Phase = 'start' | 'loading' | 'playing' | 'over'

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

/** 결과 점수를 0에서 올려 세운다(움직임 줄이기면 바로) */
export default MannaPage
