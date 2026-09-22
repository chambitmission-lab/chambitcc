// 선거 관리 — 선거를 만들고(후보·선거인 명부·당선 기준), 현황판에서 회차를 열고 닫는다.
//
// 목록 카드는 현황판(components/ElectionBoard)·발표 화면(components/ElectionStage)과 **같은 문법**으로 읽는다 —
// 원형 브랜드 배지 + 제목, 진행 중인 선거에만 옅은 브랜드 워시, 인셋 박스 안의 큰 투표율 숫자와
// 두꺼운 게이지, 통계 3칸. 목록만 훑어도 "지금 살아 있는 선거"가 먼저 눈에 들어와야 한다.
// 카드 재질·게이지 색은 ElectionStage.css 의 els-card / els-progress-fill 과 짝이다 — 한쪽만 고치지 말 것.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getElectionAdmin } from '../../api/election'
import { useAdminElections, useDeleteElection } from '../../hooks/useElections'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import type { ElectionAdminDetail, ElectionSummary } from '../../types/election'
import { STATUS_META, phaseLabel, thresholdText, turnoutPercent } from '../Election/electionShared'
import { BallotIcon } from '../Election/electionUi'
import ElectionBoard from './components/ElectionBoard'
import ElectionComposer from './components/ElectionComposer'

// 발표 화면의 카드와 같은 재질 — 솔리드 면 + 1px 빛줄 + 부드러운 그림자
const cardShell =
  'relative overflow-hidden rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-container)]'
const cardShadow = { boxShadow: 'var(--card-shadow)' } as const
// 진행 중인 선거에만 옅은 브랜드 워시 — 카드의 위계를 색이 아니라 온도로 가른다(els-card--turnout)
const liveWash = {
  boxShadow: 'var(--card-shadow)',
  background:
    'linear-gradient(118deg, var(--brand-soft-strong) 0%, var(--brand-soft) 42%, transparent 74%), var(--surface-container)',
} as const
// 투표율 게이지 — 발표 화면 els-progress-fill 과 같은 그라데이션
const gaugeFill = 'linear-gradient(90deg, var(--brand-dim), var(--brand) 55%, #5fc6f0 100%)'

const ghostBtn =
  'px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50'

/** 카드 위 1px 빛줄 — 솔리드 면이 바탕에 잠기지 않게 */
const Sheen = () => (
  <span
    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/[0.13]"
    aria-hidden
  />
)

/** 원형 브랜드 배지 — 발표 화면 els-badge 와 같은 상징 */
const BrandBadge = ({ size = 40 }: { size?: number }) => (
  <span
    className="shrink-0 inline-flex items-center justify-center rounded-full bg-brand text-[var(--on-brand)]"
    style={{ width: size, height: size, boxShadow: '0 8px 18px -8px var(--brand-glow)' }}
  >
    <BallotIcon size={Math.round(size * 0.52)} />
  </span>
)

