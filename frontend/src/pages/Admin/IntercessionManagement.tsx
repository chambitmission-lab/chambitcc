// 관리자 — 누군가의 기도 (교회 전체 익명 중보 짝) 운영 (/admin/intercession)
//
// 할 수 있는 일: 열기/닫기, 첫 주일을 기다리지 않고 지금 주기 시작, 신고된 익명 편지 처리.
// 짝 배정은 매월 첫 주일 아침 7시 스케줄러가 한다.
// 익명 원칙상 누가 누구를 위해 기도하는지는 이 화면에도 보여 주지 않는다 — 숫자만.
// 화면은 IntercessionDesk(관리 데스크 — 운영 현황·신고 목록 + 상세, 2026-11-27). 여기는 데이터·확인창·액션.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useIntercessionAdmin,
  useIntercessionLetterReports,
  useResolveIntercessionReport,
  useSetIntercessionOpen,
  useStartIntercessionNow,
} from '../../hooks/useIntercession'
import { can } from '../../utils/access'
import { showToast, toastFeedback } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import IntercessionDesk from './components/IntercessionDesk'

const IntercessionManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  const { data, isPending } = useIntercessionAdmin(admin)
  const { data: reports } = useIntercessionLetterReports(admin)

  const setOpen = useSetIntercessionOpen(
    toastFeedback({
      success: (d) => (d.open ? '누군가의 기도를 열었어요' : '누군가의 기도를 닫았어요'),
      error: '설정을 바꾸지 못했어요',
    }),
  )
  const startNow = useStartIntercessionNow(
    toastFeedback({ success: '이번 주기를 시작하고 짝을 정했어요', error: '주기를 시작하지 못했어요' }),
  )
  const resolve = useResolveIntercessionReport(
    toastFeedback({
      success: (_d, v) => (v.restore ? '편지를 받은 편지함에 되돌렸어요' : '숨김을 확정했어요'),
      error: '신고를 처리하지 못했어요',
    }),
  )

  const onToggle = async () => {
    if (!data) return
    if (data.open) {
      const ok = await confirmDialog({
        title: '누군가의 기도 닫기',
        message: '메뉴·홈 카드·신청이 숨겨지고\n새 주기 배정과 저녁 알림도 멈춥니다.',
        description: '참여 기록과 짝은 그대로 남아, 다시 열면 이어집니다.',
        confirmText: '닫기',
        tone: 'warning',
      })
      if (!ok) return
    }
    setOpen.mutate(!data.open)
  }

  const onStartNow = async () => {
    const ok = await confirmDialog({
      title: '지금 주기 시작',
      message: '첫 주일을 기다리지 않고 지금 참여자들의 짝을 정합니다.\n참여자 모두에게 알림이 갑니다.',
      description: '이번 주기는 다음 달 첫 주일 전날까지 이어집니다.',
      confirmText: '지금 시작',
      tone: 'warning',
    })
    if (ok) startNow.mutate()
  }

  return (
    <IntercessionDesk
      data={data}
      loading={isPending}
      reports={reports ?? []}
      busy={{ toggling: setOpen.isPending, starting: startNow.isPending, resolving: resolve.isPending }}
      onBack={() => navigate(-1)}
      onToggleOpen={() => void onToggle()}
      onStartNow={() => void onStartNow()}
      onResolve={(r, restore) => resolve.mutate({ id: r.id, restore })}
      onViewPublic={() => navigate('/intercession')}
    />
  )
}

export default IntercessionManagement
