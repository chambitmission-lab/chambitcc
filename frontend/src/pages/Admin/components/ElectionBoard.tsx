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
//
// 공동의회 소속 선거는 위에 같은 공동의회 선거들의 탭이 붙는다 — 눌러서 현황판을 오가고, 1차 투표를 함께 시작하거나
// 열려 있는 투표를 함께 마감하고, 투표용지를 한 번에 교부한다. 회차·표·득표 가림은 그대로 선거별이다.
import { useEffect, useState } from 'react'
import { downloadAssemblyCsv, downloadElectionCsv, getElectionAdmin, getElectionAudit } from '../../../api/election'
import {
  useAssemblyAction,
  useAssemblyBoard,
  useElectionAdmin,
  useElectionAdminAction,
} from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog, promptDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import { safeSessionStorage } from '../../../utils/safeStorage'
import type {
  BulkResult,
  ElectionAdminDetail,
  ElectionRound,
  ElectionSummary,
  OpenRoundPayload,
} from '../../../types/election'
import {
  STATUS_META,
  closesAtLabel,
  phaseLabel,
  quorumText,
  thresholdText,
  turnoutPercent,
} from '../../Election/electionShared'
import { ClosesAtNote, PracticeBanner, ResultBreakdown, TallyBars } from '../../Election/electionUi'
import ElectionCountingMode from './ElectionCountingMode'
import ElectionQrModal from './ElectionQrModal'
import ElectionStage from './ElectionStage'
import { printAssemblyReport, printElectionReport } from './electionReport'
import { CloseButton } from './SeatEventComposer'
import { chipBtn, ghostBtn, panelCls } from './electionBoard/boardStyles'
import { AnnouncePanel } from './electionBoard/AnnouncePanel'
import { AuditPanel } from './electionBoard/AuditPanel'
import { ElectedPanel } from './electionBoard/ElectedPanel'
import { IssuePanel } from './electionBoard/IssuePanel'
import { PaperPanel } from './electionBoard/PaperPanel'
import { ResultExportSheet } from './electionBoard/ResultExportSheet'
import { RunoffPanel } from './electionBoard/RunoffPanel'
import { SchedulePanel } from './electionBoard/SchedulePanel'
import { StartPanel } from './electionBoard/StartPanel'
import { WaitingPanel } from './electionBoard/WaitingPanel'

// 진행 중 득표를 보기로 한 선거 — 이 탭이 살아 있는 동안만 기억한다
const revealKey = (id: number) => `election-reveal-${id}`
const readReveal = (id: number) => safeSessionStorage.get(revealKey(id)) === '1'
const writeReveal = (id: number, on: boolean) => {
  // 저장 못 해도 이번 화면에서는 동작한다
  if (on) safeSessionStorage.set(revealKey(id), '1')
  else safeSessionStorage.remove(revealKey(id))
}

interface Props {
  electionId: number
  onClose: () => void
  /** 관리자 화면에서만 — 선관위원 화면(성도 선거 상세)에서는 넘기지 않는다 */
  onEdit?: (election: ElectionAdminDetail) => void
}

/** 탭 한 칸의 상태 — 색이 아니라 말로 */
const tabState = (e: ElectionSummary) =>
  e.status === 'finished'
    ? '끝남'
    : e.current_round_status === 'open'
      ? `투표 중 ${e.voted_count}/${e.voters_total}`
      : e.current_round_no
        ? `${e.current_round_no}차 마감`
        : '준비 중'

/** 함께 한 일의 결과를 한 줄로 — 안 된 선거는 이유와 함께 따로 알린다 */
const reportBulk = (result: BulkResult, verb: string) => {
  if (result.done.length) showToast(`${result.done.map((e) => e.title).join(' · ')} — ${verb}`, 'success')
  if (result.skipped.length) {
    showToast(result.skipped.map((e) => `${e.title}: ${e.reason ?? '건너뜀'}`).join(' / '), 'error')
  }
}

