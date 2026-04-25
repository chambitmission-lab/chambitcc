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
import type { QuizPublic, Tile, AdvanceResult } from '../../types/bluemarble'
import JourneyTile from './components/JourneyTile'
import JourneyPiece from './components/JourneyPiece'
import StepButton from './components/StepButton'
import NarrativeCard from './components/NarrativeCard'
import QuizModal from './components/QuizModal'
import EventToast from './components/EventToast'
import GameStatus from './components/GameStatus'
import Leaderboard from './components/Leaderboard'
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
          : result.event_type === 'finish'
          ? 'finish'
          : 'arrival'

      if (result.event_type === 'milestone') {
        sfx.play('milestone')
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        pushToast(`이정표! ${result.next_tile.title} +${result.score_delta}pt`, 'bonus', result.score_delta)
      } else if (result.event_type === 'finish') {
        sfx.play('fanfare')
        confetti({ particleCount: 240, spread: 120, origin: { y: 0.5 } })
        pushToast('여행 완주!', 'finish', result.total_score)
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

  const handleAnswerSubmit = async (choiceIndex: number) => {
    const quiz = activeQuiz ?? pendingQuiz
    if (!quiz) throw new Error('퀴즈 없음')
    try {
      const result = await answerMutation.mutateAsync({
        quizId: quiz.id,
        choiceIndex,
      })
      setStreak(result.streak)
      if (result.is_correct) {
        sfx.play('correct')
        sfx.play('step')
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.5 } })
        if (result.is_finish) {
          sfx.play('fanfare')
          confetti({ particleCount: 240, spread: 120, origin: { y: 0.5 } })
        }
      } else {
        sfx.play('wrong')
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
            <JourneyPiece position={session.current_position} />
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
        />
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
    </div>
  )
}
