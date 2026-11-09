import { useState } from 'react'
import { useElectionAudit } from '../../../../hooks/useElections'
import { panelCls } from './boardStyles'

// ── 운영 기록 ──────────────────────────────────────────────────────────

export const AuditPanel = ({ electionId }: { electionId: number }) => {
  const [open, setOpen] = useState(false)
  const { data: logs, isLoading } = useElectionAudit(electionId, open)
  return (
    <section className={panelCls}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <h3 className="text-[13.5px] font-extrabold text-ink-strong">운영 기록</h3>
        <span className="text-[12px] font-semibold text-ink-muted">{open ? '접기' : '펼치기'}</span>
      </button>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        누가 언제 시작·마감·되돌리기·종이 표·교부를 했는지 남아요. 앱 투표는 기록하지 않아요.
      </p>
      {open ? (
        isLoading ? (
          <p className="mt-2.5 text-[12.5px] text-ink-muted">불러오는 중…</p>
        ) : logs?.length ? (
          <ol className="mt-2.5 max-h-64 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="text-[12.5px] leading-snug">
                <p className="text-ink break-keep">{log.summary}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted tabular-nums">
                  {new Date(log.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {log.actor_name}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2.5 text-[12.5px] text-ink-muted">아직 기록이 없어요</p>
        )
      ) : null}
    </section>
  )
}
