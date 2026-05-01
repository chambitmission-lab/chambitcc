import { useEffect, useRef, useState } from 'react'
import type { QuizPublic, AnswerResult, BossState } from '../../../types/bluemarble'
import { useSfx } from '../../../hooks/useSfx'
import { useMyRabbit } from '../../../hooks/useRabbit'
import RabbitAvatar, { type RabbitMood } from '../../../components/rabbit/RabbitAvatar'
import '../../../components/rabbit/rabbit.css'

interface Props {
  quiz: QuizPublic
  onSubmit: (choiceIndex: number, elapsedMs: number) => Promise<AnswerResult>
  onClose: () => void
  // 보스 진행 상태 (이전 답변의 응답에서 넘어온 값). 첫 보스 문제는 null.
  bossState?: BossState | null
  // 보스 다음 문제로 진행. result.boss_state.in_boss 가 true 일 때 활성.
  onBossNext?: () => void
  // 보스 칸 진입 알림용 (제목 헤더에 표시)
  isBoss?: boolean
  bossTitle?: string
}

const DIFFICULTY_LABEL = ['', '쉬움', '보통', '어려움']
const DIFFICULTY_COLOR = ['', 'text-green-600', 'text-amber-600', 'text-rose-600']

const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => i)
const CONFETTI_EMOJI = ['✨', '🎉', '⭐', '💫', '🌟', '🕊️']

const TIMER_DURATION_MS = 15000  // 15초 제한
const TIME_BONUS_THRESHOLD_MS = 10000
const TIME_PERFECT_MS = 5000

