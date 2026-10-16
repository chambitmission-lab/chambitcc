// 라운드 결과 — 점수·콤보·부서에 보탠 점수·순위 변화, 그리고 놓친 말씀 해설(깊게 읽는 자리).
import { useEffect, useState } from 'react'
import type { LeagueRoundResult, LeagueTeamOption } from '../../../types/bibleLeague'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import BmIcon from '../components/BluemarbleIcons'

interface Props {
  result: LeagueRoundResult
  team?: LeagueTeamOption
  triesLeft: number
  onHome: () => void
  onAgain: () => void
}

export default function RoundResult({ result, team, triesLeft, onHome, onAgain }: Props) {
  // 순위는 시작 순위에서 한 박자 쉬고 새 순위로 넘어간다
  const [rank, setRank] = useState(result.rank_before ?? result.rank_after)
  useEffect(() => {
    const t = window.setTimeout(() => setRank(result.rank_after), 700)
    return () => window.clearTimeout(t)
  }, [result.rank_after])
  const rose = result.rank_after != null && (result.rank_before == null || result.rank_after < result.rank_before)

  return (
    <div className="ql-result">
      <section className="ql-hero ql-result-hero">
        <p className="ql-kicker">라운드 끝!</p>
        <p className="ql-big">
          {result.score.toLocaleString()}
          <small>점</small>
        </p>
        <div className="ql-result-stats">
          <span>
            <b>{result.correct_count}</b>개 정답
          </span>
          <span>
            최고 콤보 <b>{result.max_combo}</b>
          </span>
          {team && (
            <span>
              {team.name}에 <b>+{result.score.toLocaleString()}</b>
            </span>
          )}
        </div>
        {rank != null && (
          <div className="ql-rank-move">
            {rose && <BmIcon name="star" size={18} />}
            <span>
              이번 주 <b key={rank} className="ql-rank-num">{rank}위</b>
              {result.rank_after != null && result.rank_after <= 3 ? ' · 메달권!' : ''}
            </span>
          </div>
        )}
        <p className="ql-hero-foot">이번 주 내 점수 {result.weekly_score.toLocaleString()}점</p>
      </section>

      <section className="ql-card">
        <p className="ql-card-title">
          <BmIcon name="book" size={17} /> 놓친 말씀 다시 보기
        </p>
        {result.missed.length === 0 ? (
          <p className="ql-empty">하나도 놓치지 않았어요. 발자취 여행에서 장면을 이어 걸어 볼까요?</p>
        ) : (
          result.missed.map((m) => (
            <article key={m.quiz_id} className="ql-missed">
              <p className="ql-missed-q">{m.question}</p>
              <p className="ql-missed-a">
                정답 <b>{m.answer}</b>
                {m.related_book && m.related_chapter
                  ? ` · ${canonicalBookName(m.related_book)} ${m.related_chapter}${m.related_verse ? `:${m.related_verse}` : ''}`
                  : ''}
              </p>
              {m.verse_text && <blockquote className="ql-missed-v">{m.verse_text}</blockquote>}
              {m.explanation && <p className="ql-missed-i">{m.explanation}</p>}
            </article>
          ))
        )}
      </section>

      <div className="ql-result-actions">
        {triesLeft > 0 && (
          <button type="button" className="ql-cta" onClick={onAgain}>
            한 번 더 · 남은 도전 {triesLeft}
          </button>
        )}
        <button type="button" className={triesLeft > 0 ? 'ql-ghost' : 'ql-cta'} onClick={onHome}>
          리그로 돌아가기
        </button>
      </div>
    </div>
  )
}
