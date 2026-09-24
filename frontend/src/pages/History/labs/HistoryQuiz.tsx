import { useState } from 'react'
import { QUIZ, quizTitleOf } from './labData'

const KEYS = ['가', '나', '다', '라']

/** ⑤ 참빛 역사 퀴즈 — 4지선다 5문제, 틀려도 해설로 이야기를 알려준다 */
export default function HistoryQuiz() {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [marks, setMarks] = useState<boolean[]>([])

  const score = marks.filter(Boolean).length
  const done = qi >= QUIZ.length

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    setMarks((prev) => [...prev, i === QUIZ[qi].answer])
  }

  const next = () => {
    setPicked(null)
    setQi((v) => v + 1)
  }

  const restart = () => {
    setQi(0)
    setPicked(null)
    setMarks([])
  }

  const progress = (
    <div className="hlab-q-prog" aria-hidden="true">
      {QUIZ.map((_, i) => (
        <i key={i} className={marks[i] === true ? 'is-right' : marks[i] === false ? 'is-wrong' : ''} />
      ))}
    </div>
  )

  if (done) {
    return (
      <div className="hlab-card hlab-quiz">
        {progress}
        <div className="hlab-q-end">
          <div className="hlab-q-score">
            {score}/{QUIZ.length}
          </div>
          <h3>칭호: {quizTitleOf(score, QUIZ.length)}</h3>
          <p>
            {score === QUIZ.length
              ? '완벽해요! 참빛의 역사를 누구보다 잘 아시네요.'
              : '해설에서 새로 알게 된 이야기가 있으셨나요?'}
          </p>
          <button type="button" className="hlab-btn hlab-btn--primary" onClick={restart}>
            다시 풀기
          </button>
        </div>
      </div>
    )
  }

  const item = QUIZ[qi]
  const answered = picked !== null
  const correct = picked === item.answer

  return (
    <div className="hlab-card hlab-quiz">
      {progress}
      <div key={qi}>
        <p className="hlab-q-num">문제 {qi + 1}</p>
        <h3 className="hlab-q-text">{item.q}</h3>
        <div className="hlab-q-opts">
          {item.options.map((o, i) => {
            const state = !answered
              ? ''
              : i === item.answer
                ? ' is-right'
                : i === picked
                  ? ' is-wrong'
                  : ''
            return (
              <button
                key={o}
                type="button"
                className={`hlab-q-opt${state}`}
                disabled={answered}
                onClick={() => choose(i)}
              >
                <span className="hlab-q-key">{KEYS[i]}</span>
                {o}
              </button>
            )
          })}
        </div>

        {answered && (
          <>
            <div className="hlab-q-ans" role="status">
              <b>{correct ? '정답이에요!' : '아쉬워요, 정답은 이거예요'}</b>
              {item.explain}
            </div>
            <button type="button" className="hlab-btn hlab-btn--primary hlab-q-next" onClick={next}>
              {qi === QUIZ.length - 1 ? '결과 보기' : '다음 문제'} ▶
            </button>
          </>
        )}
      </div>
    </div>
  )
}
