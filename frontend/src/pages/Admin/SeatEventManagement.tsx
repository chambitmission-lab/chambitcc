// 좌석 예약 관리 (admin, /admin/seats)
// Single Responsibility: 좌석 행사 목록 조회와 상태 전환/삭제/링크 복사/수정 열기 액션.
// 화면은 SeatDesk(관리 데스크 — 상태별 목록 + 상세·현황판을 그 자리에서, 2026-11-27),
// 현황판(배치도·명단·대리 예약·입장)은 SeatBoard, 배치 편집은 SeatEventComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeatEvent } from '../../api/seatEvent'
import { useAdminSeatEvents, useDeleteSeatEvent, useUpdateSeatEventStatus } from '../../hooks/useSeatEvents'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import type { SeatEventDetail, SeatEventStatus, SeatEventSummary } from '../../types/seatEvent'
import SeatEventComposer from './components/SeatEventComposer'
import SeatBoard from './components/SeatBoard'
import SeatDesk from './components/SeatDesk'
import { filterSeatEvents, seatLink } from './components/seatDeskUtils'

const STATUS_TOAST: Record<SeatEventStatus, string> = {
  draft: '준비 중으로 돌렸어요 — 성도에게 안 보여요',
  open: '예약을 열었어요',
  closed: '예약을 마감했어요',
}

const SeatEventManagement = () => {
  const navigate = useNavigate()
  const { data: events = [], isLoading } = useAdminSeatEvents()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // undefined = 닫힘, null = 새 행사, SeatEventDetail = 수정
  const [composerTarget, setComposerTarget] = useState<SeatEventDetail | null | undefined>(undefined)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const setStatus = useUpdateSeatEventStatus(
    toastFeedback<SeatEventDetail, { id: number; status: SeatEventStatus }>({ success: (_d, v) => STATUS_TOAST[v.status], error: '상태를 바꾸지 못했어요' }),
  )
  const remove = useDeleteSeatEvent(toastFeedback({ success: '행사를 지웠어요', error: '지우지 못했어요' }))

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
      title: '행사를 지울까요?',
      message: `'${e.title}'`,
      description: e.reserved_count
        ? `예약 ${e.reserved_count}석(${e.holder_count}팀)도 함께 사라져요. 되돌릴 수 없어요. 예약만 그만 받으려면 마감을 쓰세요.`
        : '되돌릴 수 없어요.',
      confirmText: '네, 지울게요',
      tone: 'danger',
    })
    if (ok) remove.mutate(e.id)
  }

  const copyLink = async (e: SeatEventSummary) => {
    const url = seatLink(e.id)
    try {
      await navigator.clipboard.writeText(url)
      showToast(
        e.status === 'draft' ? '링크를 복사했어요 — 아직 준비 중이라 성도는 열 수 없어요' : '예약 링크를 복사했어요. 단톡방에 붙여넣어 주세요',
        e.status === 'draft' ? 'info' : 'success',
      )
    } catch {
      showToast(url, 'info')
    }
  }

  const filtered = useMemo(() => filterSeatEvents(events, searchTerm), [events, searchTerm])

  return (
    <>
      <SeatDesk
        events={events}
        filtered={filtered}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposerTarget(null)}
        onBack={() => navigate(-1)}
        editingId={loadingEdit}
        renderBoard={(e) => <SeatBoard key={e.id} summary={e} />}
        onEdit={(e) => void openEdit(e)}
        onSetStatus={(e, status) => setStatus.mutate({ id: e.id, status })}
        onDelete={(e) => void confirmDelete(e)}
        onCopyLink={(e) => void copyLink(e)}
        onView={(e) => navigate(`/seats/${e.id}`)}
      />

      {composerTarget !== undefined && (
        <SeatEventComposer event={composerTarget} onClose={() => setComposerTarget(undefined)} onSaved={() => setComposerTarget(undefined)} />
      )}
    </>
  )
}

export default SeatEventManagement
