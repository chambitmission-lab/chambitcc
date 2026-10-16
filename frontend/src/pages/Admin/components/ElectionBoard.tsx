// 선거 현황판 — 실시간 투표율을 크게 띄우고, 회차를 열고 닫는다.
//
// 왼쪽은 보여 주는 화면(투표율·득표 막대), 오른쪽은 진행 도구(회차 제어·예약 마감·다음 회차 후보·
// 현장 접수(투표용지 교부)·미투표 선거인·종이 표·결과 발표·운영 기록). 여기는 **진행자가 일하는 화면**이다.
// 관리자와 그 선거의 선거관리위원이 연다 — 선관위원에게는 기준·명부 수정 손잡이가 없다(can_manage_setup).
// '발표 화면'을 켜면 이 화면이 통째로 ElectionStage(프로젝터용)로 바뀐다.
//
// ★무기명: 진행 중에는 득표를 **기본으로 가린다**. 미투표자 명단이 바뀌는 순간 득표가 오르는 것을 같이
// 보면 누가 누구를 찍었는지 짐작할 수 있어서다. 보려면 확인을 한 번 더 거치고, 선거마다 기억한다(세션).
// 갱신은 SSE(election_update) + 5초 폴링 두 겹(hooks/useElections.ts).
import { useEffect, useMemo, useState } from 'react'
import { downloadElectionCsv, getElectionAudit } from '../../../api/election'
import { useElectionAdmin, useElectionAdminAction, useElectionAudit } from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog, promptDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import type { ElectionAdminDetail, ElectionRound, OpenRoundPayload } from '../../../types/election'
import {
  STATUS_META,
  closesAtLabel,
  phaseLabel,
  quorumText,
  thresholdText,
  toLocalInputValue,
  turnoutPercent,
} from '../../Election/electionShared'
import { CandidateAvatar, ClosesAtNote, PracticeBanner, ResultBreakdown, TallyBars } from '../../Election/electionUi'
import ElectionCountingMode from './ElectionCountingMode'
import ElectionQrModal from './ElectionQrModal'
import ElectionStage from './ElectionStage'
import { printElectionReport } from './electionReport'
import { CloseButton, Stepper } from './SeatEventComposer'

const panelCls = 'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4'
const ghostBtn =
  'px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-40'
const chipBtn = (active: boolean) =>
  `shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
    active
      ? 'bg-brand text-white border-transparent'
      : 'border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-brand hover:text-brand'
  }`

// 진행 중 득표를 보기로 한 선거 — 이 탭이 살아 있는 동안만 기억한다
const revealKey = (id: number) => `election-reveal-${id}`
const readReveal = (id: number) => {
  try {
    return sessionStorage.getItem(revealKey(id)) === '1'
  } catch {
    return false
  }
}
const writeReveal = (id: number, on: boolean) => {
  try {
    if (on) sessionStorage.setItem(revealKey(id), '1')
    else sessionStorage.removeItem(revealKey(id))
  } catch {
    /* 저장 못 해도 이번 화면에서는 동작한다 */
  }
}

interface Props {
  electionId: number
  onClose: () => void
  /** 관리자 화면에서만 — 선관위원 화면(성도 선거 상세)에서는 넘기지 않는다 */
  onEdit?: (election: ElectionAdminDetail) => void
}