/** 인셋 통계 한 칸 — 숫자가 주인공, 라벨은 작게 */
const Stat = ({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) => (
  <div className="flex-1 min-w-0 rounded-xl bg-[var(--surface-inset)] px-2 py-2 text-center">
    <p className="text-[10.5px] font-bold text-ink-muted tracking-wide">{label}</p>
    <p className={`mt-0.5 text-[15px] font-extrabold tabular-nums truncate ${accent ? 'text-brand' : 'text-ink-strong'}`}>
      {value}
    </p>
  </div>
)

/** 이 선거가 지금 어디까지 왔는지 — 회차가 열린 적 있으면 투표율, 아니면 안내 한 줄 */
const RoundBlock = ({ election }: { election: ElectionSummary }) => {
  if (!election.current_round_no) {
    return (
      <div className="mt-3.5 rounded-2xl bg-[var(--surface-inset)] px-3.5 py-3">
        <p className="text-[13px] font-bold text-ink-strong">아직 투표를 시작하지 않았어요</p>
        <p className="mt-0.5 text-[12px] text-ink-muted break-keep">현황판을 열면 1차 투표를 시작할 수 있어요</p>
      </div>
    )
  }
  const live = election.current_round_status === 'open'
  const percent = turnoutPercent(election.voted_count, election.voters_total)
  const waiting = Math.max(0, election.voters_total - election.voted_count)
  return (
    <div className="mt-3.5 rounded-2xl bg-[var(--surface-inset)] px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11.5px] font-bold text-ink-muted">{election.current_round_no}차 투표율</p>
        <p className="text-[11.5px] font-bold text-brand">
          {waiting === 0 ? '모두 투표했어요!' : live ? `${waiting}명 남았어요` : `미투표 ${waiting}명`}
        </p>
      </div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-[30px] font-extrabold text-ink-strong tabular-nums leading-none">
          {election.voted_count}
          <span className="text-[14px] font-bold text-ink-muted"> / {election.voters_total}명</span>
        </p>
        <p className="text-[26px] font-extrabold text-brand tabular-nums leading-none">{percent}%</p>
      </div>
      <div className="mt-2.5 h-2.5 rounded-full bg-black/[0.07] dark:bg-white/[0.09] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%`, background: gaugeFill }}
        />
      </div>
    </div>
  )
}

const ElectionManagement = () => {
  const navigate = useNavigate()
  const { data: elections, isLoading } = useAdminElections()

  const [composerTarget, setComposerTarget] = useState<ElectionAdminDetail | null | undefined>(undefined)
  const [boardId, setBoardId] = useState<number | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const remove = useDeleteElection(toastFeedback({ success: '선거를 삭제했어요' }))

  // 머리 카드의 통계 3칸 — 목록을 세지 않아도 지금 판이 어떻게 돌아가는지 보인다
  const counts = useMemo(() => {
    const list = elections ?? []
    return {
      active: list.filter((e) => e.status === 'active').length,
      draft: list.filter((e) => e.status === 'draft').length,
      finished: list.filter((e) => e.status === 'finished').length,
    }
  }, [elections])

  const openEdit = async (e: ElectionSummary) => {
    try {
      setLoadingEdit(e.id)
      // 목록에는 후보·명부가 없으므로 편집 전에 상세를 받아온다
      setComposerTarget(await getElectionAdmin(e.id))
    } catch {
      showToast('선거를 불러오지 못했습니다', 'error')
    } finally {
      setLoadingEdit(null)
    }
  }

  const confirmDelete = async (e: ElectionSummary) => {
    const ok = await confirmDialog({
      title: '선거를 삭제할까요?',
      message: `'${e.title}'`,
      description: e.current_round_no
        ? '들어온 표와 회차별 결과가 모두 사라집니다. 복구할 수 없습니다.'
        : '복구할 수 없습니다.',
      confirmText: '삭제',
      tone: 'danger',
    })
    if (ok) remove.mutate(e.id)
  }

  const copyLink = async (e: ElectionSummary) => {
    const url = `${window.location.origin}${window.location.pathname}#/elections/${e.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('투표 링크를 복사했어요. 선거인에게만 열려요', 'success')
    } catch {
      showToast(url, 'info')
    }
  }

  // 좁은 화면에서는 머리 카드 아래 한 줄, 넓어지면 제목 오른쪽으로 올라간다
  const newButton = (extra: string) => (
    <button
      type="button"
      onClick={() => setComposerTarget(null)}
      className={`inline-flex items-center justify-center gap-1 rounded-full bg-brand text-[var(--on-brand)] text-[13.5px] font-bold px-4 py-2.5 transition-[filter] hover:brightness-105 ${extra}`}
      style={{ boxShadow: '0 10px 22px -12px var(--brand-glow)' }}
    >
      <span className="text-[16px] leading-none">+</span> 새 선거
    </button>
  )

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        {/* 머리 — 발표 화면 카드와 같은 배지 + 제목 + 인셋 통계 */}
        <header className={`${cardShell} mb-4 p-5`} style={cardShadow}>
          <Sheen />
          <div className="flex items-start gap-3.5">
            <BrandBadge size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
              <h1 className="text-ink-strong text-[24px] font-extrabold tracking-[-0.02em] leading-tight">선거 관리</h1>
            </div>
            {newButton('hidden sm:inline-flex shrink-0')}
          </div>
          <p className="mt-2.5 text-[13px] text-ink-muted leading-relaxed break-keep">
            후보와 선거인 명부를 정하고, 현황판에서 투표를 시작·마감하세요. 투표는 무기명으로 저장돼요
          </p>
          <div className="mt-3.5 flex gap-2">
            <Stat label="진행 중" accent value={`${counts.active}건`} />
            <Stat label="준비 중" value={`${counts.draft}건`} />
            <Stat label="종료" value={`${counts.finished}건`} />
          </div>
          {newButton('sm:hidden mt-3 w-full')}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : !elections?.length ? (
          <div className={`${cardShell} px-4 py-12 text-center`} style={cardShadow}>
            <Sheen />
            <span className="mx-auto mb-3 flex w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand items-center justify-center">
              <BallotIcon size={24} />
            </span>
            <p className="text-[14px] font-semibold text-ink-strong">등록된 선거가 없습니다</p>
            <p className="mt-1 text-[13px] text-ink-muted">후보 사진과 선거인 명부만 있으면 바로 시작할 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {elections.map((e) => {
              const live = e.current_round_status === 'open'
              const boardLabel = !e.current_round_no
                ? '현황판 · 투표 시작'
                : live
                  ? '현황판 · 진행 중'
                  : '현황판 열기'
              return (
                <div key={e.id} className={`${cardShell} p-4 sm:p-5`} style={live ? liveWash : cardShadow}>
                  <Sheen />

                  {/* 머리 — 배지 + 지금 단계 + 제목 */}
                  <div className="flex items-start gap-3">
                    <BrandBadge />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[e.status].badge}`}
                        >
                          {phaseLabel(e)}
                        </span>
                        {live ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold tracking-[0.1em] text-emerald-600 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1 text-[16.5px] font-extrabold text-ink-strong leading-snug break-keep">
                        {e.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-ink-muted break-keep">
                        {e.seats}명 선출 · 당선 기준 {thresholdText(e.rules)}
                      </p>
                    </div>
                  </div>

                  <RoundBlock election={e} />

                  <div className="mt-2 flex gap-2">
                    <Stat
                      label="당선"
                      accent
                      value={
                        <>
                          {e.elected_count ?? 0}
                          <span className="text-[11px] font-bold text-ink-muted"> / {e.seats}</span>
                        </>
                      }
                    />
                    <Stat label="후보" value={`${e.candidate_count}명`} />
                    <Stat label="선거인" value={`${e.voter_count + e.offline_voter_count}명`} />
                  </div>

                  {/* 손잡이 — 현황판이 주인공, 나머지는 고스트 */}
                  <div className="mt-3.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBoardId(e.id)}
                      className="flex-1 py-2.5 rounded-xl bg-brand text-[var(--on-brand)] text-[13.5px] font-bold transition-[filter] hover:brightness-105"
                      style={{ boxShadow: '0 10px 22px -14px var(--brand-glow)' }}
                    >
                      {boardLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openEdit(e)}
                      disabled={loadingEdit === e.id}
                      className={ghostBtn}
                    >
                      {loadingEdit === e.id ? '여는 중…' : '수정'}
                    </button>
                    <button type="button" onClick={() => void copyLink(e)} className={ghostBtn}>
                      링크
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmDelete(e)}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {composerTarget !== undefined ? (
        <ElectionComposer
          election={composerTarget}
          onClose={() => setComposerTarget(undefined)}
          onSaved={() => setComposerTarget(undefined)}
        />
      ) : null}

      {boardId ? (
        <ElectionBoard
          electionId={boardId}
          onClose={() => setBoardId(null)}
          // 모달 두 장을 겹치지 않는다 — 현황판을 닫고 편집기를 연다
          onEdit={(election) => {
            setBoardId(null)
            setComposerTarget(election)
          }}
        />
      ) : null}
    </div>
  )
}

export default ElectionManagement
