// 선거 현황판 — 실시간 득표(기준선 포함)를 크게 띄우고, 회차를 열고 닫는다.
//
// 왼쪽은 보여 주는 화면(투표율·득표 막대), 오른쪽은 진행 도구(회차 제어·다음 회차 후보·
// 미투표 선거인·종이 표). 여기는 **관리자가 일하는 화면**이다.
// '발표 화면'을 켜면 이 화면이 통째로 ElectionStage(프로젝터용)로 바뀐다 — 도구가 사라지고,
// 좌우 여백에 삽화와 손글씨가 붙는 "회중이 같이 보는 화면"이다.
// 투표 중 쏠림이 걱정되면 '득표 가리기'로 투표율만 보여 줄 수 있다(두 화면 공통).
// 갱신은 SSE(election_update) + 5초 폴링 두 겹(hooks/useElections.ts).
import { useEffect, useMemo, useState } from 'react'
import { downloadElectionCsv } from '../../../api/election'
import { useElectionAdmin, useElectionAdminAction } from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import type { ElectionAdminDetail, ElectionRound } from '../../../types/election'
import { STATUS_META, phaseLabel, thresholdText, turnoutPercent } from '../../Election/electionShared'
import { CandidateAvatar, TallyBars } from '../../Election/electionUi'
import ElectionStage from './ElectionStage'
import { CloseButton, Stepper } from './SeatEventComposer'

const panelCls = 'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4'
const ghostBtn =
  'px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-40'
const chipBtn = (active: boolean) =>
  `px-2.5 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
    active
      ? 'bg-brand text-white border-transparent'
      : 'border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-brand hover:text-brand'
  }`

interface Props {
  electionId: number
  onClose: () => void
  onEdit: (election: ElectionAdminDetail) => void
}

