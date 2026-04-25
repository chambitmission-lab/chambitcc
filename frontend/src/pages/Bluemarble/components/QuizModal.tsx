import { useEffect, useState } from 'react'
import type { QuizPublic, AnswerResult } from '../../../types/bluemarble'

interface Props {
  quiz: QuizPublic
  onSubmit: (choiceIndex: number) => Promise<AnswerResult>
  onClose: () => void
}

const DIFFICULTY_LABEL = ['', '쉬움', '보통', '어려움']
const DIFFICULTY_COLOR = ['', 'text-green-600', 'text-amber-600', 'text-rose-600']

export default function QuizModal({ quiz, onSubmit, onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setSelected(null)
    setResult(null)
    setShowHint(false)
  }, [quiz.id])

  const handleSubmit = async () => {
    if (selected == null || submitting || result) return
    setSubmitting(true)
    try {
      const r = await onSubmit(selected)
      setResult(r)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bm-modal-backdrop" onClick={result ? onClose : undefined}>
      <div className="bm-quiz-modal" onClick={(e) => e.stopPropagation()}>
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
              onClick={() => setShowHint((v) => !v)}
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
            const isCorrect = result && i === result.correct_index
            const isWrongPick = result && isSelected && !result.is_correct
            return (
              <button
                key={i}
                type="button"
                className={`bm-quiz-choice ${
                  isSelected ? 'bm-quiz-choice-selected' : ''
                } ${isCorrect ? 'bm-quiz-choice-correct' : ''} ${
                  isWrongPick ? 'bm-quiz-choice-wrong' : ''
                }`}
                disabled={!!result || submitting}
                onClick={() => setSelected(i)}
              >
                <span className="bm-choice-letter">{['A', 'B', 'C', 'D'][i]}</span>
                <span className="bm-choice-text">{c}</span>
                {isCorrect && <span className="bm-choice-icon">✓</span>}
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
            <button type="button" className="bm-close-btn" onClick={onClose}>
              계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
