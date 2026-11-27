// 온라인 헌금 안내 관리 (admin, /admin/offering)
// Single Responsibility: 안내 문구·계좌 조회와 공개/순서/삭제 액션.
// 화면은 OfferingDesk(관리 데스크 — 개요 + 상세 + 성도 화면 미리보기, 2026-11-27),
// 작성·수정은 OfferingComposer. 레거시는 계좌가 바뀌면 HTML을 직접 고쳐야 했다 — 여기서 끝난다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { copyToClipboard } from '../../utils/clipboard'
import {
  useAdminOffering,
  useDeleteOfferingAccount,
  useMoveOfferingAccount,
  useUpdateOfferingAccount,
} from '../../hooks/useOffering'
import { plainAccountNumber, type OfferingAccount } from '../../types/offering'
import OfferingComposer, { type OfferingComposerTarget } from './components/OfferingComposer'
import OfferingDesk from './components/OfferingDesk'
import type { OfferingSel } from './components/offeringDeskUtils'
import { can } from '../../utils/access'

const OfferingManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  const { data, isPending, isError, refetch } = useAdminOffering(admin)
  const guide = data?.guide ?? null
  const accounts = useMemo(() => data?.accounts ?? [], [data])
  const moveAccount = useMoveOfferingAccount()
  const updateAccount = useUpdateOfferingAccount()
  const deleteAccount = useDeleteOfferingAccount()

  const [selected, setSelected] = useState<OfferingSel | null>(null)
  const [composer, setComposer] = useState<OfferingComposerTarget | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('온라인 헌금 안내를 불러오지 못했습니다', 'error')
  }, [isError])

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) showToast(ok, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '실패했습니다', 'error')
    }
  }

  const handleDelete = async (a: OfferingAccount) => {
    if (
      !(await confirmDialog({
        title: '계좌 삭제',
        message: `"${a.label_ko}" 계좌를 지울까요?`,
        description: '되돌릴 수 없어요. 잠시 감추려면 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteAccount.mutateAsync(a.id), '삭제했어요')
  }

  const handleCopyTest = async (a: OfferingAccount) => {
    const text = plainAccountNumber(a.account_number) || a.account_number
    const ok = await copyToClipboard(text)
    showToast(ok ? `${text} 복사됨 — 은행 앱에 붙여넣어 확인해 보세요` : '복사에 실패했습니다', ok ? 'success' : 'error')
  }

  return (
    <>
      <OfferingDesk
        guide={guide}
        accounts={accounts}
        loading={isPending && !data}
        selected={selected}
        onSelect={setSelected}
        onCreateAccount={() => setComposer({ kind: 'account' })}
        onBack={() => navigate(-1)}
        onEditGuide={(g) => setComposer({ kind: 'guide', guide: g })}
        onEditAccount={(a) => setComposer({ kind: 'account', account: a })}
        onToggleAccount={(a) =>
          run(
            () => updateAccount.mutateAsync({ id: a.id, data: { is_active: !a.is_active } }),
            a.is_active ? '숨겼어요' : '성도들에게 공개했어요',
          )
        }
        onMoveAccount={(a, d) => run(() => moveAccount.mutateAsync({ id: a.id, direction: d }))}
        onDeleteAccount={(a) => void handleDelete(a)}
        onCopyTest={(a) => void handleCopyTest(a)}
        onViewPublic={() => navigate('/news?tab=offering')}
      />

      {composer && (
        <OfferingComposer
          key={composer.kind === 'guide' ? 'guide' : `a-${composer.account?.id ?? 'new'}`}
          target={composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            void refetch()
          }}
        />
      )}
    </>
  )
}

export default OfferingManagement
