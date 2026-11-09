import type { ElectionAdminDetail } from '../../../../types/election'
import { CandidateAvatar } from '../../../Election/electionUi'
import { panelCls } from './boardStyles'

// ── 당선자 ──────────────────────────────────────────────────────────────

export const ElectedPanel = ({ election }: { election: ElectionAdminDetail }) => {
  const elected = election.candidates.filter((c) => c.elected_round_no != null)
  if (!elected.length) return null
  return (
    <section className={panelCls}>
      <h3 className="text-[13.5px] font-extrabold text-ink-strong mb-2.5">
        당선 <span className="text-brand tabular-nums">{elected.length}</span>
        <span className="text-ink-muted font-semibold"> / {election.seats}명</span>
      </h3>
      <div className="space-y-2">
        {elected.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <CandidateAvatar candidate={c} size={36} />
            <span className="min-w-0 flex-1 text-[13.5px] font-bold text-ink-strong truncate">{c.name}</span>
            <span className="shrink-0 text-[11.5px] font-semibold text-ink-muted">{c.elected_round_no}차</span>
          </div>
        ))}
      </div>
    </section>
  )
}
