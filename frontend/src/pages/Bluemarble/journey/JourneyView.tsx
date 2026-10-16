// 발자취 여행 탭 — 수채화 지도(한 장씩) + 오늘의 걸음 + 장면 카드.
// 게임 상태 전이는 기존 useBluemarbleGame 그대로, 이 컴포넌트는 그리기만 한다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useBluemarbleGame } from '../useBluemarbleGame'
import { confirmDialog } from '../../../utils/confirmDialog'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import BmIcon from '../components/BluemarbleIcons'
import EventToast from '../components/EventToast'
import Leaderboard from '../components/Leaderboard'
import TreasureRevealModal from '../../../components/rabbit/TreasureRevealModal'
import EvolutionModal from '../../../components/rabbit/EvolutionModal'
import LapCompletionModal from '../../../components/rabbit/LapCompletionModal'
import JourneyMap from './JourneyMap'
import SceneQuiz from './SceneQuiz'
import StoryCard from './StoryCard'
import { sceneCardMotion } from './sceneMotion'
import { buildChapters, chapterOf } from './chapters'
// 성지 조감 지도(라이트·다크 같은 구도) — 스켈레톤과 같은 배경을 깐다(useQuestBg)
import { useQuestBgStyle } from './useQuestBg'

type Game = ReturnType<typeof useBluemarbleGame>

