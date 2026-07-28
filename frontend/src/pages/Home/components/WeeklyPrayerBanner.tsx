// 공동 기도제목 배너 — 공동체 그룹 리스트 카드의 한 행(row)
import { useNavigate } from 'react-router-dom'

const WeeklyPrayerBanner = () => {
  const navigate = useNavigate()

  return (
    // 배경·테두리는 부모 그룹 카드가 담당
    <button
      type="button"
      onClick={() => navigate('/prayer-topics')}
      className="w-full flex items-center gap-2.5 pl-3 pr-4 py-2.5 text-left hover:bg-[var(--brand-soft)] transition-colors"
      aria-label="공동 기도제목 — 이번 주 교회가 함께 드리는 기도"
    >
      <span className="text-base shrink-0" aria-hidden>🙏</span>
      <span className="text-xs font-bold text-[var(--text-strong)] whitespace-nowrap shrink-0">
        공동 기도제목
      </span>
      <span className="flex-1 min-w-0 text-[11px] text-[var(--text-muted)] truncate">
        이번 주 교회가 함께 드리는 기도
      </span>
      <span className="text-brand shrink-0 text-base leading-none" aria-hidden>→</span>
    </button>
  )
}

export default WeeklyPrayerBanner
