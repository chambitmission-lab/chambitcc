// 홈 선거 배너 — 내가 선거인이고 지금 투표할 수 있는 선거가 있을 때만 뜬다.
// 선거는 메뉴에 없다(명부 밖 성도에게는 빈 화면이라) — 이 배너가 선거인의 입구다.
// 투표하면 can_vote 가 꺼지므로(투표 시 목록 쿼리 무효화) 자연히 사라진다.
import { useNavigate } from 'react-router-dom'
import { useElections } from '../../../hooks/useElections'
import { isAuthenticated } from '../../../utils/auth'
import { preloadRoute } from '../../../utils/routePreload'
import { BallotIcon } from '../../Election/electionIcons'

const ElectionBanner = () => {
  const navigate = useNavigate()
  const { data } = useElections(isAuthenticated())

  const election = data?.find((e) => e.can_vote)
  if (!election) return null

  const path = `/elections/${election.id}`
  return (
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate(path)}
        onMouseEnter={() => void preloadRoute(path)}
        onTouchStart={() => void preloadRoute(path)}
        className="w-full text-left rounded-2xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-3.5 flex items-center gap-3 transition-transform active:scale-[0.99]"
      >
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.08] text-brand flex items-center justify-center">
          <BallotIcon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-brand uppercase">VOTE</span>
            <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-white/[0.1] text-brand">
              {election.current_round_no}차 투표 중
            </span>
          </div>
          <p className="text-[14.5px] font-bold text-ink-strong truncate">{election.title}</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            선거인으로 등록되셨어요 · 지금 투표해 주세요
          </p>
        </div>

        <span className="shrink-0 text-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
      </button>
    </section>
  )
}

export default ElectionBanner
