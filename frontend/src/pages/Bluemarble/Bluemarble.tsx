import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  useBluemarbleState,
  useStartGame,
  useAdvanceStep,
  useSubmitAnswer,
  useAbandonGame,
  QK_BM_STATE,
} from '../../hooks/useBluemarble'
import { useProfileDetail } from '../../hooks/useProfile'
import { useSfx } from '../../hooks/useSfx'
import { useMyRabbit, QK_RABBIT_ME } from '../../hooks/useRabbit'
import type { QuizPublic, Tile, AdvanceResult, BossState } from '../../types/bluemarble'
import type { RabbitMood } from '../../components/rabbit/RabbitAvatar'
import type { TreasureDef } from '../../types/rabbit'
import JourneyTile from './components/JourneyTile'
import JourneyPiece from './components/JourneyPiece'
import StepButton from './components/StepButton'
import NarrativeCard from './components/NarrativeCard'
import QuizModal from './components/QuizModal'
import EventToast from './components/EventToast'
import GameStatus from './components/GameStatus'
import Leaderboard from './components/Leaderboard'
import TreasureRevealModal from '../../components/rabbit/TreasureRevealModal'
import EvolutionModal from '../../components/rabbit/EvolutionModal'
import LapCompletionModal from '../../components/rabbit/LapCompletionModal'
import type { LapEvent } from '../../types/bluemarble'
import {
  positionToCoord,
  getFogState,
  JOURNEY_COLS,
  JOURNEY_ROWS,
} from './journeyLayout'
import './Bluemarble.css'

interface Toast {
  id: number
  message: string
  variant: 'bonus' | 'rest' | 'warp' | 'lap' | 'finish' | 'info'
  scoreDelta?: number
}

interface NarrativeState {
  tile: Tile
  verseText: string | null
  variant: 'arrival' | 'milestone' | 'rest' | 'finish'
  scoreDelta?: number
}