const ElectionBoard = ({ electionId, onClose, onEdit }: Props) => {
  useModalBackButton(onClose)

  const { data: election, isLoading, error } = useElectionAdmin(electionId, true)
  const [presenting, setPresenting] = useState(false)
  const [revealed, setRevealed] = useState(() => readReveal(electionId))
  const [showQr, setShowQr] = useState(false)
  const [counting, setCounting] = useState(false)
  const [viewRoundNo, setViewRoundNo] = useState<number | null>(null)

  const lastRound = election?.rounds.length ? election.rounds[election.rounds.length - 1] : null
  const isOpen = lastRound?.status === 'open'
  const inPractice = !!election?.rounds.length && election.rounds.every((r) => r.is_practice)
  // 새 회차가 열리면 보던 회차 탭을 최신으로 돌린다 — 렌더 중 상태 조정(effect 불필요)
  const [viewFor, setViewFor] = useState(lastRound?.id)
  if (viewFor !== lastRound?.id) {
    setViewFor(lastRound?.id)
    setViewRoundNo(null)
  }

  const round: ElectionRound | null =
    election?.rounds.find((r) => r.round_no === viewRoundNo) ?? lastRound ?? null
  // 가림은 "진행 중인 회차"에만 — 마감된 회차의 결과는 늘 보인다
  const hideTally = !revealed

  const action = useElectionAdminAction({ onError: (e) => showToast(e.message, 'error') })

  const toggleReveal = async () => {
    if (revealed) {
      setRevealed(false)
      writeReveal(electionId, false)
      return
    }
    const ok = await confirmDialog({
      title: '진행 중 득표를 볼까요?',
      message: '미투표자 명단과 득표를 함께 보면, 누가 누구를 찍었는지 짐작할 수 있어요.',
      description: '프로젝터에 띄우거나 다른 사람과 함께 보지 마세요. 마감하면 결과는 저절로 보여요.',
      confirmText: '득표 보기',
      tone: 'warning',
    })
    if (ok) {
      setRevealed(true)
      writeReveal(electionId, true)
    }
  }

  // ── 발표 화면: 브라우저 전체 화면 ───────────────────────────────────
  const togglePresenting = () => {
    const next = !presenting
    setPresenting(next)
    // 전체 화면을 못 쓰는 환경(iOS·권한 거부)은 promise 거부로 알려 온다 — 도구만 숨긴 채로 보여 준다
    if (next) document.documentElement.requestFullscreen?.()?.catch(() => {})
    else if (document.fullscreenElement) document.exitFullscreen?.()?.catch(() => {})
  }
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (document.fullscreenElement) document.exitFullscreen?.()?.catch(() => {})
    }
  }, [])

  // ── 회차 제어 ───────────────────────────────────────────────────────
  const openRound = async (data: OpenRoundPayload, label: string) => {
    if (!election) return
    const ok = await confirmDialog({
      title: `${label}를 시작할까요?`,
      message: `선거인 ${election.voter_count + election.offline_voter_count}명 · 당선 기준 ${thresholdText(election.rules)}`,
      description: [
        data.closes_at ? `${closesAtLabel(data.closes_at)}에 자동으로 마감돼요.` : '마감은 직접 눌러야 해요.',
        data.notify ? '선거인에게 "투표가 시작됐어요" 알림이 가요.' : '알림은 보내지 않아요.',
        !election.rounds.length && !data.practice ? '시작하면 후보를 넣고 뺄 수 없어요.' : '',
      ]
        .filter(Boolean)
        .join('\n'),
      confirmText: '투표 시작',
      tone: 'brand',
    })
    if (ok) action.mutate({ kind: 'open', id: election.id, data })
  }

  const closeRound = async () => {
    if (!election || !lastRound) return
    const waiting = election.voters.filter((v) => !v.has_voted).length
    const result = lastRound.result
    const quorum = result?.quorum_required ?? 0
    const paperIn = election.paper_ballots.length
    const allowance = election.paper_allowance ?? 0
    const issued = election.voters.filter((v) => v.paper_issued).length
    const warnings = [
      waiting ? `아직 투표하지 않은 앱 선거인이 ${waiting}명 있어요.` : '',
      issued && paperIn < issued ? `투표용지를 ${issued}장 교부했는데 종이 표는 ${paperIn}장만 들어왔어요.` : '',
      quorum && lastRound.voted_count < quorum
        ? `성원 미달이에요 — ${quorum}명이 투표해야 하는데 ${lastRound.voted_count}명이에요.`
        : '',
    ].filter(Boolean)
    const ok = await confirmDialog({
      title: `${lastRound.is_practice ? '연습 ' : ''}${lastRound.round_no}차 투표를 마감할까요?`,
      message: `${lastRound.voted_count} / ${lastRound.voters_total}명 투표${allowance ? ` · 종이 표 ${paperIn}/${allowance}장` : ''}`,
      highlight: warnings.length ? warnings.join('\n') : undefined,
      description: '마감하면 당선이 확정돼요.',
      confirmText: '마감',
      tone: 'warning',
    })
    if (ok) action.mutate({ kind: 'close', id: election.id })
  }

  const reopenRound = async () => {
    if (!election || !lastRound) return
    const reason = await promptDialog({
      title: '마감을 되돌릴까요?',
      message: `${lastRound.round_no}차 투표를 다시 열어요. 이 회차의 당선 처리도 함께 되돌아가요.`,
      description: '되돌리는 이유는 운영 기록과 결과서에 남아요.',
      confirmText: '다시 열기',
      tone: 'warning',
      input: { placeholder: '예) 종이 표를 다 넣기 전에 마감을 눌렀어요', minLength: 2 },
    })
    if (reason) action.mutate({ kind: 'reopen', id: election.id, reason })
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

  const resetPractice = async () => {
    if (!election) return
    const ok = await confirmDialog({
      title: '연습 투표를 정리할까요?',
      message: '연습 회차의 표·참여 기록·당선 표시가 모두 지워지고 "준비 중"으로 돌아가요.',
      description: '그다음 실제 1차 투표를 시작할 수 있어요.',
      confirmText: '연습 정리',
      tone: 'warning',
    })
    if (ok) action.mutate({ kind: 'practice-reset', id: election.id })
  }

  const printReport = async () => {
    if (!election) return
    try {
      const logs = await getElectionAudit(election.id)
      if (!printElectionReport(election, logs)) showToast('팝업이 막혀 결과서 창을 열지 못했어요', 'error')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '결과서를 만들지 못했어요', 'error')
    }
  }

  if (isLoading || !election) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center" onClick={onClose}>
        {error ? (
          <p className="px-5 py-4 rounded-2xl bg-white dark:bg-card-dark text-[14px] font-semibold text-ink-strong">
            {error instanceof Error ? error.message : '현황판을 열 수 없어요'}
          </p>
        ) : (
          <div className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </div>
    )
  }

  const canSetup = election.can_manage_setup !== false && !!onEdit
  const canRunoff = !!lastRound && lastRound.status === 'closed' && election.seats_left > 0
  const turnout = round ? turnoutPercent(round.voted_count, round.voters_total) : 0
  const tallyHidden = hideTally && round?.status === 'open'

  // 발표 화면 — 진행 도구를 내려놓고 프로젝터용 화면으로 바꿔 단다.
  if (presenting) {
    return (
      <ElectionStage
        election={election}
        round={round}
        hideTally={hideTally}
        onToggleHideTally={() => void toggleReveal()}
        onExit={togglePresenting}
        onPickRound={setViewRoundNo}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[110] bg-[var(--app-canvas)] dark:bg-background-dark flex flex-col">
      {/* 상단 바 — 모바일은 버튼을 둘째 줄로 내린다 */}
      <div className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2.5 px-5 py-3.5 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
        <div className="min-w-0 flex-1 basis-0">
          <div className="flex items-center gap-1.5">
            <span className={`shrink-0 whitespace-nowrap text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[election.status].badge}`}>
              {phaseLabel(election)}
            </span>
            {inPractice ? (
              <span className="shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-dashed border-amber-400 text-amber-700 dark:text-amber-300">
                연습
              </span>
            ) : null}
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
        <div className="order-last sm:order-none w-full sm:w-auto flex items-center gap-1.5 sm:gap-3 overflow-x-auto">
          <button type="button" onClick={() => setShowQr(true)} className={chipBtn(false)}>
            투표 QR
          </button>
          {isOpen ? (
            <button type="button" onClick={() => void toggleReveal()} aria-pressed={revealed} className={chipBtn(revealed)}>
              {revealed ? '득표 보는 중' : '진행 중 득표 가림'}
            </button>
          ) : null}
          <button type="button" onClick={togglePresenting} className={chipBtn(false)}>
            발표 화면
          </button>
          {lastRound ? (
            <button type="button" onClick={() => void printReport()} className={chipBtn(false)}>
              결과서
            </button>
          ) : null}
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── 보여 주는 화면 ── */}
        <div className="px-5 py-5 lg:overflow-y-auto space-y-4">
          {inPractice ? <PracticeBanner /> : null}

          {election.rounds.length > 1 ? (
            <div className="flex gap-1.5">
              {election.rounds.map((r) => (
                <button key={r.id} type="button" onClick={() => setViewRoundNo(r.round_no)} aria-pressed={round?.id === r.id} className={chipBtn(round?.id === r.id)}>
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
                {quorumText(election.rules) ? ` · 성원 ${quorumText(election.rules)}` : ''}
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
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-muted">
                  {round.status === 'open' && round.closes_at ? <ClosesAtNote closesAt={round.closes_at} /> : null}
                  {round.result?.quorum_required ? (
                    <span
                      className={
                        round.voted_count >= round.result.quorum_required
                          ? 'text-emerald-600 dark:text-emerald-300 font-semibold'
                          : round.status === 'closed'
                            ? 'text-red-600 dark:text-red-300 font-semibold'
                            : 'font-semibold'
                      }
                    >
                      성원 {round.result.quorum_required}명{' '}
                      {round.voted_count >= round.result.quorum_required
                        ? '충족'
                        : round.status === 'closed'
                          ? '미달'
                          : `· ${round.result.quorum_required - round.voted_count}명 더`}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 득표 */}
              <div className={panelCls}>
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <h3 className="text-[15px] font-extrabold text-ink-strong">
                    {round.status === 'closed' ? '개표 결과' : '실시간 득표'}
                  </h3>
                  <span className="text-[12px] text-ink-muted">당선 기준 · {thresholdText(round.rules)}</span>
                </div>
                {tallyHidden ? (
                  <div className="py-8 text-center">
                    <p className="text-[14px] font-semibold text-ink-strong">투표가 끝나면 결과를 보여 드려요</p>
                    <p className="mt-1 text-[12px] text-ink-muted break-keep">
                      무기명을 지키려고 진행 중에는 득표를 가려 둬요. 꼭 봐야 하면 위의 &lsquo;진행 중 득표 가림&rsquo;을 누르세요.
                    </p>
                  </div>
                ) : round.result ? (
                  <>
                    <TallyBars result={round.result} candidates={election.candidates} basis={round.rules.threshold_basis} />
                    <div className="mt-4">
                      <ResultBreakdown result={round.result} />
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* ── 진행 도구 ── */}
        <aside className="px-5 pb-10 lg:py-5 lg:pl-0 lg:overflow-y-auto space-y-3">
          <section className={panelCls}>
            <h3 className="text-[13.5px] font-extrabold text-ink-strong mb-3">진행</h3>
            <div className="space-y-2">
              {!lastRound ? (
                <StartPanel
                  election={election}
                  pending={action.isPending}
                  onStart={(data) => void openRound(data, data.practice ? '연습 투표' : '1차 투표')}
                />
              ) : isOpen ? (
                <button type="button" onClick={() => void closeRound()} disabled={action.isPending} className="w-full py-3 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[14.5px] font-bold disabled:opacity-50">
                  {lastRound.is_practice ? '연습 ' : ''}{lastRound.round_no}차 투표 마감
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
                {inPractice ? (
                  <button type="button" onClick={() => void resetPractice()} disabled={action.isPending} className={`${ghostBtn} border-amber-300 text-amber-700 dark:text-amber-300`}>
                    연습 정리
                  </button>
                ) : null}
                {canSetup ? (
                  <button type="button" onClick={() => onEdit?.(election)} className={ghostBtn}>
                    기준·명부 수정
                  </button>
                ) : null}
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

          {isOpen && lastRound ? (
            <SchedulePanel
              key={`schedule-${lastRound.id}`}
              round={lastRound}
              pending={action.isPending}
              onChange={(closesAt) => action.mutate({ kind: 'schedule', id: election.id, closesAt })}
            />
          ) : null}

          {canRunoff && election.status !== 'finished' ? (
            <RunoffPanel
              key={lastRound.id}
              election={election}
              practice={inPractice}
              onOpen={(data) => void openRound(data, `${election.rounds.length + 1}차 투표`)}
              pending={action.isPending}
            />
          ) : null}

          <ElectedPanel election={election} />

          {election.status === 'finished' && !inPractice ? (
            <AnnouncePanel
              pending={action.isPending}
              onAnnounce={(audience) => action.mutate({ kind: 'announce', id: election.id, audience })}
            />
          ) : null}

          {isOpen && lastRound ? (
            <IssuePanel
              election={election}
              pending={action.isPending}
              onIssue={(userId) => action.mutate({ kind: 'paper-issue', id: election.id, userId })}
              onCancel={(userId) => action.mutate({ kind: 'paper-issue-cancel', id: election.id, userId })}
            />
          ) : null}

          {isOpen ? (
            <WaitingPanel
              election={election}
              pending={action.isPending}
              onRemind={() => action.mutate({ kind: 'remind', id: election.id })}
            />
          ) : null}

          {isOpen && lastRound ? (
            <PaperPanel
              key={lastRound.id}
              election={election}
              round={lastRound}
              pending={action.isPending}
              onAdd={(candidateIds, count, blankKind) =>
                action.mutate({ kind: 'paper-add', id: election.id, candidateIds, count, blankKind })
              }
              onDelete={(ballotId) => action.mutate({ kind: 'paper-delete', id: election.id, ballotId })}
              onCounting={() => setCounting(true)}
            />
          ) : null}

          <AuditPanel electionId={election.id} />
        </aside>
      </div>

      {showQr ? <ElectionQrModal electionId={election.id} title={election.title} onClose={() => setShowQr(false)} /> : null}
      {counting && isOpen && lastRound ? (
        <ElectionCountingMode
          election={election}
          round={lastRound}
          pending={action.isPending}
          onAdd={(candidateIds, blankKind) =>
            action.mutate({ kind: 'paper-add', id: election.id, candidateIds, count: 1, blankKind })
          }
          onDelete={(ballotId) => action.mutate({ kind: 'paper-delete', id: election.id, ballotId })}
          onClose={() => setCounting(false)}
        />
      ) : null}
    </div>
  )
}

// ── 회차 옵션 (예약 마감·알림) ─────────────────────────────────────────

const QUICK_CLOSES: { label: string; minutes: number }[] = [
  { label: '30분 뒤', minutes: 30 },
  { label: '1시간 뒤', minutes: 60 },
  { label: '3시간 뒤', minutes: 180 },
]

/** 예약 마감 고르기 — 빠른 칩 + 직접 입력. 값은 datetime-local(로컬 시각) 문자열, 없으면 '' */
const ClosesPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onChange('')} className={chipBtn(!value)}>
        직접 마감
      </button>
      {QUICK_CLOSES.map((q) => (
        <button
          key={q.minutes}
          type="button"
          onClick={() => onChange(toLocalInputValue(new Date(Date.now() + q.minutes * 60000)))}
          className={chipBtn(false)}
        >
          {q.label}
        </button>
      ))}
    </div>
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong focus:outline-none focus:border-brand"
    />
  </div>
)

const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null)

const Toggle = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: string }) => (
  <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-[18px] h-[18px] accent-[var(--brand)]" />
    {children}
  </label>
)

// ── 첫 회차 시작 ──────────────────────────────────────────────────────

const StartPanel = ({
  election,
  pending,
  onStart,
}: {
  election: ElectionAdminDetail
  pending: boolean
  onStart: (data: OpenRoundPayload) => void
}) => {
  const [practice, setPractice] = useState(false)
  const [notify, setNotify] = useState(true)
  const [closes, setCloses] = useState('')
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Toggle
          checked={practice}
          onChange={(v) => {
            setPractice(v)
            setNotify(!v) // 연습은 보통 알림 없이
          }}
        >
          연습 투표로 먼저 해 보기
        </Toggle>
        <Toggle checked={notify} onChange={setNotify}>
          선거인에게 시작 알림 보내기
        </Toggle>
      </div>
      <div>
        <p className="text-[12px] font-bold text-ink-muted mb-1.5">마감</p>
        <ClosesPicker value={closes} onChange={setCloses} />
      </div>
      {practice ? (
        <p className="text-[11.5px] text-ink-muted break-keep">
          연습 투표는 선거인 화면에 &lsquo;연습&rsquo; 띠가 붙고, 끝나면 &lsquo;연습 정리&rsquo;로 표를 모두 지워요.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onStart({ practice, notify, closes_at: toIso(closes) })}
        disabled={pending || !election.candidates.length}
        className="w-full py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50"
      >
        {practice ? '연습 투표 시작' : '1차 투표 시작'}
      </button>
    </div>
  )
}

// ── 예약 마감 ────────────────────────────────────────────────────────

const SchedulePanel = ({
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

// ── 다음 회차 열기 ──────────────────────────────────────────────────────

const RunoffPanel = ({
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

// ── 결과 발표 알림 ──────────────────────────────────────────────────────

const AnnouncePanel = ({
  pending,
  onAnnounce,
}: {
  pending: boolean
  onAnnounce: (audience: 'roster' | 'all') => void
}) => {
  const ask = async (audience: 'roster' | 'all') => {
    const ok = await confirmDialog({
      title: '결과를 알릴까요?',
      message: audience === 'all' ? '승인된 모든 성도에게 당선자 알림이 가요.' : '이 선거의 선거인에게 당선자 알림이 가요.',
      description: '의장의 당선 선포가 끝난 뒤에 보내 주세요.',
      confirmText: '알림 보내기',
      tone: 'brand',
    })
    if (ok) onAnnounce(audience)
  }
  return (
    <section className={panelCls}>
      <h3 className="text-[13.5px] font-extrabold text-ink-strong">결과 발표 알림</h3>
      <p className="mt-1 text-[11.5px] text-ink-muted break-keep">당선자 이름을 푸시와 알림함으로 보내요.</p>
      <div className="mt-3 flex gap-1.5">
        <button type="button" onClick={() => void ask('roster')} disabled={pending} className={`flex-1 ${ghostBtn}`}>
          선거인에게
        </button>
        <button type="button" onClick={() => void ask('all')} disabled={pending} className={`flex-1 ${ghostBtn}`}>
          전체 성도에게
        </button>
      </div>
    </section>
  )
}

// ── 현장 접수 · 투표용지 교부 ───────────────────────────────────────────

const IssuePanel = ({
  election,
  pending,
  onIssue,
  onCancel,
}: {
  election: ElectionAdminDetail
  pending: boolean
  onIssue: (userId: number) => void
  onCancel: (userId: number) => void
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
                  교부
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

// ── 아직 투표하지 않은 선거인 ───────────────────────────────────────────

const WaitingPanel = ({
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

// ── 종이 표 대리 입력 ───────────────────────────────────────────────────

const PaperPanel = ({
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

// ── 운영 기록 ──────────────────────────────────────────────────────────

const AuditPanel = ({ electionId }: { electionId: number }) => {
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

export default ElectionBoard
