// 발자취 게임 화면 — 게임 상태 전이/이펙트는 useBluemarbleGame 훅에 있고
// 이 컴포넌트는 그 결과를 렌더링만 한다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useProfileDetail } from '../../hooks/useProfile'
import { useBluemarbleGame } from './useBluemarbleGame'
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
import {
  positionToCoord,
  getFogState,
  JOURNEY_COLS,
  JOURNEY_ROWS,
} from './journeyLayout'
import './Bluemarble.css'

export default function Bluemarble() {
  const navigate = useNavigate()
  const profileQuery = useProfileDetail()
  const user = profileQuery.data?.stats

  const game = useBluemarbleGame()
  const {
    isAuthenticated,
    state,
    session,
    tiles,
    pendingQuiz,
    isGameDone,
    currentTile,
    stateQuery,
    startMutation,
    advanceMutation,
    abandonMutation,
    rabbitQuery,
    sfx,
  } = game

  const [showLb, setShowLb] = useState(false)
  const [muted, setMutedUi] = useState<boolean>(sfx.isMuted())

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
            onClick={game.handleRestart}
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
            streak={game.streak}
          />
          <div className="bm-side-action">
            <StepButton
              onClick={game.handleAdvance}
              disabled={!!pendingQuiz || isGameDone || !!game.activeNarrative}
              loading={advanceMutation.isPending}
              label={
                isGameDone
                  ? '여행 완료'
                  : pendingQuiz
                  ? '퀴즈 풀기'
                  : game.activeNarrative
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
              mood={game.rabbitMood}
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
      {isGameDone && !game.activeNarrative && (
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
      {game.showQuiz && game.activeQuiz && (
        <QuizModal
          quiz={game.activeQuiz}
          onSubmit={game.handleAnswerSubmit}
          onClose={game.handleQuizClose}
          isBoss={currentTile?.tile_type === 'boss'}
          bossTitle={currentTile?.tile_type === 'boss' ? currentTile.title : undefined}
          bossState={game.bossState}
          onBossNext={game.handleBossNext}
        />
      )}

      {/* 보스 클리어 모달 */}
      {game.bossClear && (
        <div className="bm-modal-backdrop">
          <motion.div
            className="bm-boss-clear-modal"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="bm-boss-clear-icon">
              {game.bossClear.is_perfect ? '👑' : '⚔️'}
            </div>
            <h2 className="bm-boss-clear-title">
              {game.bossClear.is_perfect ? '완벽한 승리!' : '보스 클리어!'}
            </h2>
            <div className="bm-boss-clear-stats">
              <span className="bm-boss-clear-frac">
                {game.bossClear.boss_correct} <span>/</span> {game.bossClear.boss_total}
              </span>
              <span className="bm-boss-clear-label">정답</span>
            </div>
            <div className="bm-boss-clear-bonus">
              +{game.bossClear.boss_clear_bonus.toLocaleString()}pt
              {game.bossClear.is_perfect && (
                <span className="bm-boss-clear-perfect">PERFECT 보너스!</span>
              )}
            </div>
            <button
              type="button"
              className="bm-primary-btn"
              onClick={game.closeBossClear}
            >
              계속 전진하기
            </button>
          </motion.div>
        </div>
      )}

      {/* 내러티브 카드 */}
      <NarrativeCard
        tile={game.activeNarrative?.tile ?? null}
        verseText={game.activeNarrative?.verseText}
        open={!!game.activeNarrative}
        onClose={game.handleNarrativeClose}
        variant={game.activeNarrative?.variant ?? 'arrival'}
        scoreDelta={game.activeNarrative?.scoreDelta}
      />

      {/* 토스트 */}
      <div className="bm-toast-container">
        {game.toasts.map((t) => (
          <EventToast
            key={t.id}
            message={t.message}
            variant={t.variant}
            scoreDelta={t.scoreDelta}
            onClose={() => game.removeToast(t.id)}
          />
        ))}
      </div>

      {/* 리더보드 */}
      <Leaderboard open={showLb} onClose={() => setShowLb(false)} />

      {/* 보물 획득 모달 (정답 후) */}
      {game.pendingTreasures.length > 0 && (
        <TreasureRevealModal
          treasures={game.pendingTreasures}
          onClose={game.closeTreasures}
        />
      )}

      {/* 진화 모달 */}
      {game.pendingEvolution && (
        <EvolutionModal
          fromStage={game.pendingEvolution.from}
          toStage={game.pendingEvolution.to}
          equipped={rabbitQuery.data?.rabbit.equipped ?? {}}
          onClose={game.closeEvolution}
        />
      )}

      {/* 한 바퀴 완주 모달 — 가장 위 z-index */}
      {game.pendingLap && session && (
        <LapCompletionModal
          lap={game.pendingLap}
          totalScore={session.total_score}
          correctCount={session.correct_count}
          rabbitStage={rabbitQuery.data?.rabbit.stage ?? 1}
          rabbitEquipped={rabbitQuery.data?.rabbit.equipped ?? {}}
          onContinue={game.continueLap}
          onFinish={game.finishLap}
        />
      )}
    </div>
  )
}
