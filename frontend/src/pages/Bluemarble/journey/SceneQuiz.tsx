// 장면 카드 — 양피지 위 한 문제. 고르는 즉시 채점되고, 도장·구절·해설이 이어진다.
// 보스 칸이면 5문제 연속(진행 점 표시), 마지막 답 뒤엔 보스 클리어 모달로 넘어간다.
import { useEffect, useRef, useState } from 'react'
import { useSfx } from '../../../hooks/useSfx'
import type { AnswerResult, BossState, QuizPublic, Tile } from '../../../types/bluemarble'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import BmIcon from '../components/BluemarbleIcons'

const LETTERS = ['A', 'B', 'C', 'D']

interface Props {
  quiz: QuizPublic
  tile: Tile | null
  isBoss: boolean
  bossState: BossState | null
  onSubmit: (choiceIndex: number, elapsedMs: number) => Promise<AnswerResult>
  onClose: () => void
  onBossNext: () => void
}

const refOf = (q: QuizPublic) => {
  if (!q.related_book || !q.related_chapter) return ''
  const book = canonicalBookName(q.related_book)
  return `${book} ${q.related_chapter}${q.related_verse ? `:${q.related_verse}` : ''}`
}

export default function SceneQuiz({ quiz, tile: tileProp, isBoss: isBossProp, bossState, onSubmit, onClose, onBossNext }: Props) {
  const sfx = useSfx()
  // 채점 뒤 상태가 새로 고쳐지며 pending 칸이 바뀌어도 카드 머리는 문제를 열 때의 장면으로 고정
  const [{ tile, isBoss }, setFrame] = useState({ tile: tileProp, isBoss: isBossProp })
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState(false)
  const shownAt = useRef(Date.now())

  // 보스 다음 문제로 바뀌면 카드 상태를 처음으로
  useEffect(() => {
    setFrame({ tile: tileProp, isBoss: isBossProp })
    setPicked(null)
    setResult(null)
    setHint(false)
    shownAt.current = Date.now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id])

  const choose = async (i: number) => {
    if (busy || result) return
    sfx.play('select')
    setPicked(i)
    setBusy(true)
    try {
      setResult(await onSubmit(i, Date.now() - shownAt.current))
    } catch {
      setPicked(null)
    } finally {
      setBusy(false)
    }
  }

  const boss = result?.boss_state ?? bossState
  const bossTotal = boss?.boss_total ?? 5
  const bossDone = result ? boss?.boss_index ?? 0 : Math.max(0, boss?.boss_index ?? 0)
  const bossContinues = !!result?.boss_state?.in_boss && !result.boss_state.boss_complete
  const correct = !!result?.is_correct
  const ref = refOf(quiz)

  const chips: string[] = []
  if (result && correct) {
    if (result.streak_multiplier > 1) chips.push(`콤보 ×${result.streak_multiplier}`)
    if (result.time_bonus > 0) chips.push(`차분히 읽은 보너스 +${result.time_bonus}`)
    if (result.streak_flat_bonus > 0) chips.push(`연속 정답 +${result.streak_flat_bonus}`)
  }

  return (
    <div className="qj-scrim">
      <div className={`qj-scene ${isBoss ? 'is-boss' : ''}`} role="dialog" aria-modal="true" aria-label={tile?.title ?? '장면 문제'}>
        <div className="qj-scene-head">
          <span className="qj-scene-place">{isBoss ? '보스 도전' : tile?.phase ?? '발자취'}</span>
          <h3>{tile?.title ?? '말씀 장면'}</h3>
          {isBoss && (
            <div className="qj-boss-dots" aria-label={`보스 ${bossDone}/${bossTotal}`}>
              {Array.from({ length: bossTotal }).map((_, i) => (
                <span key={i} className={i < bossDone ? 'is-done' : i === bossDone && !result ? 'is-now' : ''} />
              ))}
            </div>
          )}
        </div>

        <p className="qj-scene-q">{quiz.question}</p>

        <div className="qj-scene-choices">
          {quiz.choices.map((c, i) => {
            let st = ''
            if (result) st = i === result.correct_index ? 'is-answer' : i === picked ? 'is-wrong' : 'is-dim'
            else if (busy && i === picked) st = 'is-picked'
            return (
              <button key={`${quiz.id}-${i}`} type="button" className={`qj-choice ${st}`} onClick={() => choose(i)} disabled={busy || !!result}>
                <span>{LETTERS[i]}</span>
                {c}
              </button>
            )
          })}
        </div>

        {!result && quiz.hint && (
          <button type="button" className="qj-hint-btn" onClick={() => setHint((v) => !v)}>
            <BmIcon name="bulb" size={15} /> {hint ? quiz.hint : '힌트 보기'}
          </button>
        )}

        {result && (
          <div className="qj-reveal">
            <div className={`qj-stamp ${correct ? 'is-ok' : 'is-no'}`}>{correct ? `+${result.score_delta}` : '다시 와요'}</div>
            {result.related_verse_text && (
              <figure>
                <blockquote>{result.related_verse_text}</blockquote>
                {ref && <figcaption>{ref}</figcaption>}
              </figure>
            )}
            {result.explanation && <p className="qj-insight">{result.explanation}</p>}
            {!correct && <p className="qj-insight qj-insight--soft">이 칸은 다음 걸음에 새 문제로 다시 열려요.</p>}
            {chips.length > 0 && (
              <div className="qj-chips">
                {chips.map((c) => (
                  <span key={c}>{c}</span>
                ))}
                {result.grace_event && <span className="is-grace">은혜의 순간 ×2</span>}
              </div>
            )}
            <button
              type="button"
              className="qj-go"
              onClick={() => {
                sfx.play('click')
                if (bossContinues) onBossNext()
                else onClose()
              }}
            >
              {bossContinues ? `다음 보스 문제 (${(result.boss_state?.boss_index ?? 0) + 1}/${bossTotal})` : correct ? '다음 장면으로' : '지도로 돌아가기'}
              <BmIcon name="footprints" size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
