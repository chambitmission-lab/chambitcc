import { useNavigate } from 'react-router-dom'
import { PLACES, placeLabel } from '../data/places'
import type { MapQuiz } from '../useMapQuiz'

interface QuizPanelProps {
  quiz: MapQuiz
  color: string
}

/**
 * 지도 퀴즈 패널 — 지도 아래에 붙어 문제·정답·해설을 차례로 보여 준다.
 *
 * 답은 이 패널이 아니라 지도의 핀을 눌러 고른다. 보기를 글로 늘어놓으면
 * 결국 또 읽기가 되고, 지도로 답하게 해야 위치가 기억에 남는다.
 */
const QuizPanel = ({ quiz, color }: QuizPanelProps) => {
  const navigate = useNavigate()

  if (quiz.done) {
    const total = quiz.questions.length
    const perfect = quiz.correctCount === total
    return (
      <div className="atl-quiz atl-quiz--done">
        <p className="atl-quiz__score" style={{ color }}>
          {quiz.correctCount} / {total}
        </p>
        <p className="atl-quiz__result">
          {perfect
            ? '전부 맞혔어요. 이제 이 길은 눈에 익었네요.'
            : '틀린 곳은 핀을 눌러 다시 읽어 보면 훨씬 오래 남아요.'}
        </p>
        <div className="atl-quiz__actions">
          <button
            type="button"
            className="atl-quiz__again"
            style={{ background: color }}
            onClick={quiz.start}
          >
            한 번 더
          </button>
          <button type="button" className="atl-quiz__close" onClick={quiz.stop}>
            그만하기
          </button>
        </div>
      </div>
    )
  }

  const question = quiz.current
  if (!question) return null

  const answered = quiz.picked != null
  const correct = quiz.picked === question.answer
  const answerPlace = PLACES[question.answer]
  const pickedPlace = quiz.picked ? PLACES[quiz.picked] : undefined

  return (
    <div className="atl-quiz">
      <div className="atl-quiz__head">
        <span className="atl-quiz__step" style={{ color }}>
          {quiz.index + 1} / {quiz.questions.length}
        </span>
        <button type="button" className="atl-quiz__quit" onClick={quiz.stop}>
          그만하기
        </button>
      </div>

      <p className="atl-quiz__prompt">{question.prompt}</p>

      {!answered ? (
        <p className="atl-quiz__hint">
          <span className="material-icons-round text-[15px]">touch_app</span>
          지도에서 반짝이는 핀 세 곳 중 하나를 눌러 보세요
        </p>
      ) : (
        <div className="atl-quiz__reveal">
          <p
            className={`atl-quiz__verdict${correct ? ' atl-quiz__verdict--ok' : ''}`}
            style={correct ? { color } : undefined}
          >
            <span className="material-icons-round text-[18px]">
              {correct ? 'check_circle' : 'cancel'}
            </span>
            {correct
              ? `맞아요 — ${answerPlace ? placeLabel(answerPlace) : ''}`
              : `${pickedPlace ? placeLabel(pickedPlace) : ''}이 아니라 ${
                  answerPlace ? placeLabel(answerPlace) : ''
                }이에요`}
          </p>

          {/* 해설은 깊이 있게 — 그 장소가 어떤 곳이었는지까지 */}
          {answerPlace && <p className="atl-quiz__explain">{answerPlace.blurb}</p>}

          <div className="atl-quiz__actions">
            <button
              type="button"
              className="atl-quiz__ref"
              onClick={() =>
                navigate(
                  `/bible/${question.ref.book}/${question.ref.chapter}${
                    question.ref.verse ? `?verse=${question.ref.verse}` : ''
                  }`
                )
              }
            >
              <span className="material-icons-round text-[15px]">menu_book</span>
              {question.ref.label}
            </button>
            <button
              type="button"
              className="atl-quiz__next"
              style={{ background: color }}
              onClick={quiz.next}
            >
              {quiz.index + 1 === quiz.questions.length ? '결과 보기' : '다음 문제'}
              <span className="material-icons-round text-[17px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizPanel
