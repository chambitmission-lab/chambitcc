// 60초 스피드 라운드 — 4색 타일, 콤보 배수, 떠오르는 점수. 채점은 서버(답마다 1회 요청).
import { useEffect, useRef, useState } from 'react'
import { answerLeagueRound } from '../../../api/bibleLeague'
import { useSfx } from '../../../hooks/useSfx'
import type { LeagueRoundStart } from '../../../types/bibleLeague'
import BmIcon from '../components/BluemarbleIcons'

const SHAPES = ['diamond', 'circle', 'triangle', 'square'] as const
const LETTERS = ['A', 'B', 'C', 'D']

const Shape = ({ kind }: { kind: (typeof SHAPES)[number] }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {kind === 'diamond' && <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />}
    {kind === 'circle' && <circle cx="12" cy="12" r="9.5" />}
    {kind === 'triangle' && <path d="M12 3 22 20.5H2Z" />}
    {kind === 'square' && <rect x="3" y="3" width="18" height="18" rx="3" />}
  </svg>
)

const mulOf = (combo: number) => (combo >= 4 ? 2 : combo >= 2 ? 1.5 : 1)

export default function SpeedRound({ round, onEnd }: { round: LeagueRoundStart; onEnd: (roundId: number) => void }) {
  const sfx = useSfx()
  const [left, setLeft] = useState(round.duration_sec)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answer, setAnswer] = useState<number | null>(null)
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [pop, setPop] = useState<{ id: number; v: number } | null>(null)
  const ended = useRef(false)
  const deadline = useRef(Date.now() + round.duration_sec * 1000)

  const q = round.questions[i]

  const finish = () => {
    if (ended.current) return
    ended.current = true
    onEnd(round.round_id)
  }

  // 남은 시간은 시작 시각 기준으로 계산 — 탭이 잠깐 가려져도 늘어나지 않게
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setLeft(s)
      if (s <= 0) {
        window.clearInterval(t)
        finish()
      }
    }, 250)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 문제를 다 풀면 바로 마감
  useEffect(() => {
    if (!q) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const choose = async (c: number) => {
    if (picked !== null || !q || ended.current) return
    setPicked(c)
    try {
      const r = await answerLeagueRound(round.round_id, q.id, c)
      setAnswer(r.correct_index)
      setCombo(r.combo)
      setScore(r.score)
      if (r.is_correct) {
        sfx.play('correct')
        setPop({ id: Date.now(), v: r.points })
      } else {
        sfx.play('wrong')
      }
      window.setTimeout(() => {
        setPicked(null)
        setAnswer(null)
        setI((n) => n + 1)
      }, r.is_correct ? 450 : 1000)
    } catch {
      // 시간 초과 등 — 라운드를 닫는다
      finish()
    }
  }

  if (!q) return <div className="ql-loading">결과를 모으는 중…</div>

  return (
    <div className="ql-round">
      <div className="ql-round-top">
        <div className="ql-timer">
          <span className="ql-timer-fill" style={{ width: `${(left / round.duration_sec) * 100}%` }} data-low={left <= 10 || undefined} />
        </div>
        <div className="ql-round-stats">
          <span className={`ql-sec ${left <= 10 ? 'is-low' : ''}`}>
            <BmIcon name="timer" size={16} /> {left}초
          </span>
          <span className={`ql-combo ${combo >= 2 ? 'is-hot' : ''}`} key={combo}>
            <BmIcon name="flame" size={15} /> 콤보 {combo} · ×{mulOf(combo)}
          </span>
          <span className="ql-score">
            {score.toLocaleString()}
            {pop && (
              <em key={pop.id} className="ql-pop">
                +{pop.v}
              </em>
            )}
          </span>
        </div>
      </div>

      <div className="ql-q" key={q.id}>
        <p className="ql-q-scene">{i + 1}번째 문제</p>
        <h2>{q.question}</h2>
      </div>

      <div className="ql-tiles">
        {q.choices.map((c, k) => {
          let st = ''
          if (answer !== null) st = k === answer ? 'is-answer' : k === picked ? 'is-wrong' : 'is-dim'
          else if (picked === k) st = 'is-picked'
          return (
            <button key={`${q.id}-${k}`} type="button" className={`ql-tile ql-tile--${k} ${st}`} onClick={() => choose(k)} disabled={picked !== null}>
              <Shape kind={SHAPES[k]} />
              <span className="ql-tile-text">{c}</span>
              <span className="ql-tile-key">{LETTERS[k]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
