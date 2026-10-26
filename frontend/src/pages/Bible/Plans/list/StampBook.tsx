// 도장 수첩 — 읽는 중/완주 숫자 + 완주한 플랜마다 도장 하나. (예전 '나의 플랜' 숫자 칸 + '완주한 플랜' 접기)
// 도장을 누르면 그 플랜으로 간다. 빈 칸(+)은 둘러보기로 내려 보내 다음 도전을 권한다.

import type { PlanSummary } from '../../../../types/biblePlan'

// 인주 세 색을 번갈아 — 같은 색 도장이 줄지어 있으면 스티커처럼 보인다
const INKS = [
  'border-[#d26b5e] text-[#c2554a] bg-[#fff9f7] shadow-[inset_0_0_0_2px_#fff9f7,inset_0_0_0_3.5px_rgba(210,107,94,0.5)] dark:bg-[#d26b5e]/[0.08] dark:shadow-none dark:text-[#f0907f]',
  'border-[#3b74d6] text-[#2b62c4] bg-[#f5f9ff] shadow-[inset_0_0_0_2px_#f5f9ff,inset_0_0_0_3.5px_rgba(59,116,214,0.5)] dark:bg-[#3b74d6]/[0.1] dark:shadow-none dark:text-[#8db4f5]',
  'border-[#0f9a6d] text-[#0b8a64] bg-[#f3fbf8] shadow-[inset_0_0_0_2px_#f3fbf8,inset_0_0_0_3.5px_rgba(15,154,109,0.5)] dark:bg-[#0f9a6d]/[0.1] dark:shadow-none dark:text-[#5fd3a8]',
]
const TILT = [-8, 6, -3, 9, -5]
const FOLDED = 5

const StampBook = ({
  activeCount,
  completed,
  expanded,
  onToggle,
  onOpen,
  onFindMore,
}: {
  activeCount: number
  completed: PlanSummary[]
  expanded: boolean
  onToggle: () => void
  onOpen: (plan: PlanSummary) => void
  onFindMore: () => void
}) => {
  const shown = expanded ? completed : completed.slice(0, FOLDED)
  const hidden = completed.length - shown.length
  return (
    <section className="rounded-[20px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] lg:text-[17px] font-extrabold text-ink-strong tracking-[-0.015em]">도장 수첩</h3>
        <span className="flex gap-1.5 text-[11.5px] lg:text-[13px] font-bold">
          <span className="rounded-lg px-2 py-1 bg-[var(--brand-soft)] text-brand">읽는 중 {activeCount}</span>
          <span className="rounded-lg px-2 py-1 bg-emerald-500/[0.1] text-emerald-600 dark:text-emerald-300">
            완주 {completed.length}
          </span>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {shown.map((plan, i) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onOpen(plan)}
            title={`${plan.title} · ${plan.total_days}일 완주`}
            className={`pj-stamp w-16 h-16 rounded-full border-[2.5px] flex flex-col items-center justify-center px-1.5 text-center text-[10px] lg:text-[11px] font-extrabold leading-[1.15] break-keep transition-transform hover:scale-105 ${INKS[i % INKS.length]}`}
            style={{ '--r': `${TILT[i % TILT.length]}deg` } as React.CSSProperties}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="line-clamp-2">{plan.title}</span>
          </button>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={onToggle}
            className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[13px] font-extrabold text-gray-500 dark:text-white/55 hover:bg-[var(--brand-soft-strong)] hover:text-brand"
          >
            +{hidden}
          </button>
        )}
        {expanded && completed.length > FOLDED && (
          <button
            type="button"
            onClick={onToggle}
            className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-bold text-gray-500 dark:text-white/55"
          >
            접기
          </button>
        )}
        <button
          type="button"
          onClick={onFindMore}
          aria-label="새 도장판 고르기"
          className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 dark:border-white/[0.12] flex items-center justify-center text-gray-300 dark:text-white/30 hover:border-brand hover:text-brand transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {completed.length === 0 && (
        <p className="mt-2.5 text-[12px] lg:text-[13.5px] text-gray-400 dark:text-white/45 break-keep">
          플랜을 완주하면 여기에 도장이 하나씩 찍혀요
        </p>
      )}
    </section>
  )
}

export default StampBook
