import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  useBluemarbleState,
  useStartGame,
  useRollDice,
  useSubmitAnswer,
  useAbandonGame,
} from '../../hooks/useBluemarble'
import { useProfileDetail } from '../../hooks/useProfile'
import BoardTile from './components/BoardTile'
import GamePiece from './components/GamePiece'
import Dice from './components/Dice'
import QuizModal from './components/QuizModal'
import EventToast from './components/EventToast'
import GameStatus from './components/GameStatus'
import Leaderboard from './components/Leaderboard'
import { POSITION_TO_GRID } from './boardLayout'
import './Bluemarble.css'

interface Toast {
  id: number
  message: string
  variant: 'bonus' | 'rest' | 'warp' | 'lap' | 'finish' | 'info'
  scoreDelta?: number
}

export default function Bluemarble() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('access_token')
  const profileQuery = useProfileDetail()
  const user = profileQuery.data?.stats
  const startMutation = useStartGame()
  const rollMutation = useRollDice()
  const answerMutation = useSubmitAnswer()
  const abandonMutation = useAbandonGame()
  const stateQuery = useBluemarbleState(isAuthenticated)

  const [diceRolling, setDiceRolling] = useState(false)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [pieceMoving, setPieceMoving] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showLb, setShowLb] = useState(false)
  const [lastMsg, setLastMsg] = useState<string>('')
  const toastIdRef = useRef(0)

  const state = stateQuery.data
  const session = state?.session
  const tiles = state?.tiles ?? []
  const pendingQuiz = state?.pending_quiz

  const isGameDone = session?.status === 'completed'

  // 시작/이어가기 자동 호출
  useEffect(() => {
    if (isAuthenticated && stateQuery.isError) {
      startMutation.mutate(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, stateQuery.isError])

  // pending quiz가 생기면 모달 자동 오픈 (말 이동이 끝난 후)
  useEffect(() => {
    if (pendingQuiz && !pieceMoving && !diceRolling) {
      setShowQuiz(true)
    }
  }, [pendingQuiz, pieceMoving, diceRolling])

  const pushToast = (message: string, variant: Toast['variant'], scoreDelta?: number) => {
    const id = ++toastIdRef.current
    setToasts((t) => [...t, { id, message, variant, scoreDelta }])
  }

  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  const handleRoll = async () => {
    if (!session || diceRolling || pieceMoving || pendingQuiz || isGameDone) return
    setDiceRolling(true)
    setDiceValue(null)
    setLastMsg('')

    try {
      const result = await rollMutation.mutateAsync()
      // 주사위 멈출 때까지 기다림
      setTimeout(() => {
        setDiceValue(result.dice)
        setDiceRolling(false)

        // 말 이동 시작
        setPieceMoving(true)
        setLastMsg(result.message)

        if (result.passed_start && result.lap_bonus > 0) {
          pushToast(`한 바퀴 돌았습니다! +${result.lap_bonus}pt`, 'lap', result.lap_bonus)
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        }

        // 칸별 토스트는 도착 후 표시
      }, 900)
    } catch (e) {
      setDiceRolling(false)
      setLastMsg(e instanceof Error ? e.message : '오류가 발생했습니다')
    }
  }

  const handlePieceArrive = () => {
    setPieceMoving(false)
    // 가장 최근 roll 결과를 기반으로 토스트 표시
    const last = rollMutation.data
    if (!last) return

    const tile = last.landed_tile
    if (last.event_type === 'bonus') {
      pushToast(`${tile.title}!`, 'bonus', last.score_delta)
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } })
    } else if (last.event_type === 'rest') {
      pushToast(`${tile.title} - 다음 턴 쉽니다`, 'rest')
    } else if (last.event_type === 'warp') {
      pushToast(`${tile.title}!`, 'warp')
      confetti({
        particleCount: 100,
        angle: 90,
        spread: 360,
        startVelocity: 30,
        origin: { y: 0.5 },
      })
    } else if (last.event_type === 'finish' || isGameDone) {
      pushToast('성경 일주 완료!', 'finish', last.total_score)
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
      })
    }
    // quiz/mission은 모달이 알아서 오픈됨 (위의 useEffect)
  }

  const handleAnswerSubmit = async (choiceIndex: number) => {
    if (!pendingQuiz) throw new Error('퀴즈 없음')
    const result = await answerMutation.mutateAsync({
      quizId: pendingQuiz.id,
      choiceIndex,
    })
    if (result.is_correct) {
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.5 } })
    }
    return result
  }

  const handleQuizClose = () => {
    setShowQuiz(false)
  }

  const handleRestart = () => {
    if (window.confirm('현재 진행을 포기하고 새로 시작할까요?')) {
      startMutation.mutate(true)
    }
  }

  // 보드 그리드 셀 (7x7) - 칸이 없는 안쪽은 비우고, 가운데 5x5 영역에 게임 상태 표시
  const tilesByPosition = useMemo(() => {
    const map = new Map<number, (typeof tiles)[number]>()
    tiles.forEach((t) => map.set(t.position, t))
    return map
  }, [tiles])

  // 로그인 안 됨
  if (!isAuthenticated) {
    return (
      <div className="bm-page">
        <div className="bm-need-login">
          <h2>🎲 성경 보드게임</h2>
          <p>로그인이 필요한 게임이에요.</p>
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
        <div className="bm-loading">게임을 준비중입니다...</div>
      </div>
    )
  }

  if (!state || !session) {
    return (
      <div className="bm-page">
        <div className="bm-need-login">
          <h2>🎲 성경 보드게임</h2>
          <button
            type="button"
            className="bm-primary-btn"
            onClick={() => startMutation.mutate(false)}
          >
            새 게임 시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bm-page">
      {/* 헤더 */}
      <header className="bm-page-header">
        <h1 className="bm-title">
          <span className="bm-title-emoji">🎲</span>
          성경 일주 보드게임
        </h1>
        <div className="bm-header-actions">
          <button type="button" className="bm-ghost-btn" onClick={() => setShowLb(true)}>
            🏆 리더보드
          </button>
          <button
            type="button"
            className="bm-ghost-btn"
            onClick={handleRestart}
            disabled={startMutation.isPending}
          >
            ↻ 새 게임
          </button>
          {!isGameDone && (
            <button
              type="button"
              className="bm-ghost-btn bm-ghost-danger"
              onClick={() => {
                if (window.confirm('정말 게임을 포기할까요?')) abandonMutation.mutate()
              }}
            >
              포기
            </button>
          )}
        </div>
      </header>

      {/* 보드 */}
      <div className="bm-board-wrapper">
        <div className="bm-board">
          {/* 24칸 */}
          {tiles.map((tile) => {
            const grid = POSITION_TO_GRID[tile.position]
            const isCurrent = session.current_position === tile.position
            return (
              <div
                key={tile.id}
                style={{
                  gridRow: grid.row,
                  gridColumn: grid.col,
                }}
              >
                <BoardTile tile={tile} isCurrent={isCurrent} isLanded={isCurrent} />
              </div>
            )
          })}

          {/* 말 (Lamb) */}
          <GamePiece position={session.current_position} onArrive={handlePieceArrive} />

          {/* 중앙 영역 */}
          <div className="bm-board-center">
            <GameStatus session={session} username={user?.full_name || user?.username} />
            <Dice
              value={diceValue ?? session.last_dice}
              rolling={diceRolling}
              onRoll={handleRoll}
              disabled={pieceMoving || !!pendingQuiz || isGameDone || session.skip_next_turn === false ? false : false}
              label={
                session.skip_next_turn
                  ? '쉬는 턴 (소진)'
                  : isGameDone
                  ? '게임 종료'
                  : pendingQuiz
                  ? '퀴즈 풀기'
                  : '주사위 굴리기'
              }
            />
            {lastMsg && <div className="bm-last-msg">{lastMsg}</div>}
            {tilesByPosition.get(session.current_position) && (
              <div className="bm-current-tile-info">
                <span className="bm-cti-icon">{tilesByPosition.get(session.current_position)?.icon}</span>
                <span className="bm-cti-title">{tilesByPosition.get(session.current_position)?.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 게임 클리어 화면 */}
      {isGameDone && (
        <div className="bm-modal-backdrop">
          <div className="bm-clear-modal">
            <div className="bm-clear-trophy">🏆</div>
            <h2>성경 일주 완주!</h2>
            <div className="bm-clear-score">{session.total_score.toLocaleString()}pt</div>
            <div className="bm-clear-stats">
              <span>정답 {session.correct_count}</span>
              <span>·</span>
              <span>{session.lap_count}바퀴</span>
              <span>·</span>
              <span>{session.dice_count}턴</span>
            </div>
            <div className="bm-clear-actions">
              <button type="button" className="bm-primary-btn" onClick={() => startMutation.mutate(true)}>
                다시 도전
              </button>
              <button type="button" className="bm-ghost-btn" onClick={() => setShowLb(true)}>
                리더보드 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 퀴즈 모달 */}
      {showQuiz && pendingQuiz && (
        <QuizModal
          quiz={pendingQuiz}
          onSubmit={handleAnswerSubmit}
          onClose={handleQuizClose}
        />
      )}

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
