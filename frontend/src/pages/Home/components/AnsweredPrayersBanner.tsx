// 응답의 전당 배너 컴포넌트 — 슬림 카드 (카드 시스템 통일)
import { useNavigate } from 'react-router-dom'
import './AnsweredPrayersBanner.css'

const AnsweredPrayersBanner = () => {
  const navigate = useNavigate()

  return (
    // 공동체 그룹 리스트 카드의 한 행(row) — 배경·테두리는 부모 그룹 카드가 담당
    <button
      type="button"
      onClick={() => navigate('/answered-prayers')}
      className="w-full flex items-center gap-2.5 pl-3 pr-4 py-2.5 text-left hover:bg-[var(--brand-soft)] transition-colors"
      aria-label="응답의 전당 — 하나님께서 응답하신 기도들"
    >
        <span className="answered-sparkle text-base shrink-0" aria-hidden>✨</span>
        <span className="text-xs font-bold text-[var(--text-strong)] whitespace-nowrap shrink-0">
          응답의 전당
        </span>
        <span className="flex-1 min-w-0 text-[11px] text-[var(--text-muted)] truncate">
          하나님께서 응답하신 기도들
        </span>
      <span className="text-brand shrink-0 text-base leading-none" aria-hidden>→</span>
    </button>
  )
}

export default AnsweredPrayersBanner
