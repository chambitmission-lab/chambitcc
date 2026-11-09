import { confirmDialog } from '../../../../utils/confirmDialog'
import { ghostBtn, panelCls } from './boardStyles'

// ── 결과 발표 알림 ──────────────────────────────────────────────────────

export const AnnouncePanel = ({
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
