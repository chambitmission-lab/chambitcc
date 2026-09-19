// 좌석 예약 관리 — 행사를 만들고(배치 편집), 예약을 받고, 현황판에서 접수·입장을 관리한다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeatEvent } from '../../api/seatEvent'
import {
  useAdminSeatEvents,
  useDeleteSeatEvent,
  useUpdateSeatEventStatus,
} from '../../hooks/useSeatEvents'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import type { SeatEventDetail, SeatEventStatus, SeatEventSummary } from '../../types/seatEvent'
import { STATUS_META, cardCls, formatShort } from '../Seats/seatShared'
import { SeatIcon } from '../Seats/seatUi'
import SeatEventComposer from './components/SeatEventComposer'
import SeatBoard from './components/SeatBoard'

const SeatEventManagement = () => {
  const navigate = useNavigate()
  const { data: events, isLoading } = useAdminSeatEvents()

  const [composerTarget, setComposerTarget] = useState<SeatEventDetail | null | undefined>(undefined)
  const [boardFor, setBoardFor] = useState<SeatEventSummary | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const setStatus = useUpdateSeatEventStatus(toastFeedback({ success: '상태를 바꿨어요' }))
  const remove = useDeleteSeatEvent(toastFeedback({ success: '행사를 삭제했어요' }))

  const openEdit = async (e: SeatEventSummary) => {
    try {
      setLoadingEdit(e.id)
      // 목록에는 배치가 없으므로 편집 전에 상세를 받아온다
      setComposerTarget(await getSeatEvent(e.id))
    } catch {
      showToast('행사를 불러오지 못했습니다', 'error')
    } finally {
      setLoadingEdit(null)
    }
  }

  const confirmDelete = async (e: SeatEventSummary) => {
    const ok = await confirmDialog({
      title: '행사를 삭제할까요?',
      message: `'${e.title}'`,
      description: e.reserved_count
        ? `예약 ${e.reserved_count}석(${e.holder_count}팀)도 함께 사라집니다. 복구할 수 없습니다.`
        : '복구할 수 없습니다.',
      confirmText: '삭제',
      tone: 'danger',
    })
    if (ok) remove.mutate(e.id)
  }

  const copyLink = async (e: SeatEventSummary) => {
    const url = `${window.location.origin}${window.location.pathname}#/seats/${e.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('예약 링크를 복사했어요. 단톡방에 붙여넣어 주세요', 'success')
    } catch {
      showToast(url, 'info')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        <header className="mb-4">
          <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
          <h1 className="text-ink-strong text-[24px] font-bold tracking-[-0.02em]">좌석 예약 관리</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            콘서트·특별 행사의 좌석을 배치하고, 예약·입장을 한 화면에서 관리하세요
          </p>
        </header>

        <button
          type="button"
          onClick={() => setComposerTarget(null)}
          className="w-full mb-4 py-3 rounded-2xl bg-brand text-white text-[14.5px] font-bold"
        >
          + 새 좌석 예약 행사
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : !events?.length ? (
          <div className={`${cardCls} px-4 py-12 text-center`}>
            <span className="mx-auto mb-3 flex w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand items-center justify-center">
              <SeatIcon size={24} />
            </span>
            <p className="text-[14px] font-semibold text-ink-strong">등록된 행사가 없습니다</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              ‘본당 좌우 2블록’ 배치로 바로 시작할 수 있어요
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => {
              const ratio = e.total_seats ? e.reserved_count / e.total_seats : 0
              return (
                <div key={e.id} className={`${cardCls} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[e.status].badge}`}>
                          {STATUS_META[e.status].label}
                        </span>
                        {e.status === 'open' && !e.is_booking_open ? (
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]">
                            기간 밖
                          </span>
                        ) : null}
                        {e.event_id ? (
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]">
                            일정 연결
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-[15.5px] font-bold text-ink-strong leading-snug">{e.title}</h3>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {e.performance_at ? formatShort(e.performance_at) : '일시 미정'}
                        {e.venue ? ` · ${e.venue}` : ''} · 1인 {e.max_per_user}석
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[22px] font-bold text-brand tabular-nums leading-none">
                        {e.reserved_count}
                        <span className="text-[12px] text-ink-muted font-semibold">/{e.total_seats}</span>
                      </p>
                      <p className="text-[10.5px] text-ink-muted mt-0.5">예약 {e.holder_count}팀</p>
                    </div>
                  </div>

                  <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    {(['draft', 'open', 'closed'] as SeatEventStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus.mutate({ id: e.id, status: s })}
                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                          e.status === s
                            ? 'bg-brand text-white border-transparent'
                            : 'border-gray-200 dark:border-white/[0.08] text-ink-muted hover:border-brand hover:text-brand'
                        }`}
                      >
                        {s === 'draft' ? '준비 중' : s === 'open' ? '예약 받기' : '마감'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBoardFor(e)}
                      className="flex-[1.4] py-2 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
                    >
                      현황판 · 입장
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
        <SeatEventComposer
          event={composerTarget}
          onClose={() => setComposerTarget(undefined)}
          onSaved={() => setComposerTarget(undefined)}
        />
      ) : null}

      {boardFor ? <SeatBoard summary={boardFor} onClose={() => setBoardFor(null)} /> : null}
    </div>
  )
}

export default SeatEventManagement
