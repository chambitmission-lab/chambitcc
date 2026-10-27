import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import BibleSideRail from '../../../../components/bible/BibleSideRail'
import { getLinkBoard, getLinkSet, type LinkBoard, type LinkRunResult, type LinkSet } from '../../../../api/bibleTyping'
import { bibleTypingKeys, useLinkBoard, useLinkSummary, useLinkTeams, useSubmitLink } from '../../../../hooks/useBibleTyping'
import { useCountUp } from '../../../../hooks/useCountUp'
import { tokenStore } from '../../../../utils/tokenStore'
import { showToast } from '../../../../utils/toast'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import { daysLeftInWeek, isoWeek } from '../manna/mannaSkin'
import chambiJoy from '../../../../components/chatbot/img/joy.webp'
import LinkPlay from './LinkPlay'
import LinkBoards from './LinkBoards'
import { LIVES, linkPersona, type LinkResult } from './linkGame'
import { isLinkMuted, linkSfx, primeLinkSound, setLinkMuted } from './linkSound'
import '../typing.css'
import './verse-link.css'

type Phase = 'start' | 'loading' | 'playing' | 'over'

interface Finished {
  set: LinkSet
  result: LinkResult
  saved: LinkRunResult | null
  /** 저장 직후 새로 받은 오늘 순위 — 치고 올라가기 연출용 */
  board: LinkBoard | null
}

/** 시작 화면 '효과음 미리 듣기' — 게임 속 순간별 소리 */
const SOUND_BOARD: [string, string, () => void][] = [
  ['💧', '조각 탭 (뽁·뾱·뿅)', () => [0, 1, 2, 3, 4, 5].forEach((i, k) => setTimeout(() => linkSfx.tap(i), k * 140))],
  ['🐑', '틀림 (메에~?)', () => linkSfx.sheep(false)],
  ['🏺', '항아리 깨짐 (쨍그랑)', () => linkSfx.crack(false)],
  ['😢', '마지막 항아리 (메헹…)', () => linkSfx.crack(true)],
  ['🎺', '3콤보 (휘리릭↑)', () => linkSfx.slide()],
  ['👏', '5·10·15콤보 환호', () => {
    linkSfx.crowd(1)
    setTimeout(() => linkSfx.crowd(2), 1300)
    setTimeout(() => linkSfx.crowd(3), 2900)
  }],
  ['⏱️', '시간 촉박 (째깍째깍)', () => {
    let k = 0
    let iv = 380
    const go = () => {
      linkSfx.tick(k % 2 === 1)
      k++
      iv = Math.max(110, iv * 0.9)
      if (k < 16) setTimeout(go, iv)
    }
    go()
  }],
  ['🔨', '도장 (쾅! 짤랑)', () => linkSfx.stamp()],
  ['🙌', '구절 완성 (하프+할렐루야)', () => linkSfx.complete()],
  ['🏎️', '순위 추월 (부웅~휙)', () => linkSfx.vroom()],
  ['🥁', '결과 (두구두구 → 챙!)', () => {
    linkSfx.drumroll(1.2)
    linkSfx.cymbal(1.2)
  }],
  ['🎷', '게임 오버 (뿌뿌뿌뿌우~)', () => linkSfx.sadTrombone()],
]

const JarIcon = () => (
  <svg viewBox="0 0 16 20" aria-hidden>
    <path d="M5 1.5h6M5.5 1.5v3C2.5 6 1.5 8.5 1.5 12c0 4 2.5 6.5 6.5 6.5s6.5-2.5 6.5-6.5c0-3.5-1-6-4-7.5v-3" />
  </svg>
)

