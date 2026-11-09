import { useMemo, useState } from 'react'
import type { ElectionAdminDetail, ElectionRound } from '../../../../types/election'
import { Stepper } from '../SeatEventComposer'
import { chipBtn, panelCls } from './boardStyles'

// ── 종이 표 대리 입력 ───────────────────────────────────────────────────

export const PaperPanel = ({
  election,
  round,
  pending,
  onAdd,
  onDelete,
  onCounting,
}: {
  election: ElectionAdminDetail
  round: ElectionRound
  pending: boolean
  onAdd: (candidateIds: number[], count: number, blankKind: 'invalid' | 'abstain') => void
  onDelete: (ballotId: number) => void
  onCounting: () => void
}) => {
  const [picked, setPicked] = useState<number[]>([])
  const [count, setCount] = useState(1)
  const [blankKind, setBlankKind] = useState<'invalid' | 'abstain'>('invalid')
  const candidates = useMemo(() => {
    const ids = new Set(round.candidate_ids)
    return election.candidates.filter((c) => ids.has(c.id))
  }, [election.candidates, round.candidate_ids])
  const nameOf = (cid: number) => {
    const c = election.candidates.find((x) => x.id === cid)
    return c ? `${c.number}.${c.name}` : String(cid)
  }
  const allowance = election.paper_allowance ?? 0
  const left = Math.max(0, allowance - election.paper_ballots.length)

  // 같은 내용의 표끼리 묶는다 — 표 id 는 무작위라 순서에 뜻이 없다
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; ids: number[] }>()
    for (const b of election.paper_ballots) {
      const key = b.choices.length ? b.choices.join(',') : `blank-${b.kind ?? 'invalid'}`
      const label = b.choices.length ? b.choices.map(nameOf).join(', ') : b.kind === 'abstain' ? '기권표' : '무효표'
      const g = map.get(key) ?? { label, ids: [] }
      g.ids.push(b.id)
      map.set(key, g)
    }
    return [...map.values()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [election.paper_ballots, election.candidates])

  const toggle = (cid: number) =>
    setPicked((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : prev.length >= round.max_select ? prev : [...prev, cid]
    )

  const add = () => {
    onAdd(picked, Math.min(count, Math.max(left, 1)), blankKind)
    setPicked([])
    setCount(1)
  }

  return (
    <section className={panelCls}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-extrabold text-ink-strong">종이 표 넣기</h3>
        <span className="text-[12px] font-bold text-ink-muted tabular-nums">
          {election.paper_ballots.length} / {allowance}장
        </span>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        앱을 안 쓰는 선거인 {election.offline_voter_count}명 + 투표용지를 받은 앱 선거인만큼 넣을 수 있어요.
        아무도 고르지 않으면 무효표나 기권표로 들어가요(투표수에는 포함).
      </p>
      <button
        type="button"
        onClick={onCounting}
        disabled={!allowance}
        className="mt-2.5 w-full py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-40"
      >
        개표 입력 모드 (한 장씩·키보드)
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidates.map((c) => (
          <button key={c.id} type="button" onClick={() => toggle(c.id)} aria-pressed={picked.includes(c.id)} className={chipBtn(picked.includes(c.id))}>
            {c.number}. {c.name}
          </button>
        ))}
      </div>
      {!picked.length ? (
        <div className="mt-2 flex gap-1.5">
          <button type="button" onClick={() => setBlankKind('invalid')} className={chipBtn(blankKind === 'invalid')}>
            무효표
          </button>
          <button type="button" onClick={() => setBlankKind('abstain')} className={chipBtn(blankKind === 'abstain')}>
            기권표
          </button>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <Stepper value={count} min={1} max={Math.max(left, 1)} onChange={setCount} suffix="장" />
        <button
          type="button"
          onClick={add}
          disabled={pending || left <= 0}
          className="flex-1 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
        >
          {picked.length ? `${picked.length}명 고른 표 넣기` : blankKind === 'abstain' ? '기권표 넣기' : '무효표 넣기'}
        </button>
      </div>
      {left <= 0 && allowance > 0 ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-700 dark:text-amber-300">넣을 수 있는 종이 표를 다 채웠어요.</p>
      ) : null}
      {groups.length ? (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p className="text-[11.5px] font-bold text-ink-muted mb-1.5">넣은 종이 표 (내용별)</p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {groups.map((g) => (
              <div key={g.label} className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="min-w-0 truncate text-ink">{g.label}</span>
                <span className="shrink-0 flex items-center gap-2">
                  <b className="tabular-nums text-ink-strong">{g.ids.length}장</b>
                  <button type="button" onClick={() => onDelete(g.ids[0])} disabled={pending} className="font-semibold text-ink-muted hover:text-red-500">
                    한 장 지우기
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
