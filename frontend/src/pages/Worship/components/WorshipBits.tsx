// 예배 화면 소품 — 상태 배지.

import { useLanguage } from '../../../contexts/LanguageContext'
import type { ServiceStatus } from './worshipTime'

const STATUS_KEY = {
  waiting: 'worshipStatusWaiting',
  open: 'worshipStatusOpen',
  ongoing: 'worshipStatusOngoing',
  ended: 'worshipStatusEnded'
} as const

const StatusChip = ({ status }: { status: ServiceStatus }) => {
  const { t } = useLanguage()
  return (
    <span className={`worship-status worship-status--${status}`}>
      <span className="worship-status-dot" aria-hidden />
      {t(STATUS_KEY[status])}
    </span>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { StatusChip }
