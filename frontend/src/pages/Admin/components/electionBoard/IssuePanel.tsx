import { useState } from 'react'
import type { ElectionAdminDetail } from '../../../../types/election'
import { panelCls } from './boardStyles'

// ── 현장 접수 · 투표용지 교부 ───────────────────────────────────────────

export const IssuePanel = ({
  election,
  pending,
  onIssue,
  onCancel,
  togetherCount = 0,
}: {
  election: ElectionAdminDetail
  pending: boolean
  onIssue: (userId: number) => void
  onCancel: (userId: number) => void
  /** 같은 공동의회에서 지금 함께 열려 있는 투표 수 — 2 이상이면 교부 한 번에 모두 교부한다 */
  togetherCount?: number
}) => {
  const [q, setQ] = useState('')
  const issued = election.voters.filter((v) => v.paper_issued)
  const matches = q.trim()
    ? election.voters.filter((v) => v.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : []
  return (
    <section className={panelCls}>
      <h3 className="text-[13.5px] font-extrabold text-ink-strong">
        현장 접수 · 투표용지 교부 <span className="text-brand tabular-nums">{issued.length}</span>
      </h3>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        앱 명부에 있는 분이 종이로 투표하면 이름을 찾아 교부를 누르세요. 앱으로 이미 투표한 분은 막아 드려요.
        {togetherCount > 1
          ? ` 지금 함께 열린 투표 ${togetherCount}개에 한 번에 교부돼요(그분이 선거인인 선거만). 되돌리기는 선거마다 따로 해요.`
          : ''}
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="이름으로 찾기"
        className="mt-2.5 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong focus:outline-none focus:border-brand"
      />
      {matches.length ? (
        <div className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.05]">
          {matches.map((v) => (
            <div key={v.user_id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink-strong truncate">{v.name}</span>
              {v.paper_issued ? (
                <button type="button" disabled={pending} onClick={() => onCancel(v.user_id)} className="shrink-0 text-[12px] font-semibold text-ink-muted hover:text-red-500">
                  교부함 · 되돌리기
                </button>
              ) : v.has_voted ? (
                <span className="shrink-0 text-[12px] font-bold text-red-500">앱으로 투표함 · 교부 불가</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    onIssue(v.user_id)
                    setQ('')
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-brand text-white text-[12.5px] font-bold disabled:opacity-50"
                >
                  {togetherCount > 1 ? `교부 (${togetherCount}개 모두)` : '교부'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : q.trim() ? (
        <p className="mt-2 text-[12.5px] text-ink-muted">명부에 없는 이름이에요 — 앱을 안 쓰는 선거인이면 교부 없이 종이 표만 넣으면 돼요.</p>
      ) : null}
      {issued.length ? (
        <p className="mt-2.5 text-[12px] text-ink-muted break-keep">
          교부: {issued.map((v) => v.name).join(', ')}
        </p>
      ) : null}
    </section>
  )
}