export default function Bluemarble() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAuthenticated = !!localStorage.getItem('access_token')
  const profileQuery = useProfileDetail()
  const user = profileQuery.data?.stats
  const startMutation = useStartGame()
  const advanceMutation = useAdvanceStep()
  const answerMutation = useSubmitAnswer()
  const abandonMutation = useAbandonGame()
  const stateQuery = useBluemarbleState(isAuthenticated)
  const rabbitQuery = useMyRabbit(isAuthenticated)
  const sfx = useSfx()

  // 마운트 시 캐시된 상태 무효화 → 항상 서버에서 fresh fetch
  // (이전 세션의 stale pending_quiz가 잘못 표시되는 것을 방지)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: QK_BM_STATE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [showQuiz, setShowQuiz] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<QuizPublic | null>(null)
  const [activeNarrative, setActiveNarrative] = useState<NarrativeState | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showLb, setShowLb] = useState(false)
  const [muted, setMutedUi] = useState<boolean>(sfx.isMuted())
  const [streak, setStreak] = useState(0)
  const [rabbitMood, setRabbitMood] = useState<RabbitMood>('idle')
  const [pendingTreasures, setPendingTreasures] = useState<TreasureDef[]>([])
  const [pendingEvolution, setPendingEvolution] = useState<{ from: number; to: number } | null>(
    null,
  )
  const [pendingLap, setPendingLap] = useState<LapEvent | null>(null)
  // 보스 진행 상태 — 마지막 답변에서 받은 boss_state. 다음 문제 출제 시 QuizModal에 전달.
  const [bossState, setBossState] = useState<BossState | null>(null)
  // 보스 클리어 결과 (보너스/정답 수) — 클리어 모달 트리거
  const [bossClear, setBossClear] = useState<BossState | null>(null)
  const toastIdRef = useRef(0)
  const introShownRef = useRef(false)

  const state = stateQuery.data
  const session = state?.session
  const tiles = state?.tiles ?? []
  const pendingQuiz = state?.pending_quiz

  const isGameDone = session?.status === 'completed'
  const currentTile = useMemo(
    () => tiles.find((t) => t.position === session?.current_position) ?? null,
    [tiles, session?.current_position],
  )

  // 첫 진입: 세션 없으면 자동 시작
  useEffect(() => {
    if (isAuthenticated && stateQuery.isError) {
      startMutation.mutate(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, stateQuery.isError])

  // 시작 시 인트로 카드
  useEffect(() => {
    if (!session || introShownRef.current) return
    if (session.current_position === 0 && tiles.length > 0 && !pendingQuiz) {
      const startTile = tiles.find((t) => t.position === 0)
      if (startTile) {
        introShownRef.current = true
        setActiveNarrative({
          tile: startTile,
          verseText: null,
          variant: 'arrival',
        })
      }
    }
  }, [session, tiles, pendingQuiz])

  // pending quiz가 있으면 모달 자동 오픈 (내러티브 카드가 닫혀있을 때)
  useEffect(() => {
    if (pendingQuiz && !activeNarrative && !showQuiz) {
      setActiveQuiz(pendingQuiz)
      setShowQuiz(true)
    }
  }, [pendingQuiz, activeNarrative, showQuiz])

  const pushToast = (message: string, variant: Toast['variant'], scoreDelta?: number) => {
    const id = ++toastIdRef.current
    setToasts((t) => [...t, { id, message, variant, scoreDelta }])
  }

  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  const handleAdvance = async () => {
    if (!session || advanceMutation.isPending || pendingQuiz || isGameDone || activeNarrative) return
    sfx.play('click')
    try {
      const result: AdvanceResult = await advanceMutation.mutateAsync()

      if (result.event_type === 'quiz') {
        // 위치 변동 없음 → 곧 useEffect로 퀴즈 모달 오픈
        sfx.play('reveal')
        return
      }

      if (result.event_type === 'boss') {
        // 보스 칸: 위치는 보스 타일로 이동, pending_quiz로 첫 문제 출제됨
        sfx.play('milestone')
        sfx.play('fanfare')
        confetti({
          particleCount: 200,
          spread: 130,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe'],
        })
        pushToast(`⚔️ ${result.next_tile.title} - 5문제 도전 시작!`, 'finish', 0)
        // 보스 진입 시 boss_state 리셋 (이전 보스 흔적 제거)
        setBossState(null)
        return
      }

      // 즉시 전진한 경우 (milestone / rest / finish)
      sfx.play('step')
      setTimeout(() => {
        sfx.play('reveal')
      }, 300)

      const variant: NarrativeState['variant'] =
        result.event_type === 'milestone'
          ? 'milestone'
          : result.event_type === 'rest'
          ? 'rest'
          : result.event_type === 'finish' || result.event_type === 'lap_finish'
          ? 'finish'
          : 'arrival'

      if (result.event_type === 'milestone') {
        sfx.play('milestone')
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        pushToast(`이정표! ${result.next_tile.title} +${result.score_delta}pt`, 'bonus', result.score_delta)
      } else if (result.event_type === 'lap_finish' || result.event_type === 'finish') {
        sfx.play('fanfare')
        confetti({
          particleCount: 360,
          spread: 160,
          startVelocity: 55,
          origin: { y: 0.5 },
          colors: ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe', '#c084fc', '#ffffff'],
        })
        setTimeout(() => {
          confetti({ particleCount: 120, angle: 60, spread: 90, origin: { x: 0, y: 0.6 } })
          confetti({ particleCount: 120, angle: 120, spread: 90, origin: { x: 1, y: 0.6 } })
        }, 800)
        if (result.lap_event) {
          setPendingLap(result.lap_event)
          // 한 바퀴 완주 보상 (생명의 면류관) — 토끼 캐시 무효화 + 모달 표시
          if (result.lap_event.treasures_gained?.length) {
            queryClient.invalidateQueries({ queryKey: QK_RABBIT_ME })
            setPendingTreasures(result.lap_event.treasures_gained)
          }
        }
        pushToast(`${result.lap_event?.lap_count ?? 1}바퀴 완주!`, 'finish', result.score_delta)
      } else if (result.event_type === 'rest') {
        pushToast(`${result.next_tile.title} +${result.score_delta}pt`, 'rest', result.score_delta)
      }

      setActiveNarrative({
        tile: result.next_tile,
        verseText: result.verse_text ?? null,
        variant,
        scoreDelta: result.score_delta,
      })
    } catch (e) {
      pushToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'info')
    }
  }

  const handleAnswerSubmit = async (choiceIndex: number, elapsedMs: number) => {
    const quiz = activeQuiz ?? pendingQuiz
    if (!quiz) throw new Error('퀴즈 없음')
    try {
      const result = await answerMutation.mutateAsync({
        quizId: quiz.id,
        choiceIndex,
        elapsedMs,
      })
      setStreak(result.streak)
      // 보스 응답 처리: 진행 중이면 다음 문제 stash, 완료면 클리어 모달
      if (result.boss_state) {
        if (result.boss_state.boss_complete) {
          setBossClear(result.boss_state)
          setBossState(null)
        } else if (result.boss_state.in_boss) {
          setBossState(result.boss_state)
        }
      }
      if (result.is_correct) {
        sfx.play('correct')
        sfx.play('step')
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.5 } })
        setRabbitMood('happy')
        setTimeout(() => setRabbitMood('idle'), 2000)
        if (result.is_finish) {
          sfx.play('fanfare')
          // 한 바퀴 완주 — 거대한 컨페티 (브랜드 purple→pink 팔레트)
          confetti({
            particleCount: 360,
            spread: 160,
            startVelocity: 55,
            origin: { y: 0.5 },
            colors: ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe', '#c084fc', '#ffffff'],
          })
          // 1초 뒤 추가 발사 (양쪽에서)
          setTimeout(() => {
            confetti({ particleCount: 120, angle: 60, spread: 90, origin: { x: 0, y: 0.6 } })
            confetti({ particleCount: 120, angle: 120, spread: 90, origin: { x: 1, y: 0.6 } })
          }, 800)
        }
        // 한 바퀴 완주 이벤트 캡처
        if (result.lap_event) {
          setPendingLap(result.lap_event)
        }
        // 토끼 이벤트 — 보물 / 진화
        const ev = result.rabbit_event
        // 정답 보상 보물 + 랩 완주 보상(면류관)을 합쳐 한 번에 노출
        const gainedFromAnswer = ev?.treasures_gained ?? []
        const gainedFromLap = result.lap_event?.treasures_gained ?? []
        const allGained = [...gainedFromAnswer, ...gainedFromLap]
        if (ev || gainedFromLap.length) {
          // 캐시 무효화 → 토끼 다시 fetch
          queryClient.invalidateQueries({ queryKey: QK_RABBIT_ME })
        }
        if (allGained.length) {
          setPendingTreasures(allGained)
        }
        if (ev?.evolved && ev.from_stage) {
          setPendingEvolution({ from: ev.from_stage, to: ev.stage })
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.4 },
            colors: ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe'],
          })
          sfx.play('milestone')
        }
      } else {
        sfx.play('wrong')
        setRabbitMood('sad')
        setTimeout(() => setRabbitMood('idle'), 1600)
      }
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류'
      // 세션이 만료되었거나 퀴즈가 더 이상 유효하지 않은 경우 자동 복구
      if (msg.includes('진행 중인 게임이 없습니다') || msg.includes('해당 퀴즈는')) {
        pushToast('세션이 만료되어 새로 동기화합니다', 'info')
        setShowQuiz(false)
        setActiveQuiz(null)
        await queryClient.invalidateQueries({ queryKey: QK_BM_STATE })
      }
      throw err
    }
  }

  const handleQuizClose = () => {
    setShowQuiz(false)
    const lastResult = answerMutation.data
    const quizClosedTile = activeQuiz
      ? tiles.find((t) => t.bible_book === activeQuiz.related_book && t.bible_chapter === activeQuiz.related_chapter)
      : null
    setActiveQuiz(null)

    // 보스 클리어 시: narrative 대신 보스 클리어 모달이 표시됨 (이미 setBossClear됨)
    if (lastResult?.boss_state?.boss_complete) {
      // 폭죽 추가
      sfx.play('fanfare')
      confetti({
        particleCount: 220,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#f9a8d4', '#d8b4fe', '#f87171'],
      })
      return
    }

    // 정답이었고 도착한 칸이 있으면 NarrativeCard 자동 표시
    if (lastResult?.is_correct && lastResult.arrived_tile) {
      setActiveNarrative({
        tile: lastResult.arrived_tile as Tile,
        verseText: lastResult.related_verse_text ?? null,
        variant: lastResult.is_finish ? 'finish' : 'arrival',
        scoreDelta: lastResult.score_delta,
      })
    } else if (lastResult?.is_correct && quizClosedTile) {
      setActiveNarrative({
        tile: quizClosedTile,
        verseText: lastResult.related_verse_text ?? null,
        variant: 'arrival',
        scoreDelta: lastResult.score_delta,
      })
    }
  }

  const handleBossNext = () => {
    const next = answerMutation.data?.next_boss_quiz
    if (next) {
      // QuizModal이 quiz.id 변경을 감지하여 자체 상태(answer/timer)를 리셋
      setActiveQuiz(next)
    }
  }

  const handleNarrativeClose = () => {
    setActiveNarrative(null)
  }

  const handleRestart = () => {
    if (window.confirm('지금까지의 발자취를 포기하고 처음부터 다시 시작할까요?')) {
      sfx.play('click')
      introShownRef.current = false
      setStreak(0)
      startMutation.mutate(true)
    }
  }

  const toggleMute = () => {
    const next = !muted
    sfx.setMuted(next)
    setMutedUi(next)
  }

  // 안내 단계: 인증 / 로딩 / 빈 세션
  if (!isAuthenticated) {
    return (
      <div className="bm-page">
        <div className="bm-need-login">
          <h2>👣 예수님의 발자취</h2>
          <p>로그인 후 80걸음의 여행을 시작할 수 있어요.</p>
          <button type="button" className="bm-primary-btn" onClick={() => navigate('/login')}>
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  if (stateQuery.isLoading || startMutation.isPending) {
    return (
      <div className="bm-page">
        <div className="bm-loading">발자취를 준비 중입니다…</div>
      </div>
    )
  }

  if (!state || !session) {
    return (
      <div className="bm-page">
        <div className="bm-need-login">
          <h2>👣 예수님의 발자취</h2>
          <button
            type="button"
            className="bm-primary-btn"
            onClick={() => startMutation.mutate(false)}
          >
            여행 시작하기
          </button>
        </div>
      </div>
    )
  }

  // grid 셀 크기 계산용 비율 (실제 좌표는 % 기반으로 절대 위치)

  return (
    <div className="bm-page">
      {/* 헤더 */}
      <header className="bm-page-header">
        <h1 className="bm-title">
          <span className="bm-title-emoji">👣</span>
          예수님의 발자취
        </h1>
        <div className="bm-header-actions">
          <button type="button" className="bm-ghost-btn" onClick={toggleMute} aria-label="음소거 토글">
            {muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="bm-ghost-btn" onClick={() => setShowLb(true)}>
            🏆 리더보드
          </button>
          <button
            type="button"
            className="bm-ghost-btn"
            onClick={() => navigate('/bluemarble/rabbit')}
          >
            🐰 내 토끼
          </button>
          <button
            type="button"
            className="bm-ghost-btn"
            onClick={handleRestart}
            disabled={startMutation.isPending}
          >
            ↻ 처음부터
          </button>
          {!isGameDone && (
            <button
              type="button"
              className="bm-ghost-btn bm-ghost-danger"
              onClick={() => {
                if (window.confirm('정말 여행을 포기할까요?')) abandonMutation.mutate()
              }}
            >
              포기
            </button>
          )}
        </div>
      </header>

      <div className="bm-layout">
        {/* 사이드 - 게임 상태 */}
        <aside className="bm-side">
          <GameStatus
            session={session}
            username={user?.full_name || user?.username}
            phase={currentTile?.phase ?? null}
            streak={streak}
          />
          <div className="bm-side-action">
            <StepButton
              onClick={handleAdvance}
              disabled={!!pendingQuiz || isGameDone || !!activeNarrative}
              loading={advanceMutation.isPending}
              label={
                isGameDone
                  ? '여행 완료'
                  : pendingQuiz
                  ? '퀴즈 풀기'
                  : activeNarrative
                  ? '카드 닫기'
                  : '다음 발자취로'
              }
              hint={
                isGameDone
                  ? '👑 부활하신 주님과 동행하셨습니다'
                  : pendingQuiz
                  ? '맞히면 다음 칸으로 전진합니다'
                  : '안개 너머의 발자취가 기다립니다'
              }
            />
          </div>
        </aside>

        {/* 발자취 보드 */}
        <div className="journey-wrap">
          <div
            className="journey-board"
            style={{
              gridTemplateColumns: `repeat(${JOURNEY_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${JOURNEY_ROWS}, 1fr)`,
            }}
          >
            {tiles.map((tile) => {
              const { row, col } = positionToCoord(tile.position)
              const fog = getFogState(tile.position, session.current_position)
              const isCurrent = tile.position === session.current_position
              const isNext = tile.position === session.current_position + 1
              return (
                <div
                  key={tile.id}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  className="journey-cell"
                >
                  <JourneyTile
                    tile={tile}
                    fog={fog}
                    isCurrent={isCurrent}
                    isNext={isNext}
                  />
                </div>
              )
            })}
            <JourneyPiece
              position={session.current_position}
              stage={rabbitQuery.data?.rabbit.stage ?? 1}
              equipped={rabbitQuery.data?.rabbit.equipped ?? {}}
              mood={rabbitMood}
            />
          </div>
          {currentTile && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTile.id}
                className="journey-hud"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <span className="journey-hud-icon">{currentTile.icon}</span>
                <div className="journey-hud-text">
                  <div className="journey-hud-title">{currentTile.title}</div>
                  {currentTile.phase && (
                    <div className="journey-hud-phase">{currentTile.phase}</div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 게임 클리어 */}
      {isGameDone && !activeNarrative && (
        <div className="bm-modal-backdrop">
          <motion.div
            className="bm-clear-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <div className="bm-clear-trophy">👑</div>
            <h2>발자취 완주!</h2>
            <div className="bm-clear-score">{session.total_score.toLocaleString()}pt</div>
            <div className="bm-clear-stats">
              <span>정답 {session.correct_count}</span>
              <span>·</span>
              <span>오답 {session.wrong_count}</span>
              <span>·</span>
              <span>{session.dice_count}걸음</span>
            </div>
            <div className="bm-clear-actions">
              <button type="button" className="bm-primary-btn" onClick={() => startMutation.mutate(true)}>
                다시 도전
              </button>
              <button type="button" className="bm-ghost-btn" onClick={() => setShowLb(true)}>
                리더보드 보기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 퀴즈 모달 */}
      {showQuiz && activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onSubmit={handleAnswerSubmit}
          onClose={handleQuizClose}
          isBoss={currentTile?.tile_type === 'boss'}
          bossTitle={currentTile?.tile_type === 'boss' ? currentTile.title : undefined}
          bossState={bossState}
          onBossNext={handleBossNext}
        />
      )}

      {/* 보스 클리어 모달 */}
      {bossClear && (
        <div className="bm-modal-backdrop">
          <motion.div
            className="bm-boss-clear-modal"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="bm-boss-clear-icon">
              {bossClear.is_perfect ? '👑' : '⚔️'}
            </div>
            <h2 className="bm-boss-clear-title">
              {bossClear.is_perfect ? '완벽한 승리!' : '보스 클리어!'}
            </h2>
            <div className="bm-boss-clear-stats">
              <span className="bm-boss-clear-frac">
                {bossClear.boss_correct} <span>/</span> {bossClear.boss_total}
              </span>
              <span className="bm-boss-clear-label">정답</span>
            </div>
            <div className="bm-boss-clear-bonus">
              +{bossClear.boss_clear_bonus.toLocaleString()}pt
              {bossClear.is_perfect && (
                <span className="bm-boss-clear-perfect">PERFECT 보너스!</span>
              )}
            </div>
            <button
              type="button"
              className="bm-primary-btn"
              onClick={() => setBossClear(null)}
            >
              계속 전진하기
            </button>
          </motion.div>
        </div>
      )}

      {/* 내러티브 카드 */}
      <NarrativeCard
        tile={activeNarrative?.tile ?? null}
        verseText={activeNarrative?.verseText}
        open={!!activeNarrative}
        onClose={handleNarrativeClose}
        variant={activeNarrative?.variant ?? 'arrival'}
        scoreDelta={activeNarrative?.scoreDelta}
      />

      {/* 토스트 */}
      <div className="bm-toast-container">
        {toasts.map((t) => (
          <EventToast
            key={t.id}
            message={t.message}
            variant={t.variant}
            scoreDelta={t.scoreDelta}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* 리더보드 */}
      <Leaderboard open={showLb} onClose={() => setShowLb(false)} />

      {/* 보물 획득 모달 (정답 후) */}
      {pendingTreasures.length > 0 && (
        <TreasureRevealModal
          treasures={pendingTreasures}
          onClose={() => setPendingTreasures([])}
        />
      )}

      {/* 진화 모달 */}
      {pendingEvolution && (
        <EvolutionModal
          fromStage={pendingEvolution.from}
          toStage={pendingEvolution.to}
          equipped={rabbitQuery.data?.rabbit.equipped ?? {}}
          onClose={() => setPendingEvolution(null)}
        />
      )}

      {/* 한 바퀴 완주 모달 — 가장 위 z-index */}
      {pendingLap && session && (
        <LapCompletionModal
          lap={pendingLap}
          totalScore={session.total_score}
          correctCount={session.correct_count}
          rabbitStage={rabbitQuery.data?.rabbit.stage ?? 1}
          rabbitEquipped={rabbitQuery.data?.rabbit.equipped ?? {}}
          onContinue={() => {
            setPendingLap(null)
            // 퀴즈/내러티브 모달이 떠있다면 정리
            setShowQuiz(false)
            setActiveQuiz(null)
            setActiveNarrative(null)
            // 게임은 백엔드에서 이미 다음 바퀴로 루프됨. state 새로고침.
            queryClient.invalidateQueries({ queryKey: QK_BM_STATE })
          }}
          onFinish={() => {
            if (window.confirm('정말 여행을 마치시겠어요? 누적 점수가 리더보드에 기록됩니다.')) {
              setPendingLap(null)
              setShowQuiz(false)
              setActiveQuiz(null)
              setActiveNarrative(null)
              abandonMutation.mutate()
            }
          }}
        />
      )}
    </div>
  )
}
