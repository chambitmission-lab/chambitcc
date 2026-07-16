import { useNavigate } from 'react-router-dom'
import { useGrowthSummary } from '../../../hooks/useGrowth'

/** 프로필 → 신앙 여정(/growth) 진입 카드 */
const GrowthHook = () => {
  const navigate = useNavigate()
  const hasToken = !!localStorage.getItem('access_token')
  const { data } = useGrowthSummary(hasToken)
  const summary = data?.data

  const teaser =
    summary && summary.has_activity
      ? `함께한 지 ${summary.days_together}일째`
      : '지금까지의 발자취를 한눈에'

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => navigate('/growth')}
        className="
          group relative w-full overflow-hidden text-left
          rounded-2xl px-5 py-4
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
          transition-all duration-200 hover:-translate-y-0.5
        "
      >
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[var(--brand-soft-strong)] blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-brand mb-1">
              나의 신앙 여정
            </div>
            <div className="text-[16px] font-bold text-gray-900 dark:text-white leading-snug tracking-[-0.015em]">
              {teaser}
            </div>
            <div className="text-[12px] text-gray-500 dark:text-white/55 mt-1">
              기도·말씀·묵상·응답을 한 흐름으로 →
            </div>
          </div>
          <div
            className="
              shrink-0 w-12 h-12 rounded-2xl
              bg-brand
              flex items-center justify-center text-2xl
              shadow-[0_4px_12px_var(--brand-glow)]
              group-hover:scale-110 transition-transform
            "
            aria-hidden="true"
          >
            🌱
          </div>
        </div>
      </button>
    </div>
  )
}

export default GrowthHook