/** 공동의회 탭으로 선거를 바꾸면 안쪽 현황판을 통째로 새로 단다(득표 가림·회차 탭·패널 입력이 선거별이라) */
const ElectionBoard = ({ electionId, onClose, onEdit }: Props) => {
  useModalBackButton(onClose)
  const [activeId, setActiveId] = useState(electionId)
  return <BoardView key={activeId} electionId={activeId} onClose={onClose} onEdit={onEdit} onSwitch={setActiveId} />
}

const BoardView = ({ electionId, onClose, onEdit, onSwitch }: Props & { onSwitch: (id: number) => void }) => {
  const { data: election, isLoading, error } = useElectionAdmin(electionId, true)
  // 같은 공동의회의 선거들 — 둘 이상일 때만 탭·함께 진행을 보인다
  const { data: group } = useAssemblyBoard(election?.assembly_id)
  const siblings = group && group.elections.length > 1 ? group.elections : []
  const others = siblings.filter((e) => e.id !== electionId)
  const openTogether = siblings.filter((e) => e.current_round_status === 'open')
  const startable = others.filter((e) => e.status !== 'finished' && !e.current_round_no)
  const [presenting, setPresenting] = useState(false)
  const [revealed, setRevealed] = useState(() => readReveal(electionId))
  const [showQr, setShowQr] = useState(false)
  // 결과서·결과 파일은 버튼 하나로 모았다 (ResultExportSheet)
  const [showExport, setShowExport] = useState(false)
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
  const together = useAssemblyAction({
    onSuccess: (result, vars) =>
      reportBulk(
        result,
        vars.kind === 'open'
          ? '투표를 시작했어요'
          : vars.kind === 'close'
            ? '투표를 마감했어요'
            : vars.kind === 'remind'
              ? '미투표자에게 알림을 보냈어요'
              : '투표용지를 교부했어요'
      ),
    onError: (e) => showToast(e.message, 'error'),
  })
  const busy = action.isPending || together.isPending

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
  const openRound = async (data: OpenRoundPayload, label: string, withOthers = false) => {
    if (!election) return
    const joint = withOthers && !!election.assembly_id && startable.length > 0
    const ok = await confirmDialog({
      title: joint ? `${label} ${startable.length + 1}개를 함께 시작할까요?` : `${label}를 시작할까요?`,
      message: joint
        ? [election.title, ...startable.map((e) => e.title)].join(' · ')
        : `선거인 ${election.voter_count + election.offline_voter_count}명 · 당선 기준 ${thresholdText(election.rules)}`,
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
    if (!ok) return
    if (joint) together.mutate({ kind: 'open', assemblyId: election.assembly_id as number, data })
    else action.mutate({ kind: 'open', id: election.id, data })
  }

  // 함께 마감 — 선거마다 투표·종이 표가 어디까지 들어왔는지 보여 주고 한 번에 닫는다
  const closeTogether = async () => {
    if (!election?.assembly_id || openTogether.length < 2) return
    const ok = await confirmDialog({
      title: `열려 있는 투표 ${openTogether.length}개를 함께 마감할까요?`,
      message: '선거마다 지금까지 들어온 표로 당선이 확정돼요.',
      highlight: openTogether
        .map(
          (e) =>
            `${e.title} — ${e.voted_count}/${e.voters_total}명 투표` +
            (e.paper_expected ? ` · 종이 표 ${e.paper_in ?? 0}/${e.paper_expected}장` : '')
        )
        .join('\n'),
      description: '종이 표를 아직 다 넣지 않은 선거가 있으면 취소하고, 그 선거만 따로 마감해 주세요.',
      confirmText: `${openTogether.length}개 마감`,
      tone: 'warning',
    })
    if (ok) together.mutate({ kind: 'close', assemblyId: election.assembly_id })
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

  // 공동의회 전체 결과서 — 선거마다 한 장씩 이어 인쇄한다
  const printAllReports = async () => {
    if (!group) return
    try {
      const items = await Promise.all(
        siblings
          .filter((e) => e.current_round_no)
          .map(async (e) => ({ election: await getElectionAdmin(e.id), logs: await getElectionAudit(e.id) }))
      )
      if (!items.length) return showToast('아직 투표를 시작한 선거가 없어요', 'error')
      if (!printAssemblyReport(group.title, items)) showToast('팝업이 막혀 결과서 창을 열지 못했어요', 'error')
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
  const groupStarted = !!group && siblings.some((e) => e.current_round_no)
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
          {lastRound || groupStarted ? (
            <button type="button" onClick={() => setShowExport(true)} className={chipBtn(false)}>
              결과 받기
            </button>
          ) : null}
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {siblings.length ? (
        <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark overflow-x-auto">
          <span className="shrink-0 text-[12px] font-bold text-ink-muted">{group?.title}</span>
          {siblings.map((e) => {
            const current = e.id === electionId
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onSwitch(e.id)}
                disabled={current}
                aria-current={current ? 'page' : undefined}
                className={`shrink-0 text-left rounded-xl border px-3 py-1.5 transition-colors ${
                  current
                    ? 'border-brand bg-[var(--brand-soft)]'
                    : 'border-gray-200 dark:border-white/[0.1] hover:border-brand'
                }`}
              >
                <span className="block text-[13.5px] font-bold text-ink-strong whitespace-nowrap">{e.title}</span>
                <span className={`block text-[11.5px] font-semibold tabular-nums whitespace-nowrap ${e.current_round_status === 'open' ? 'text-emerald-600 dark:text-emerald-300' : 'text-ink-muted'}`}>
                  {tabState(e)}
                </span>
              </button>
            )
          })}
          {openTogether.length > 1 ? (
            <button
              type="button"
              onClick={() => void closeTogether()}
              disabled={busy}
              className="shrink-0 ml-auto px-3.5 py-2 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[13px] font-bold whitespace-nowrap disabled:opacity-50"
            >
              열린 투표 {openTogether.length}개 함께 마감
            </button>
          ) : null}
        </div>
      ) : null}

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
                  pending={busy}
                  togetherTitles={startable.map((e) => e.title)}
                  onStart={(data, withOthers) => void openRound(data, data.practice ? '연습 투표' : '1차 투표', withOthers)}
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
              pending={busy}
              togetherCount={openTogether.length}
              onIssue={(userId) =>
                election.assembly_id && openTogether.length > 1
                  ? together.mutate({ kind: 'issue', assemblyId: election.assembly_id, userId })
                  : action.mutate({ kind: 'paper-issue', id: election.id, userId })
              }
              onCancel={(userId) => action.mutate({ kind: 'paper-issue-cancel', id: election.id, userId })}
            />
          ) : null}

          {isOpen ? (
            <WaitingPanel
              election={election}
              pending={busy}
              togetherCount={openTogether.length}
              onRemind={() =>
                election.assembly_id && openTogether.length > 1
                  ? together.mutate({ kind: 'remind', assemblyId: election.assembly_id })
                  : action.mutate({ kind: 'remind', id: election.id })
              }
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

      {showExport ? (
        <ResultExportSheet
          electionTitle={election.title}
          canThis={!!lastRound}
          onPrintThis={() => void printReport()}
          onCsvThis={() =>
            void downloadElectionCsv(election.id, `${election.title}_결과.csv`).catch((e: Error) => showToast(e.message, 'error'))
          }
          groupTitle={groupStarted ? group?.title : null}
          onPrintAll={() => void printAllReports()}
          onCsvAll={() =>
            group &&
            void downloadAssemblyCsv(group.id, `${group.title}_결과.csv`).catch((e: Error) => showToast(e.message, 'error'))
          }
          onClose={() => setShowExport(false)}
        />
      ) : null}
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

export default ElectionBoard
