// 공동 기도제목 배너 — 공동체 그룹 리스트 카드의 한 행(row).
// 이번 주 기도제목이 있으면 제목들이 잔잔히 순환하며 살아있는 느낌을 준다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCurrentWeeklyPrayer } from '../../../api/weeklyPrayer'

const ROTATE_MS = 4200

const WeeklyPrayerBanner = () => {
  const navigate = useNavigate()

  // 홈 진입마다 두드리지 않게 길게 캐시 — 주간 단위 데이터라 신선도 부담이 없다
  const { data } = useQuery({
    queryKey: ['weeklyPrayer', 'current', 'homeBanner'],
    queryFn: getCurrentWeeklyPrayer,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const itemTitles = (data?.items ?? []).map((i) => i.title).filter(Boolean)
  const prayedCount = data?.prayed_user_count ?? 0
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (itemTitles.length < 2) return
    const timer = window.setInterval(
      () => setIdx((i) => (i + 1) % itemTitles.length),
      ROTATE_MS
    )
    return () => window.clearInterval(timer)
  }, [itemTitles.length])

  return (
    // 배경·테두리는 부모 그룹 카드가 담당
    <button
      type="button"
      onClick={() => navigate('/prayer-topics')}
      className="w-full flex items-center gap-2.5 pl-3 pr-4 py-2.5 text-left hover:bg-[var(--brand-soft)] transition-colors"
      aria-label="공동 기도제목 — 이번 주 교회가 함께 드리는 기도"
    >
      <span
        className="w-8 h-8 rounded-[10px] bg-[var(--brand-soft-strong)] flex items-center justify-center text-[15px] shrink-0"
        aria-hidden
      >
        🙏
      </span>
      <span className="text-xs font-bold text-[var(--text-strong)] whitespace-nowrap shrink-0">
        공동 기도제목
      </span>

      <span className="flex-1 min-w-0 overflow-hidden">
        {itemTitles.length > 0 ? (
          <span
            key={idx}
            className="wp-rotate block text-[11px] text-[var(--text-strong)] truncate"
          >
            <span className="text-[var(--text-muted)]">이번 주 · </span>
            {itemTitles[idx]}
          </span>
        ) : (
          <span className="block text-[11px] text-[var(--text-muted)] truncate">
            이번 주 교회가 함께 드리는 기도
          </span>
        )}
      </span>

      {prayedCount > 0 && (
        <span className="shrink-0 text-[10px] font-bold text-brand bg-[var(--brand-soft)] px-1.5 py-0.5 rounded-full">
          함께 {prayedCount}
        </span>
      )}
      <span className="text-brand shrink-0 text-base leading-none" aria-hidden>→</span>

      <style>{`
        @keyframes wp-rise {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: none; }
        }
        .wp-rotate { animation: wp-rise 0.45s ease; }
        @media (prefers-reduced-motion: reduce) {
          .wp-rotate { animation: none; }
        }
      `}</style>
    </button>
  )
}

export default WeeklyPrayerBanner
