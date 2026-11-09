import { useState } from 'react'
import type { ElectionAdminDetail } from '../../../../types/election'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { ghostBtn, panelCls } from './boardStyles'

// ── 아직 투표하지 않은 선거인 ───────────────────────────────────────────

export const WaitingPanel = ({
  election,
  pending,
  onRemind,
}: {
  election: ElectionAdminDetail
  pending: boolean
  onRemind: () => void
}) => {
  const waiting = election.voters.filter((v) => !v.has_voted)
  const [open, setOpen] = useState(false)
  const remind = async () => {
    const ok = await confirmDialog({
      title: '미투표자에게 알림을 보낼까요?',
      message: `아직 투표하지 않은 앱 선거인 ${waiting.length}명에게 "아직 투표하지 않으셨어요" 알림이 가요.`,
      description: '같은 알림은 10분에 한 번만 보낼 수 있어요.',
      confirmText: '알림 보내기',
      tone: 'brand',
    })
    if (ok) onRemind()
  }
  return (
    <section className={panelCls}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <h3 className="text-[13.5px] font-extrabold text-ink-strong">
            아직 투표 안 한 선거인 <span className="text-brand tabular-nums">{waiting.length}</span>명
          </h3>
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="shrink-0 text-[12px] font-semibold text-ink-muted">
          {open ? '접기' : '이름 보기'}
        </button>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        투표 여부만 알 수 있어요. 누구를 골랐는지는 어디에도 남지 않아요.
      </p>
      {waiting.length ? (
        <button type="button" onClick={() => void remind()} disabled={pending} className={`mt-2.5 w-full ${ghostBtn}`}>
          미투표자에게 알림 보내기
        </button>
      ) : null}
      {open ? (
        waiting.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {waiting.map((v) => (
              <span key={v.user_id} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12.5px] font-semibold text-ink">
                {v.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">앱 선거인 모두 투표했어요</p>
        )
      ) : null}
    </section>
  )
}
