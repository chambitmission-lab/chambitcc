import { useState } from 'react'
import type { ElectionRound } from '../../../../types/election'
import { toLocalInputValue } from '../../../Election/electionShared'
import { ClosesAtNote } from '../../../Election/electionUi'
import { panelCls } from './boardStyles'
import { ClosesPicker } from './RoundOptions'
import { toIso } from './toIso'

// ── 예약 마감 ────────────────────────────────────────────────────────

export const SchedulePanel = ({
  round,
  pending,
  onChange,
}: {
  round: ElectionRound
  pending: boolean
  onChange: (closesAt: string | null) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(round.closes_at ? toLocalInputValue(new Date(round.closes_at)) : '')
  return (
    <section className={panelCls}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-extrabold text-ink-strong">자동 마감</h3>
        <button type="button" onClick={() => setEditing((v) => !v)} className="text-[12px] font-semibold text-ink-muted hover:text-brand">
          {editing ? '닫기' : '바꾸기'}
        </button>
      </div>
      <p className="mt-1 text-[13px] text-ink">
        {round.closes_at ? <ClosesAtNote closesAt={round.closes_at} /> : '정해 두지 않았어요 — 직접 마감을 눌러야 해요'}
      </p>
      {editing ? (
        <div className="mt-3 space-y-2">
          <ClosesPicker value={value} onChange={setValue} />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              onChange(toIso(value))
              setEditing(false)
            }}
            className="w-full py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold disabled:opacity-50"
          >
            {value ? '이 시각에 자동 마감' : '자동 마감 풀기'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
