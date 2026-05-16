// 응답의 전당 배너 컴포넌트 — 슬림 카드 (카드 시스템 통일)
import { useNavigate } from 'react-router-dom'
import './AnsweredPrayersBanner.css'

const AnsweredPrayersBanner = () => {
  const navigate = useNavigate()

  return (
    <section className="px-4 py-1.5">
      <button
        type="button"
        onClick={() => navigate('/answered-prayers')}
        className="answered-prayers-banner w-full rounded-2xl border flex items-center gap-2.5 px-4 py-2.5 text-left active:scale-[0.99] transition-all"
        aria-label="응답의 전당 — 하나님께서 응답하신 기도들"
      >
        <span className="answered-sparkle text-base shrink-0" aria-hidden>✨</span>
        <span className="text-xs font-bold text-purple-900 dark:text-purple-100 whitespace-nowrap shrink-0">
          응답의 전당
        </span>
        <span className="flex-1 min-w-0 text-[11px] text-purple-800/70 dark:text-purple-200/70 truncate">
          하나님께서 응답하신 기도들
        </span>
        <span className="text-purple-500 dark:text-purple-300 shrink-0 text-base leading-none" aria-hidden>→</span>
      </button>
    </section>
  )
}

export default AnsweredPrayersBanner
