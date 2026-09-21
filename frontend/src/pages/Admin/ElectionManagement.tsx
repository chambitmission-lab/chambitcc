// 선거 관리 — 선거를 만들고(후보·선거인 명부·당선 기준), 현황판에서 회차를 열고 닫는다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getElectionAdmin } from '../../api/election'
import { useAdminElections, useDeleteElection } from '../../hooks/useElections'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import type { ElectionAdminDetail, ElectionSummary } from '../../types/election'
import { STATUS_META, cardCls, phaseLabel, thresholdText, turnoutPercent } from '../Election/electionShared'
import { BallotIcon } from '../Election/electionUi'
import ElectionBoard from './components/ElectionBoard'
import ElectionComposer from './components/ElectionComposer'

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

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        <header className="mb-4">
          <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
          <h1 className="text-ink-strong text-[24px] font-bold tracking-[-0.02em]">선거 관리</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            후보와 선거인 명부를 정하고, 현황판에서 투표를 시작·마감하세요. 투표는 무기명으로 저장돼요
          </p>
        </header>

        <button
          type="button"
          onClick={() => setComposerTarget(null)}
          className="w-full mb-4 py-3 rounded-2xl bg-brand text-white text-[14.5px] font-bold"
        >
          + 새 선거
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : !elections?.length ? (
          <div className={`${cardCls} px-4 py-12 text-center`}>
            <span className="mx-auto mb-3 flex w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand items-center justify-center">
              <BallotIcon size={24} />
            </span>
            <p className="text-[14px] font-semibold text-ink-strong">등록된 선거가 없습니다</p>
            <p className="mt-1 text-[13px] text-ink-muted">후보 사진과 선거인 명부만 있으면 바로 시작할 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {elections.map((e) => {
              const percent = turnoutPercent(e.voted_count, e.voters_total)
              return (
                <div key={e.id} className={`${cardCls} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[e.status].badge}`}>
                          {phaseLabel(e)}
                        </span>
                      </div>
                      <h3 className="text-[15.5px] font-bold text-ink-strong leading-snug">{e.title}</h3>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {e.seats}명 선출 · 후보 {e.candidate_count}명 · 선거인 {e.voter_count + e.offline_voter_count}명 · {thresholdText(e.rules)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[22px] font-bold text-brand tabular-nums leading-none">
                        {e.elected_count ?? 0}
                        <span className="text-[12px] text-ink-muted font-semibold">/{e.seats}</span>
                      </p>
                      <p className="text-[10.5px] text-ink-muted mt-0.5">당선</p>
                    </div>
                  </div>

                  {e.current_round_no ? (
                    <>
                      <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted tabular-nums">
                        {e.current_round_no}차 투표율 {e.voted_count} / {e.voters_total}명 · {percent}%
                      </p>
                    </>
                  ) : null}

                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBoardId(e.id)}
                      className="flex-[1.4] py-2 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
                    >
                      현황판 · 투표 진행
                    </button>
                    <button
                      type="button"
                      onClick={() => void openEdit(e)}
                      disabled={loadingEdit === e.id}
                      className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                    >
                      {loadingEdit === e.id ? '여는 중…' : '수정'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyLink(e)}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors"
                    >
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
