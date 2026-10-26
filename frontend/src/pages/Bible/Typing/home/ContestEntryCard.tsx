// 필사 허브 → 손글씨 필사대회 입구. 진행 중·발표된 대회가 있을 때만 뜬다(시작 전·지난 대회는 메뉴로).
import { useNavigate } from 'react-router-dom'
import { useContests } from '../../../../hooks/useHandwritingContest'
import { daysUntil } from '../../../HandwritingContest/contestFormat'

const QuillGlyph = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 4c-7 0-12.5 5-14 12l-1.5 4M20 4c0 6-3.5 10.5-9.5 11.5M20 4l-6 6" />
  </svg>
)

const ContestEntryCard = () => {
  const navigate = useNavigate()
  const { data } = useContests()
  const contest = data?.items.find((c) => c.phase === 'open') ?? data?.items.find((c) => c.phase === 'announced')
  if (!contest) return null
  const left = contest.phase === 'open' ? daysUntil(contest.ends_at) : 0
  const desc =
    contest.phase === 'open'
      ? `손으로 쓴 말씀에 한 표씩 · ${left === 0 ? '오늘 마감' : `D-${left}`} · ${contest.entry_count}작품`
      : '입상작이 발표됐어요 · 말씀카드로 만나보세요'
  return (
    <button type="button" className="bt-card bt-sprint-entry" onClick={() => navigate(`/handwriting/${contest.id}`)}>
      <span className="bt-sprint-entry__icon" aria-hidden>
        <QuillGlyph />
      </span>
      <span className="bt-sprint-entry__body">
        <span className="bt-sprint-entry__title">{contest.title}</span>
        <span className="bt-sprint-entry__desc">{desc}</span>
      </span>
      <span className="material-icons-round" aria-hidden>
        chevron_right
      </span>
    </button>
  )
}

export default ContestEntryCard