/** 드롭 — 소식 띠·시즌·오렌지 히어로·오늘 1위/부서 1위 */
const DropTop = ({ loggedIn }: { loggedIn: boolean }) => {
  const { data: summary } = useLinkSummary()
  const { data: board } = useLinkBoard('today', loggedIn)
  const { data: teams } = useLinkTeams(loggedIn)
  const leader = board?.entries[0] ?? null
  const team = teams?.teams.find((t) => t.score > 0) ?? null
  const left = daysLeftInWeek()
  const news: string[] = []
  if (summary && summary.players_today > 0) news.push(`오늘 ${summary.players_today}명 참여 중`)
  if (leader) news.push(`${leader.is_me ? '내가' : `${leader.name}님이`} ${fmt(leader.score)}점으로 1위`)
  if (team) news.push(`${team.name} 이번 주 선두`)
  if (summary?.today) news.push(`나의 오늘 순위 ${summary.today.rank}위`)
  if (news.length < 3) news.push('조각을 순서대로 톡톡', '틀리면 항아리가 깨져요', '다섯 절 다 이으면 오늘의 기록')
  return (
    <div className="vl-drop">
      <div className="vl-marq" aria-hidden>
        <div className="vl-marq__track">
          {[0, 1].map((k) => (
            <span key={k}>
              {news.map((n) => (
                <span key={n}>● {n}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="vl-season">
        <span>SEASON {isoWeek()} · 말씀 잇기</span>
        <span>{left === 0 ? 'D-DAY' : `D-${left}`}</span>
      </div>
      <div className="vl-dhero">
        <h2>
          말씀
          <br />
          <span>잇기</span>
        </h2>
        <p>흩어진 말씀 조각을 순서대로 톡톡. 다섯 절 다 이으면 오늘의 기록!</p>
        {summary && summary.players_today > 0 && <span className="vl-stk vl-stk--1">오늘 {summary.players_today}명</span>}
        <span className="vl-stk vl-stk--2">5절 · 순서대로</span>
        <span className="vl-stk vl-stk--3">톡!</span>
        {['여호와는', '목자시니', '사랑하사', '능력'].map((w, i) => (
          <span key={w} className="vl-fall" style={{ left: `${46 + i * 12}%`, animationDelay: `${i * 0.85}s` }} aria-hidden>
            {w}
          </span>
        ))}
      </div>
      {loggedIn && (leader || team) && (
        <div className="vl-champs">
          <div>
            <small>오늘의 1위</small>
            <b>{leader ? (leader.is_me ? '나' : leader.name) : '–'}</b>
            <em>{leader ? `${fmt(leader.score)}점` : '아직 없어요'}</em>
          </div>
          <div className="is-lime">
            <small>이번 주 부서 1위</small>
            <b>{team ? team.name : '–'}</b>
            <em>{team ? `1인당 ${fmt(team.score)}점` : '첫 점수를 기다려요'}</em>
          </div>
        </div>
      )}
    </div>
  )
}

const DropResult = ({ f, total, score, rank }: { f: Finished; total: number; score: number; rank: number | null }) => {
  const p = linkPersona(f.result, total)
  const tags = [
    f.result.cleared ? '#다섯절완주' : `#${f.result.versesDone}절까지`,
    f.result.maxCombo >= 5 ? `#콤보${f.result.maxCombo}` : null,
    f.saved?.is_best ? '#최고기록' : null,
    rank ? `#오늘${rank}위` : null,
  ].filter(Boolean) as string[]
  const d = new Date()
  return (
    <div className={`vl-story is-${p.key}`}>
      <small className="vl-story__ey">
        MY VERSE TYPE · {d.getMonth() + 1}.{d.getDate()}
      </small>
      <h2>
        오늘의 나는
        <br />
        <span>{p.title}</span>
      </h2>
      <p>{p.desc}</p>
      <div className="vl-story__tags">
        {tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <span className={`vl-story__blob is-${p.tone}`} aria-hidden>
        {p.mascot ? <img src={chambiJoy} alt="" /> : <span>{p.icon}</span>}
      </span>
      <div className="vl-story__grid">
        <div className="is-lime">
          <small>점수</small>
          <b>{fmt(score)}</b>
        </div>
        <div>
          <small>오늘 순위</small>
          <b>{rank ? `${rank}위` : '–'}</b>
        </div>
        <div>
          <small>{p.stat.label}</small>
          <b>{p.stat.value}</b>
        </div>
        <div>
          <small>깨진 항아리</small>
          <b>
            {f.result.mistakes}/{LIVES}
          </b>
        </div>
      </div>
    </div>
  )
}

const ResultView = ({ f, loggedIn, saving, onAgain, onBack }: {
  f: Finished
  loggedIn: boolean
  saving: boolean
  onAgain: () => void
  onBack: () => void
}) => {
  const countMs = 1100
  const score = useCountUp(f.result.score, { durationMs: countMs })
  const [toast, setToast] = useState<string | null>(null)
  const rank = f.saved?.rank ?? null

  // 완주면 두구두구 → 챙! → 팡파레, 항아리가 다 깨졌으면 슬픈 트롬본
  useEffect(() => {
    if (f.result.cleared) {
      linkSfx.drumroll(countMs / 1000)
      linkSfx.cymbal(countMs / 1000)
      const t = setTimeout(() => linkSfx.fanfare(), countMs + 150)
      return () => clearTimeout(t)
    }
    linkSfx.sadTrombone()
    // 결과 화면에 들어올 때 한 번
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="vl-result">
      <DropResult f={f} total={f.set.verses.length} score={score} rank={rank} />

      {!loggedIn ? (
        <p className="vl-note">
          <Link to="/login">로그인</Link>하면 기록이 남고 오늘 순위·부서 대항에 올라가요
        </p>
      ) : saving && !f.saved ? (
        <p className="vl-note">기록을 저장하는 중…</p>
      ) : f.saved && !f.saved.counted ? (
        <p className="vl-note">이번 판은 순위에 들어가지 않았어요(어제 판이거나 확인이 필요한 기록)</p>
      ) : null}

      {loggedIn && (
        <div className="vl-boardwrap">
          {toast && (
            <div key={toast} className="vl-toast">
              {toast}
            </div>
          )}
          <LinkBoards
            climb={f.saved?.counted && f.board ? { board: f.board, prevRank: f.saved.prev_rank } : null}
            onPassed={(names) => {
              if (!names.length || toast) return
              const last = names[names.length - 1]
              setToast(`${last}님을 밀어냈어요 🏃`)
            }}
          />
        </div>
      )}

      <div className="vl-resfoot">
        <button type="button" className="vl-cta" onClick={onAgain}>
          <span>한 판 더</span>
          <span aria-hidden>↻</span>
        </button>
        <button type="button" className="vl-cta is-ghost" onClick={onBack}>
          처음으로
        </button>
      </div>
    </div>
  )
}

/** 필사 미니게임 '말씀 잇기' — 흩어진 말씀 조각을 순서대로 눌러 다섯 절을 잇는다 */
const VerseLinkPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const loggedIn = !!tokenStore.getAccess()
  const [phase, setPhase] = useState<Phase>('start')
  const [set, setSet] = useState<LinkSet | null>(null)
  const [finished, setFinished] = useState<Finished | null>(null)
  const [muted, setMuted] = useState(isLinkMuted)
  const { data: summary } = useLinkSummary()
  const submit = useSubmitLink()

  const start = async () => {
    primeLinkSound()
    linkSfx.click()
    setPhase('loading')
    try {
      // 늘 새로 받는다 — 자정을 넘긴 옛 판으로 치면 순위에 들어가지 않는다
      const data = await qc.fetchQuery({ queryKey: bibleTypingKeys.linkSet(), queryFn: getLinkSet, staleTime: 0 })
      if (!data.verses.length) throw new Error('empty')
      setSet(data)
      setPhase('playing')
    } catch {
      showToast('오늘의 말씀 조각을 불러오지 못했어요', 'error')
      setPhase('start')
    }
  }

  const onOver = (result: LinkResult) => {
    if (!set) return
    setFinished({ set, result, saved: null, board: null })
    setPhase('over')
    window.scrollTo({ top: 0 })
    if (!loggedIn || result.pieces === 0) return
    submit.mutate(
      {
        set_date: set.date, score: result.score, verses_done: result.versesDone, perfect_verses: result.perfectVerses,
        pieces: result.pieces, mistakes: result.mistakes, max_combo: result.maxCombo, duration_ms: result.durationMs,
      },
      {
        onSuccess: async (saved) => {
          let board: LinkBoard | null = null
          try {
            board = await qc.fetchQuery({ queryKey: bibleTypingKeys.linkBoard('today'), queryFn: () => getLinkBoard('today'), staleTime: 0 })
          } catch {
            /* 순위표는 탭에서 다시 받는다 */
          }
          setFinished((f) => (f ? { ...f, saved, board } : f))
        },
        onError: () => showToast('기록을 저장하지 못했어요', 'error'),
      },
    )
  }

  const toggleMute = () => {
    setLinkMuted(!muted)
    setMuted(!muted)
    if (muted) linkSfx.tap(4)
  }

  // 드롭 제목 서체(Black Han Sans)는 이 화면에서만 붙인다
  useEffect(() => {
    void ensureFontFamily('blackHanSans')
  }, [])

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session vl-shell vl-skin vl-skin--drop">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">필사 미니게임</span>
              <h1 className="bt-head__title">말씀 잇기</h1>
            </div>
            <button type="button" className="bt-icon-btn" onClick={toggleMute} aria-label={muted ? '소리 켜기' : '소리 끄기'}>
              <span className="material-icons-round">{muted ? 'volume_off' : 'volume_up'}</span>
            </button>
          </header>

          {phase === 'over' && finished ? (
            <ResultView
              f={finished}
              loggedIn={loggedIn}
              saving={submit.isPending}
              onAgain={() => void start()}
              onBack={() => setPhase('start')}
            />
          ) : (
            <section className="vl-start">
              <DropTop loggedIn={loggedIn} />

              {loggedIn && (
                <div className="vl-kpis">
                  <div>
                    <b>{summary?.best ? fmt(summary.best) : '–'}</b>
                    <span>내 최고점</span>
                  </div>
                  <div>
                    <b>{summary?.today ? `${summary.today.rank}위` : '–'}</b>
                    <span>오늘 순위</span>
                  </div>
                  <div>
                    <b>{summary?.players_today ?? 0}명</b>
                    <span>오늘 참여</span>
                  </div>
                </div>
              )}

              <div className="vl-rules">
                <div>
                  <b>5절</b>짧은 절부터
                  <br />
                  점점 길게
                </div>
                <div>
                  <b>×5</b>안 틀리면
                  <br />
                  콤보 배수
                </div>
                <div>
                  <b className="vl-rules__jar">
                    <JarIcon />×3
                  </b>
                  틀리면
                  <br />
                  항아리 깨짐
                </div>
              </div>

              <details className="vl-sboard">
                <summary>
                  🔊 효과음 미리 듣기 <small>눌러서 들어 보세요</small>
                </summary>
                <div className="vl-sbtns">
                  {SOUND_BOARD.map(([icon, label, play]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={(e) => {
                        primeLinkSound()
                        if (isLinkMuted()) {
                          setLinkMuted(false)
                          setMuted(false)
                        }
                        play()
                        const b = e.currentTarget
                        b.classList.add('is-playing')
                        setTimeout(() => b.classList.remove('is-playing'), 600)
                      }}
                    >
                      <span aria-hidden>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </details>

              {!loggedIn && (
                <p className="vl-note">
                  <Link to="/login">로그인</Link>하면 오늘 순위와 부서 대항에 올라가요 · 로그인 없이도 칠 수 있어요
                </p>
              )}

              <div className="vl-startfoot">
                <button type="button" className="vl-cta" onClick={() => void start()} disabled={phase === 'loading'}>
                  <span>{phase === 'loading' ? '말씀 조각 준비 중…' : '도전 시작'}</span>
                  <span aria-hidden>→</span>
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {phase === 'playing' && set && (
        <LinkPlay key={set.date + set.seed} set={set} onOver={onOver} onQuit={() => setPhase('start')} />
      )}
    </div>
  )
}

export default VerseLinkPage