const ElectionBoard = ({ electionId, onClose, onEdit }: Props) => {
  useModalBackButton(onClose)

  const { data: election, isLoading } = useElectionAdmin(electionId, true)
  const [presenting, setPresenting] = useState(false)
  const [hideTally, setHideTally] = useState(false)
  const [viewRoundNo, setViewRoundNo] = useState<number | null>(null)

  const lastRound = election?.rounds.length ? election.rounds[election.rounds.length - 1] : null
  const isOpen = lastRound?.status === 'open'
  // 새 회차가 열리면 보던 회차 탭을 최신으로 돌린다 — 렌더 중 상태 조정(effect 불필요)
  const [viewFor, setViewFor] = useState(lastRound?.id)
  if (viewFor !== lastRound?.id) {
    setViewFor(lastRound?.id)
    setViewRoundNo(null)
  }

  const round: ElectionRound | null =
    election?.rounds.find((r) => r.round_no === viewRoundNo) ?? lastRound ?? null

  const action = useElectionAdminAction({ onError: (e) => showToast(e.message, 'error') })

  // ── 발표 화면: 브라우저 전체 화면 ───────────────────────────────────
  const togglePresenting = () => {
    const next = !presenting
    setPresenting(next)
    try {
      if (next) void document.documentElement.requestFullscreen?.()
      else if (document.fullscreenElement) void document.exitFullscreen?.()
    } catch {
      // 전체 화면을 못 쓰는 환경(iOS 등) — 도구만 숨긴 채로 보여 준다
    }
  }
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (document.fullscreenElement) void document.exitFullscreen?.()
    }
  }, [])

  // ── 회차 제어 ───────────────────────────────────────────────────────
  const startFirst = async () => {
    if (!election) return
    const ok = await confirmDialog({
      title: '1차 투표를 시작할까요?',
      message: `후보 ${election.candidate_count}명 · 선거인 ${election.voter_count + election.offline_voter_count}명`,
      description: `당선 기준은 ${thresholdText(election.rules)} 득표예요. 시작하면 후보를 넣고 뺄 수 없어요.`,
      confirmText: '투표 시작',
      tone: 'brand',
    })
    if (ok) action.mutate({ kind: 'open', id: election.id })
  }

  const closeRound = async () => {
    if (!election || !lastRound) return
    const waiting = election.voters.filter((v) => !v.has_voted).length
    const ok = await confirmDialog({
      title: `${lastRound.round_no}차 투표를 마감할까요?`,
      message: `${lastRound.voted_count} / ${lastRound.voters_total}명 투표`,
      description: waiting
        ? `아직 투표하지 않은 앱 선거인이 ${waiting}명 있어요. 마감하면 당선이 확정돼요.`
        : '마감하면 당선이 확정돼요.',
      confirmText: '마감',
      tone: 'warning',
    })
    if (ok) action.mutate({ kind: 'close', id: election.id })
  }

  const reopenRound = async () => {
    if (!election || !lastRound) return
    const ok = await confirmDialog({
      title: '마감을 되돌릴까요?',
      message: `${lastRound.round_no}차 투표를 다시 열어요`,
      description: '이 회차의 당선 처리도 함께 되돌아가요. 들어온 표는 그대로예요.',
      confirmText: '다시 열기',
      tone: 'warning',
    })
    if (ok) action.mutate({ kind: 'reopen', id: election.id })
  }

  const finish = async () => {
    if (!election) return
    const ok = await confirmDialog({
      title: '선거를 여기서 끝낼까요?',
      message: `당선 ${election.seats - election.seats_left} / ${election.seats}명`,
      description: '남은 자리는 비워 둔 채 선거를 종료해요.',
      confirmText: '선거 종료',
      tone: 'warning',
    })
    if (ok) action.mutate({ kind: 'finish', id: election.id })
  }

  if (isLoading || !election) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center" onClick={onClose}>
        <div className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const canRunoff = !!lastRound && lastRound.status === 'closed' && election.seats_left > 0
  const turnout = round ? turnoutPercent(round.voted_count, round.voters_total) : 0

  // 발표 화면 — 진행 도구를 내려놓고 프로젝터용 화면으로 바꿔 단다.
  // 상태(presenting·hideTally·보고 있는 회차)는 여기 그대로 두고 손잡이만 넘긴다 —
  // 발표를 끄면 보던 회차와 가림 상태가 그대로 살아 있어야 한다.
  if (presenting) {
    return (
      <ElectionStage
        election={election}
        round={round}
        hideTally={hideTally}
        onToggleHideTally={() => setHideTally((v) => !v)}
        onExit={togglePresenting}
        onPickRound={setViewRoundNo}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[110] bg-[var(--app-canvas)] dark:bg-background-dark flex flex-col">
      {/* 상단 바 */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[election.status].badge}`}>
              {phaseLabel(election)}
            </span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            ) : null}
          </div>
          <h2 className="mt-0.5 text-[18px] font-extrabold text-ink-strong tracking-[-0.02em] truncate">
            {election.title}
          </h2>
        </div>
        <button type="button" onClick={() => setHideTally((v) => !v)} className={chipBtn(hideTally)}>
          득표 가리기
        </button>
        <button type="button" onClick={togglePresenting} className={chipBtn(false)}>
          발표 화면
        </button>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── 보여 주는 화면 ── */}
        <div className="px-5 py-5 lg:overflow-y-auto">
          <div>
            {election.rounds.length > 1 ? (
              <div className="flex gap-1.5 mb-4">
                {election.rounds.map((r) => (
                  <button key={r.id} type="button" onClick={() => setViewRoundNo(r.round_no)} className={chipBtn(round?.id === r.id)}>
                    {r.round_no}차
                  </button>
                ))}
              </div>
            ) : null}

            {!round ? (
              <div className={`${panelCls} py-14 text-center`}>
                <p className="text-[16px] font-bold text-ink-strong">아직 투표를 시작하지 않았어요</p>
                <p className="mt-1.5 text-[13px] text-ink-muted">
                  후보 {election.candidate_count}명 · 선거인 {election.voter_count + election.offline_voter_count}명 · {thresholdText(election.rules)}
                </p>
              </div>
            ) : (
              <>
                {/* 투표율 */}
                <div className={panelCls}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[12.5px] font-bold text-ink-muted">
                        {round.round_no}차 투표율 · {round.seats_open}명 선출 · {round.max_select}명까지 선택
                      </p>
                      <p className="mt-1 text-[40px] font-extrabold text-ink-strong tabular-nums leading-none">
                        {round.voted_count}
                        <span className="text-[18px] font-bold text-ink-muted"> / {round.voters_total}명</span>
                      </p>
                    </div>
                    <p className="text-[34px] font-extrabold text-brand tabular-nums leading-none">{turnout}%</p>
                  </div>
                  <div className="mt-4 h-2.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${turnout}%` }} />
                  </div>
                </div>

                {/* 득표 */}
                <div className={`${panelCls} mt-4`}>
                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <h3 className="text-[15px] font-extrabold text-ink-strong">
                      {round.status === 'closed' ? '개표 결과' : '실시간 득표'}
                    </h3>
                    <span className="text-[12px] text-ink-muted">당선 기준 · {thresholdText(round.rules)}</span>
                  </div>
                  {hideTally && round.status === 'open' ? (
                    <p className="py-10 text-center text-[14px] text-ink-muted">투표가 끝나면 결과를 공개합니다</p>
                  ) : round.result ? (
                    <TallyBars result={round.result} candidates={election.candidates} />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 진행 도구 ── */}
        <aside className="px-5 pb-10 lg:py-5 lg:pl-0 lg:overflow-y-auto space-y-3">
          <section className={panelCls}>
            <h3 className="text-[13.5px] font-extrabold text-ink-strong mb-3">진행</h3>
            <div className="space-y-2">
              {!lastRound ? (
                <button type="button" onClick={() => void startFirst()} disabled={action.isPending} className="w-full py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50">
                  1차 투표 시작
                </button>
              ) : isOpen ? (
                <button type="button" onClick={() => void closeRound()} disabled={action.isPending} className="w-full py-3 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[14.5px] font-bold disabled:opacity-50">
                  {lastRound.round_no}차 투표 마감
                </button>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {lastRound && !isOpen ? (
                  <button type="button" onClick={() => void reopenRound()} disabled={action.isPending} className={ghostBtn}>
                    마감 되돌리기
                  </button>
                ) : null}
                {canRunoff && election.status !== 'finished' ? (
                  <button type="button" onClick={() => void finish()} disabled={action.isPending} className={ghostBtn}>
                    여기서 선거 종료
                  </button>
                ) : null}
                <button type="button" onClick={() => onEdit(election)} className={ghostBtn}>
                  기준·명부 수정
                </button>
                {lastRound ? (
                  <button
                    type="button"
                    onClick={() => void downloadElectionCsv(election.id, `${election.title}_결과.csv`).catch((e: Error) => showToast(e.message, 'error'))}
                    className={ghostBtn}
                  >
                    결과 CSV
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {canRunoff ? <RunoffPanel key={lastRound.id} election={election} onOpen={(data) => action.mutate({ kind: 'open', id: election.id, data })} pending={action.isPending} /> : null}

          <ElectedPanel election={election} />

          {isOpen ? <WaitingPanel election={election} /> : null}

          {isOpen && lastRound ? (
            <PaperPanel
              key={lastRound.id}
              election={election}
              round={lastRound}
              pending={action.isPending}
              onAdd={(candidateIds, count) => action.mutate({ kind: 'paper-add', id: election.id, candidateIds, count })}
              onDelete={(ballotId) => action.mutate({ kind: 'paper-delete', id: election.id, ballotId })}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}

// ── 다음 회차 열기 ──────────────────────────────────────────────────────

const RunoffPanel = ({
  election,
  onOpen,
  pending,
}: {
  election: ElectionAdminDetail
  onOpen: (data: { candidate_ids: number[]; max_select: number }) => void
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
      <button
        type="button"
        disabled={pending || !picked.size}
        onClick={() => onOpen({ candidate_ids: [...picked], max_select: effectiveMax })}
        className="mt-3 w-full py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50"
      >
        후보 {picked.size}명으로 {nextNo}차 투표 시작
      </button>
    </section>
  )
}

// ── 당선자 ──────────────────────────────────────────────────────────────

const ElectedPanel = ({ election }: { election: ElectionAdminDetail }) => {
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

// ── 아직 투표하지 않은 선거인 ───────────────────────────────────────────

const WaitingPanel = ({ election }: { election: ElectionAdminDetail }) => {
  const waiting = election.voters.filter((v) => !v.has_voted)
  const [open, setOpen] = useState(false)
  return (
    <section className={panelCls}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <h3 className="text-[13.5px] font-extrabold text-ink-strong">
          아직 투표 안 한 선거인 <span className="text-brand tabular-nums">{waiting.length}</span>명
        </h3>
        <span className="text-[12px] font-semibold text-ink-muted">{open ? '접기' : '이름 보기'}</span>
      </button>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        투표 여부만 알 수 있어요. 누구를 골랐는지는 어디에도 남지 않아요.
      </p>
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

// ── 종이 표 대리 입력 ───────────────────────────────────────────────────

const PaperPanel = ({
  election,
  round,
  pending,
  onAdd,
  onDelete,
}: {
  election: ElectionAdminDetail
  round: ElectionRound
  pending: boolean
  onAdd: (candidateIds: number[], count: number) => void
  onDelete: (ballotId: number) => void
}) => {
  const [picked, setPicked] = useState<number[]>([])
  const [count, setCount] = useState(1)
  const candidates = useMemo(() => {
    const ids = new Set(round.candidate_ids)
    return election.candidates.filter((c) => ids.has(c.id))
  }, [election.candidates, round.candidate_ids])
  const nameOf = (cid: number) => {
    const c = election.candidates.find((x) => x.id === cid)
    return c ? `${c.number}.${c.name}` : String(cid)
  }

  const toggle = (cid: number) =>
    setPicked((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : prev.length >= round.max_select ? prev : [...prev, cid]
    )

  const add = () => {
    onAdd(picked, count)
    setPicked([])
    setCount(1)
  }

  return (
    <section className={panelCls}>
      <h3 className="text-[13.5px] font-extrabold text-ink-strong">종이 표 넣기</h3>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">
        앱을 안 쓰는 선거인의 표를 대신 넣어요. 아무도 고르지 않으면 무효표로 들어가요(투표수에는 포함).
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {candidates.map((c) => (
          <button key={c.id} type="button" onClick={() => toggle(c.id)} className={chipBtn(picked.includes(c.id))}>
            {c.number}. {c.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Stepper value={count} min={1} max={500} onChange={setCount} suffix="장" />
        <button type="button" onClick={add} disabled={pending} className="flex-1 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50">
          {picked.length ? `${picked.length}명 고른 표 넣기` : '무효표 넣기'}
        </button>
      </div>
      {election.paper_ballots.length ? (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p className="text-[11.5px] font-bold text-ink-muted mb-1.5">넣은 종이 표 {election.paper_ballots.length}장</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {[...election.paper_ballots].reverse().map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="min-w-0 truncate text-ink">{b.choices.length ? b.choices.map(nameOf).join(', ') : '무효표'}</span>
                <button type="button" onClick={() => onDelete(b.id)} disabled={pending} className="shrink-0 font-semibold text-ink-muted hover:text-red-500">
                  지우기
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ElectionBoard