export default function QuizModal({
  quiz,
  onSubmit,
  onClose,
  bossState,
  onBossNext,
  isBoss,
  bossTitle,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [remainingMs, setRemainingMs] = useState(TIMER_DURATION_MS)
  const sfx = useSfx()
  const playedResultRef = useRef(false)
  const startTimeRef = useRef<number>(Date.now())
  const tickRef = useRef<number | null>(null)
  const rabbitQuery = useMyRabbit(true)
  const rabbit = rabbitQuery.data?.rabbit
  const companionMood: RabbitMood = result
    ? result.is_correct
      ? 'excited'
      : 'sad'
    : selected != null
    ? 'happy'
    : 'idle'

  // quiz가 바뀌면 모든 상태 리셋 + 타이머 시작
  useEffect(() => {
    setSelected(null)
    setResult(null)
    setShowHint(false)
    setRemainingMs(TIMER_DURATION_MS)
    playedResultRef.current = false
    startTimeRef.current = Date.now()

    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
    }
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const left = Math.max(0, TIMER_DURATION_MS - elapsed)
      setRemainingMs(left)
      if (left <= 0 && tickRef.current != null) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
    }, 100)

    return () => {
      if (tickRef.current != null) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [quiz.id])

  // 결과가 들어오면 한 번만 효과음 재생 + 타이머 정지
  useEffect(() => {
    if (!result || playedResultRef.current) return
    playedResultRef.current = true
    sfx.play(result.is_correct ? 'correct' : 'wrong')
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [result, sfx])

  // 시간 만료 시 자동 제출 (선택지 없으면 0번 선택)
  useEffect(() => {
    if (remainingMs > 0 || result || submitting) return
    const idx = selected ?? 0
    void doSubmit(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs])

  const handleSelect = (i: number) => {
    if (result || submitting) return
    if (selected !== i) sfx.play('select')
    setSelected(i)
  }

  const handleHintToggle = () => {
    if (!showHint) sfx.play('hint')
    else sfx.play('click')
    setShowHint((v) => !v)
  }

  const doSubmit = async (idx: number) => {
    if (submitting || result) return
    sfx.play('submit')
    setSubmitting(true)
    const elapsed = Math.min(TIMER_DURATION_MS, Date.now() - startTimeRef.current)
    try {
      const r = await onSubmit(idx, elapsed)
      setResult(r)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (selected == null) return
    await doSubmit(selected)
  }

  const handleClose = () => {
    sfx.play('click')
    onClose()
  }

  const handleNext = () => {
    sfx.play('click')
    onBossNext?.()
  }

  const isCorrect = !!result?.is_correct
  const isWrong = !!result && !result.is_correct
  const remSec = Math.ceil(remainingMs / 1000)

  // 보스 진행 정보: 응답에서 받은 boss_state (있으면) 또는 이전 답변 후 넘어온 bossState prop
  const activeBoss = result?.boss_state ?? bossState ?? null
  const bossInProgress = !!activeBoss?.in_boss
  const bossComplete = !!activeBoss?.boss_complete
  // 진행도 표시: 결과 직후엔 result에서, 결과 전엔 (이전) bossState 또는 isBoss prop으로 1/total 표시
  const displayBoss = activeBoss
    ? activeBoss
    : isBoss
    ? { in_boss: true, boss_total: 5, boss_index: 0, boss_correct: 0, boss_complete: false, boss_clear_bonus: 0, is_perfect: false } as BossState
    : null

  const modalClass = [
    'bm-quiz-modal',
    isCorrect && 'bm-quiz-modal-correct',
    isWrong && 'bm-quiz-modal-wrong',
    !!displayBoss && 'bm-quiz-modal-boss',
  ]
    .filter(Boolean)
    .join(' ')

  // 시간 보너스 라벨 (실시간 표시)
  const timeBonusLabel =
    remainingMs >= TIMER_DURATION_MS - TIME_PERFECT_MS
      ? '+50% 시간보너스!'
      : remainingMs >= TIMER_DURATION_MS - TIME_BONUS_THRESHOLD_MS
      ? '+20% 시간보너스'
      : null

  return (
    <div className="bm-modal-backdrop">
      <div className={modalClass} onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <div className="quiz-companion">
          <RabbitAvatar
            stage={rabbit?.stage ?? 1}
            equipped={rabbit?.equipped ?? {}}
            mood={companionMood}
            size={64}
          />
        </div>
        {isCorrect && (
          <div className="bm-confetti" aria-hidden="true">
            {CONFETTI_PIECES.map((i) => (
              <span
                key={i}
                className="bm-confetti-piece"
                style={{
                  left: `${(i * 100) / CONFETTI_PIECES.length}%`,
                  animationDelay: `${(i % 6) * 0.08}s`,
                  animationDuration: `${1.4 + (i % 5) * 0.18}s`,
                }}
              >
                {CONFETTI_EMOJI[i % CONFETTI_EMOJI.length]}
              </span>
            ))}
          </div>
        )}

        {/* 보스 헤더 (보스 칸일 때만 표시) */}
        {displayBoss && (
          <div className="bm-quiz-boss-header">
            <span className="bm-quiz-boss-icon">⚔️</span>
            <span className="bm-quiz-boss-label">
              {bossTitle ? `보스 도전: ${bossTitle}` : '보스 도전'}
            </span>
            <span className="bm-quiz-boss-progress">
              {Math.max(1, displayBoss.boss_index || 1)} / {displayBoss.boss_total}
            </span>
            <div className="bm-quiz-boss-hearts">
              {Array.from({ length: displayBoss.boss_total }).map((_, i) => {
                const cleared = i < (displayBoss.boss_index || 0)
                const wasCorrect = i < (displayBoss.boss_correct || 0)
                return (
                  <span
                    key={i}
                    className={`bm-quiz-boss-heart ${
                      cleared ? (wasCorrect ? 'is-hit' : 'is-miss') : ''
                    }`}
                  >
                    {cleared ? (wasCorrect ? '✦' : '✗') : '○'}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* 타이머 바 */}
        {!result && (
          <div className="bm-quiz-timer">
            <div className="bm-quiz-timer-track">
              <div
                className={`bm-quiz-timer-fill ${
                  remainingMs <= 3000
                    ? 'is-danger'
                    : remainingMs <= 7000
                    ? 'is-warn'
                    : 'is-ok'
                }`}
                style={{
                  width: `${Math.max(0, (remainingMs / TIMER_DURATION_MS) * 100)}%`,
                }}
              />
            </div>
            <div className="bm-quiz-timer-meta">
              <span className="bm-quiz-timer-sec">⏱ {remSec}초</span>
              {timeBonusLabel && (
                <span className="bm-quiz-timer-bonus">{timeBonusLabel}</span>
              )}
            </div>
          </div>
        )}

        <div className="bm-quiz-header">
          <span className="bm-quiz-cat">{quiz.category === 'OLD' ? '구약' : quiz.category === 'NEW' ? '신약' : '일반'}</span>
          <span className={`bm-quiz-diff ${DIFFICULTY_COLOR[quiz.difficulty]}`}>
            난이도: {DIFFICULTY_LABEL[quiz.difficulty] ?? '?'}
          </span>
          <span className="bm-quiz-points">+{quiz.points}pt</span>
        </div>

        <h3 className="bm-quiz-question">{quiz.question}</h3>

        {quiz.hint && (
          <div className="bm-quiz-hint-row">
            <button
              type="button"
              className="bm-quiz-hint-btn"
              onClick={handleHintToggle}
              disabled={!!result}
            >
              💡 힌트 {showHint ? '숨기기' : '보기'}
            </button>
            {showHint && <span className="bm-quiz-hint-text">{quiz.hint}</span>}
          </div>
        )}

        <div className="bm-quiz-choices">
          {quiz.choices.map((c, i) => {
            const isSelected = selected === i
            const isChoiceCorrect = result && i === result.correct_index
            const isWrongPick = result && isSelected && !result.is_correct
            return (
              <button
                key={i}
                type="button"
                className={`bm-quiz-choice ${
                  isSelected ? 'bm-quiz-choice-selected' : ''
                } ${isChoiceCorrect ? 'bm-quiz-choice-correct' : ''} ${
                  isWrongPick ? 'bm-quiz-choice-wrong' : ''
                }`}
                disabled={!!result || submitting}
                onClick={() => handleSelect(i)}
              >
                <span className="bm-choice-letter">{['A', 'B', 'C', 'D'][i]}</span>
                <span className="bm-choice-text">{c}</span>
                {isChoiceCorrect && <span className="bm-choice-icon">✓</span>}
                {isWrongPick && <span className="bm-choice-icon">✗</span>}
              </button>
            )
          })}
        </div>

        {!result ? (
          <button
            type="button"
            className="bm-submit-btn"
            disabled={selected == null || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '확인 중...' : '제출'}
          </button>
        ) : (
          <div className={`bm-result ${result.is_correct ? 'bm-result-correct' : 'bm-result-wrong'}`}>
            <div className="bm-result-headline">
              {result.is_correct ? '🎉 정답!' : '아쉬워요'}
              {result.score_delta > 0 && (
                <span className="bm-result-points"> +{result.score_delta}pt</span>
              )}
            </div>

            {/* 콤보/타임 보너스 디테일 */}
            {result.is_correct && (result.streak_multiplier > 1 || result.time_bonus_ratio > 0 || result.streak >= 3) && (
              <div className="bm-result-bonuses">
                {result.streak_multiplier > 1 && (
                  <span className="bm-bonus-chip bm-bonus-combo">
                    🔥 콤보 ×{result.streak_multiplier}
                  </span>
                )}
                {result.time_bonus_ratio > 0 && (
                  <span className="bm-bonus-chip bm-bonus-time">
                    ⚡ 시간보너스 +{Math.round(result.time_bonus_ratio * 100)}%
                  </span>
                )}
                {result.streak >= 3 && (
                  <span className="bm-bonus-chip bm-bonus-streak">
                    ✨ {result.streak}연속!
                  </span>
                )}
              </div>
            )}

            {result.explanation && (
              <p className="bm-result-explanation">{result.explanation}</p>
            )}
            {result.related_verse_text && (
              <blockquote className="bm-result-verse">
                "{result.related_verse_text}"
              </blockquote>
            )}

            {bossInProgress && onBossNext ? (
              <button type="button" className="bm-submit-btn bm-next-boss-btn" onClick={handleNext}>
                다음 문제로 →
              </button>
            ) : bossComplete ? (
              <button type="button" className="bm-close-btn" onClick={handleClose}>
                결과 보기 ({activeBoss?.boss_correct}/{activeBoss?.boss_total} 정답)
              </button>
            ) : (
              <button type="button" className="bm-close-btn" onClick={handleClose}>
                계속하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
