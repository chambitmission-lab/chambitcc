import { useState } from 'react'
import type { ElectionAdminDetail, OpenRoundPayload } from '../../../../types/election'
import { CandidateAvatar } from '../../../Election/electionUi'
import { Stepper } from '../SeatEventComposer'
import { panelCls } from './boardStyles'
import { ClosesPicker, Toggle } from './RoundOptions'
import { toIso } from './toIso'

// ── 다음 회차 열기 ──────────────────────────────────────────────────────

export const RunoffPanel = ({
  election,
  practice,
  onOpen,
  pending,
}: {
  election: ElectionAdminDetail
  practice: boolean
  onOpen: (data: OpenRoundPayload) => void
  pending: boolean
}) => {
  const nextNo = election.rounds.length + 1
  const pool = election.candidates.filter((c) => c.elected_round_no == null)
  const lastResult = election.rounds[election.rounds.length - 1]?.result
  const votesOf = (cid: number) => lastResult?.tallies.find((t) => t.candidate_id === cid)?.votes

  const [picked, setPicked] = useState<Set<number>>(
    new Set(election.runoff_suggestion.length ? election.runoff_suggestion : pool.map((c) => c.id))
  )
  const autoMax = Math.max(1, Math.min(election.rules.max_select ?? election.seats_left, election.seats_left, picked.size || 1))
  const [maxSelect, setMaxSelect] = useState<number | null>(null)
  const effectiveMax = Math.min(maxSelect ?? autoMax, Math.max(picked.size, 1))
  const [notify, setNotify] = useState(!practice)
  const [closes, setCloses] = useState('')

  const toggle = (cid: number) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(cid)) next.delete(cid)
      else next.add(cid)
      return next
    })

  return (
    <section className={`${panelCls} ring-1 ring-[var(--brand-soft-strong)]`}>
      <h3 className="text-[13.5px] font-extrabold text-ink-strong">
        {nextNo}차 투표 — 남은 자리 <span className="text-brand tabular-nums">{election.seats_left}</span>명
      </h3>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        규칙이 고른 후보가 미리 선택돼 있어요. 눌러서 넣고 뺄 수 있어요. 선거인 명부는 그대로 이어져요.
      </p>
      <div className="mt-3 space-y-1.5">
        {pool.map((c) => {
          const on = picked.has(c.id)
          const votes = votesOf(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-colors ${
                on ? 'border-brand bg-[var(--brand-soft)]' : 'border-gray-200 dark:border-white/[0.08] opacity-60'
              }`}
            >
              <CandidateAvatar candidate={c} size={34} />
              <span className="min-w-0 flex-1 text-[13.5px] font-bold text-ink-strong truncate">{c.name}</span>
              {votes != null ? <span className="shrink-0 text-[12px] font-semibold text-ink-muted tabular-nums">지난 회차 {votes}표</span> : null}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-semibold text-ink">한 표에 고를 인원</p>
        <Stepper value={effectiveMax} min={1} max={Math.max(picked.size, 1)} onChange={setMaxSelect} suffix="명" />
      </div>
      <div className="mt-3 space-y-2">
        <Toggle checked={notify} onChange={setNotify}>
          선거인에게 시작 알림 보내기
        </Toggle>
        <ClosesPicker value={closes} onChange={setCloses} />
      </div>
      <button
        type="button"
        disabled={pending || !picked.size}
        onClick={() =>
          onOpen({ candidate_ids: [...picked], max_select: effectiveMax, notify, closes_at: toIso(closes), practice })
        }
        className="mt-3 w-full py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50"
      >
        후보 {picked.size}명으로 {nextNo}차 투표 시작
      </button>
    </section>
  )
}