const timeUntil = (iso?: string) => {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return '곧'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}시간 ${m}분 뒤` : `${m}분 뒤`
}

export default function JourneyView({ game, onGoLeague, header }: { game: Game; onGoLeague: () => void; header?: ReactNode }) {
  const navigate = useNavigate()
  const bgStyle = useQuestBgStyle()
  const { state, session, tiles, pendingQuiz, isGameDone, currentTile, startMutation, abandonMutation, advanceMutation, rabbitQuery, sfx } = game
  const [showLb, setShowLb] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // 더보기 메뉴 — 바깥을 누르거나 Esc 로 닫힌다
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])
  const [muted, setMuted] = useState<boolean>(sfx.isMuted())

  const chapters = useMemo(() => buildChapters(tiles), [tiles])
  const position = session?.current_position ?? 0
  // 지도는 "다음에 밟을 칸"의 장을 보여 준다 — 장 끝에 서 있으면 새 장이 펼쳐진다
  const pendingTile = session?.pending_tile_id ? tiles.find((t) => t.id === session.pending_tile_id) ?? null : null
  const targetPos = pendingTile ? pendingTile.position : position + 1
  const liveChapter = chapterOf(chapters, Math.min(targetPos, tiles.length - 1))
  // 지난 장 다시 보기 — 걷던 장이 바뀌면(새 장 진입) 저절로 지금 장으로 돌아온다
  const [view, setView] = useState<{ idx: number; live: number } | null>(null)
  const viewIdx = view && view.live === liveChapter?.index ? view.idx : null
  const setViewIdx = (idx: number | null) => setView(idx == null || !liveChapter ? null : { idx, live: liveChapter.index })
  const chapter = viewIdx != null ? chapters[viewIdx] : liveChapter

  const steps = state?.daily_steps
  const stepsLeft = steps?.remaining ?? 5
  const busy = !!game.activeNarrative || game.showQuiz || advanceMutation.isPending
  const canWalk = !isGameDone && !busy && (!!pendingQuiz || stepsLeft > 0) && viewIdx == null
  const nextTile = tiles.find((t) => t.position === targetPos) ?? null

  const accuracy = session && session.correct_count + session.wrong_count > 0
    ? Math.round((session.correct_count / (session.correct_count + session.wrong_count)) * 100)
    : 0
  const diary = chapter ? chapter.tiles.filter((t) => t.position <= position && t.position > 0).slice(-6).reverse() : []

  if (!session || !chapter) return null

  // 풀던 문제가 있으면 훅이 장면 카드를 자동으로 다시 연다 — 걸음은 새 칸을 열 때만 쓴다
  const walk = () => game.handleAdvance()
  // 보스 5문제 동안 pending_tile 은 보스 칸에 머문다
  const isBoss = pendingTile?.tile_type === 'boss' || !!game.bossState?.in_boss
  // 지금 떠 있어야 할 장면 카드 하나 — 문제가 끝나기 전엔 보스 클리어도 기다린다
  const layer: 'quiz' | 'story' | 'boss' | 'done' | null =
    game.showQuiz && game.activeQuiz
      ? 'quiz'
      : game.activeNarrative
        ? 'story'
        : game.bossClear
          ? 'boss'
          : isGameDone && !game.pendingLap
            ? 'done'
            : null

  return (
    <div className="qj" style={bgStyle}>
      {/* PC 지도 판 — 카드 폭에 맞춘 원본 비율 그림이 스크롤 내내 제자리에 머문다(모바일은 .qj 고정 배경) */}
      <div className="qj-backdrop" aria-hidden />
      <div className="qj-stage">
        {header}
        {/* 상단 띠 — 지금 장 · 오늘의 걸음 · 더보기 */}
        <div className="qj-bar">
          <div className="qj-bar-text">
            <p className="qj-bar-kicker">
              예수님의 발자취{session.lap_count > 0 ? ` · ${session.lap_count + 1}바퀴째` : ''}
            </p>
            <p className="qj-bar-title">{liveChapter?.name}</p>
          </div>
          <div className="qj-steps" aria-label={`오늘 남은 걸음 ${stepsLeft}`}>
            <span className="qj-steps-label">오늘의 걸음</span>
            {Array.from({ length: steps?.limit ?? 5 }).map((_, i) => (
              <span key={i} className={`qj-step ${i < stepsLeft ? 'is-full' : ''}`}>
                <BmIcon name="footprints" size={14} strokeWidth={1.8} />
              </span>
            ))}
          </div>
          <div className="qj-menu-wrap" ref={menuRef}>
            <button type="button" className="qj-icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="더보기" aria-expanded={menuOpen}>
              <span className="material-icons-round">more_horiz</span>
            </button>
            {menuOpen && (
              <div className="qj-menu" onClick={() => setMenuOpen(false)}>
                <button type="button" onClick={() => { const n = !muted; sfx.setMuted(n); setMuted(n) }}>
                  <BmIcon name={muted ? 'sound-off' : 'sound-on'} size={16} /> {muted ? '소리 켜기' : '소리 끄기'}
                </button>
                <button type="button" onClick={() => setShowLb(true)}>
                  <BmIcon name="trophy" size={16} /> 누적 점수 순위
                </button>
                <button type="button" onClick={() => navigate('/bluemarble/rabbit')}>
                  <BmIcon name="rabbit" size={16} /> 내 토끼
                </button>
                <button type="button" onClick={game.handleRestart}>
                  <BmIcon name="restart" size={16} /> 처음부터 다시
                </button>
                {!isGameDone && (
                  <button
                    type="button"
                    className="is-danger"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: '여행 포기',
                        message: '정말 여행을 포기할까요?',
                        description: '지금까지의 발자취가 사라집니다.',
                        confirmText: '포기',
                        icon: 'flag',
                      })
                      if (ok) abandonMutation.mutate()
                    }}
                  >
                    <BmIcon name="flag" size={16} /> 여행 포기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 장 징검다리 — 지난 장은 눌러서 다시 볼 수 있다 */}
        <div className="qj-chapters" role="tablist" aria-label="여정의 장">
          {chapters.map((c) => {
            const st = c.end <= position ? 'done' : c.index === liveChapter?.index ? 'now' : 'locked'
            return (
              <button
                key={c.index}
                type="button"
                role="tab"
                aria-selected={c.index === chapter.index}
                className={`qj-chip is-${st} ${c.index === chapter.index ? 'is-view' : ''}`}
                disabled={st === 'locked'}
                onClick={() => setViewIdx(c.index === liveChapter?.index ? null : c.index)}
              >
                {st === 'done' && <BmIcon name="footprints" size={12} />}
                {c.name}
              </button>
            )
          })}
        </div>

        <div className="qj-layout">
          <div className="qj-map-col">
            {viewIdx != null && (
              <button type="button" className="qj-back-live" onClick={() => setViewIdx(null)}>
                지금 걷는 장으로 돌아가기
              </button>
            )}
            <JourneyMap
              chapter={chapter}
              prevChapter={chapters[chapter.index - 1]}
              nextChapter={chapters[chapter.index + 1]}
              position={position}
              canWalk={canWalk}
              hasPending={!!pendingQuiz}
              onWalk={walk}
              rabbitStage={rabbitQuery.data?.rabbit.stage ?? 1}
              rabbitEquipped={rabbitQuery.data?.rabbit.equipped ?? {}}
              rabbitMood={stepsLeft === 0 && !pendingQuiz ? 'sleep' : game.rabbitMood}
            />
          </div>

          <aside className="qj-side">
            <div className="qj-panel qj-today">
              {isGameDone ? (
                <>
                  <p className="qj-panel-kicker">여행 완료</p>
                  <h3>부활하신 주님과 동행했어요</h3>
                  <button type="button" className="qj-go" onClick={() => startMutation.mutate(true)}>
                    새 여행 시작
                  </button>
                </>
              ) : pendingQuiz || stepsLeft > 0 ? (
                <>
                  <p className="qj-panel-kicker">{pendingQuiz ? '풀던 장면' : '다음 장면'}</p>
                  <h3>{nextTile?.tile_type === 'boss' ? `보스 · ${nextTile.title}` : nextTile?.title ?? '다음 발자취'}</h3>
                  <p className="qj-panel-sub">
                    {nextTile?.tile_type === 'boss' ? '5문제 연속 도전 — 다 맞히면 큰 보너스' : '맞히면 한 칸 앞으로, 틀려도 해설이 남아요'}
                  </p>
                  <button type="button" className="qj-go" onClick={walk} disabled={!canWalk}>
                    {advanceMutation.isPending ? '걷는 중…' : pendingQuiz ? '이어 풀기' : '걸어가기'}
                    <BmIcon name="footprints" size={17} />
                  </button>
                  <p className="qj-panel-note">오늘 남은 걸음 {stepsLeft}/{steps?.limit ?? 5}</p>
                </>
              ) : (
                <>
                  <p className="qj-panel-kicker">오늘의 걸음을 다 썼어요</p>
                  <h3>토끼가 쉬고 있어요</h3>
                  <p className="qj-panel-sub">{timeUntil(steps?.resets_at)} 다섯 걸음이 다시 채워져요. 그동안 말씀 리그에서 부서에 점수를 보태 볼까요?</p>
                  <button type="button" className="qj-go" onClick={onGoLeague}>
                    말씀 리그로 <BmIcon name="bolt" size={17} />
                  </button>
                </>
              )}
            </div>

            <div className="qj-panel qj-stats">
              <div className="qj-score">
                <span className="qj-score-label">총 점수</span>
                <b className="brand-text-gradient">{session.total_score.toLocaleString()}</b>
              </div>
              <div className="qj-progress" aria-label={`진행 ${position}/${tiles.length - 1}`}>
                <span style={{ width: `${(position / Math.max(1, tiles.length - 1)) * 100}%` }} />
              </div>
              <p className="qj-progress-label">
                {position} / {tiles.length - 1} 발자취
              </p>
              <div className="qj-stat-row">
                <span><b>{session.correct_count}</b>정답</span>
                <span><b>{accuracy}%</b>정확도</span>
                <span><b>{game.streak}</b>연속</span>
              </div>
            </div>

            {diary.length > 0 && (
              <div className="qj-panel">
                <p className="qj-panel-kicker">발자취 일기 · {chapter.name}</p>
                <ol className="qj-diary">
                  {diary.map((t) => (
                    <li key={t.id}>
                      <span className="qj-diary-stamp">
                        <BmIcon name="footprints" size={13} />
                      </span>
                      <div>
                        <b>{t.title}</b>
                        {t.bible_book && t.bible_chapter ? (
                          <span>
                            {canonicalBookName(t.bible_book)} {t.bible_chapter}
                            {t.bible_verse_start ? `:${t.bible_verse_start}` : ''}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 장면 레이어 — 문제·이야기·보스 클리어·완주가 배경 하나를 함께 쓰고 카드만 바뀐다.
          카드마다 배경을 따로 두면 문제→이야기로 넘어갈 때 배경이 꺼졌다 켜져 "모달이 순간 닫히는" 깜빡임이 났다. */}
      <AnimatePresence>
        {layer && (
          <motion.div
            key="scene-layer"
            className="qj-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            // 닫히기 시작하는 순간 클릭을 통과시킨다 — 투명해진 배경이 DOM 에서 빠지기 전까지
            // "걸어가기" 같은 뒤 버튼 클릭을 삼키던 문제(닫은 직후 눌러도 반응 없음) 방지.
            // 애니메이션할 수 없는 값이라 exit 시작과 동시에 즉시 적용된다
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && layer === 'story') game.handleNarrativeClose()
            }}
          >
            {/* 카드는 같은 격자 칸에 겹쳐 교차 페이드 — mode="wait" 는 퇴장 완료 감지가 늦어
                카드 사이에 빈 배경만 1~2초 남는 틈이 생겼다 */}
            <AnimatePresence>
              {layer === 'quiz' && game.activeQuiz && (
                <SceneQuiz
                  key="quiz"
                  quiz={game.activeQuiz}
                  tile={pendingTile ?? (isBoss ? currentTile : nextTile)}
                  isBoss={isBoss}
                  bossState={game.bossState}
                  onSubmit={game.handleAnswerSubmit}
                  onClose={game.handleQuizClose}
                  onBossNext={game.handleBossNext}
                />
              )}
              {layer === 'story' && game.activeNarrative && (
                <StoryCard
                  key={`story-${game.activeNarrative.tile.id}`}
                  tile={game.activeNarrative.tile}
                  verseText={game.activeNarrative.verseText}
                  onClose={game.handleNarrativeClose}
                  variant={game.activeNarrative.variant}
                  scoreDelta={game.activeNarrative.scoreDelta}
                />
              )}
              {layer === 'boss' && game.bossClear && (
                <motion.div key="boss" {...sceneCardMotion} className="qj-scene qj-trophy">
                  <div className="qj-trophy-icon">
                    <BmIcon name={game.bossClear.is_perfect ? 'crown' : 'swords'} size={48} strokeWidth={1.6} />
                  </div>
                  <h3>{game.bossClear.is_perfect ? '완벽한 승리!' : '보스 클리어!'}</h3>
                  <p className="qj-trophy-frac">
                    {game.bossClear.boss_correct} / {game.bossClear.boss_total} 정답
                  </p>
                  <p className="qj-story-score">+{game.bossClear.boss_clear_bonus.toLocaleString()}점</p>
                  <button type="button" className="qj-go" onClick={game.closeBossClear}>
                    계속 걷기 <BmIcon name="footprints" size={17} />
                  </button>
                </motion.div>
              )}
              {layer === 'done' && (
                <motion.div key="done" {...sceneCardMotion} className="qj-scene qj-trophy">
                  <div className="qj-trophy-icon">
                    <BmIcon name="crown" size={48} strokeWidth={1.6} />
                  </div>
                  <h3>발자취 완주!</h3>
                  <p className="qj-story-score">{session.total_score.toLocaleString()}점</p>
                  <p className="qj-trophy-frac">
                    정답 {session.correct_count} · 오답 {session.wrong_count}
                  </p>
                  <button type="button" className="qj-go" onClick={() => startMutation.mutate(true)}>
                    다시 걷기
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bm-toast-container">
        {game.toasts.map((t) => (
          <EventToast key={t.id} message={t.message} variant={t.variant} scoreDelta={t.scoreDelta} onClose={() => game.removeToast(t.id)} />
        ))}
      </div>

      <Leaderboard open={showLb} onClose={() => setShowLb(false)} />

      {/* 보물·진화는 해설을 다 읽고 문제 카드를 닫은 뒤에 — 채점 직후 해설 위로 덮이면 어수선했다 */}
      {game.pendingTreasures.length > 0 && layer !== 'quiz' && (
        <TreasureRevealModal treasures={game.pendingTreasures} onClose={game.closeTreasures} />
      )}
      {game.pendingEvolution && layer !== 'quiz' && (
        <EvolutionModal
          fromStage={game.pendingEvolution.from}
          toStage={game.pendingEvolution.to}
          equipped={rabbitQuery.data?.rabbit.equipped ?? {}}
          onClose={game.closeEvolution}
        />
      )}
      {game.pendingLap && (
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
