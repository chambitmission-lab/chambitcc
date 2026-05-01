import { useEffect, useRef, useState } from 'react'
import type { QuizPublic, AnswerResult } from '../../../types/bluemarble'
import { useSfx } from '../../../hooks/useSfx'

interface Props {
  quiz: QuizPublic
  onSubmit: (choiceIndex: number) => Promise<AnswerResult>
  onClose: () => void
}

const DIFFICULTY_LABEL = ['', '쉬움', '보통', '어려움']
const DIFFICULTY_COLOR = ['', 'text-green-600', 'text-amber-600', 'text-rose-600']

const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => i)
const CONFETTI_EMOJI = ['✨', '🎉', '⭐', '💫', '🌟', '🕊️']

export default function QuizModal({ quiz, onSubmit, onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const sfx = useSfx()
  const playedResultRef = useRef(false)

  useEffect(() => {
    setSelected(null)
    setResult(null)
    setShowHint(false)
    playedResultRef.current = false
  }, [quiz.id])

  // 결과가 들어오면 한 번만 효과음 재생
  useEffect(() => {
    if (!result || playedResultRef.current) return
    playedResultRef.current = true
    sfx.play(result.is_correct ? 'correct' : 'wrong')
  }, [result, sfx])

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

  const handleSubmit = async () => {
    if (selected == null || submitting || result) return
    sfx.play('submit')
    setSubmitting(true)
    try {
      const r = await onSubmit(selected)
      setResult(r)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    sfx.play('click')
    onClose()
  }

  const isCorrect = !!result?.is_correct
  const isWrong = !!result && !result.is_correct

  const modalClass = [
    'bm-quiz-modal',
    isCorrect && 'bm-quiz-modal-correct',
    isWrong && 'bm-quiz-modal-wrong',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="bm-modal-backdrop">
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
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
            {result.explanation && (
              <p className="bm-result-explanation">{result.explanation}</p>
            )}
            {result.related_verse_text && (
              <blockquote className="bm-result-verse">
                "{result.related_verse_text}"
              </blockquote>
            )}
            <button type="button" className="bm-close-btn" onClick={handleClose}>
              계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
