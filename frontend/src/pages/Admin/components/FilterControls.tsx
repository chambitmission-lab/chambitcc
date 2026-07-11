// 어드민 목록 화면 공용 필터 UI — 7개 관리 페이지에 복붙돼 있던 것을 통합.
import type { ReactNode } from 'react'

// align='start'(기본): 칩이 여러 줄로 감길 때 라벨을 첫 줄에 맞춤.
// align='center': 칩이 한 줄뿐인 화면에서 라벨을 세로 중앙에.
export const FilterRow = ({
  label,
  children,
  align = 'start',
}: {
  label: string
  children: ReactNode
  align?: 'start' | 'center'
}) => (
  <div className={`flex ${align === 'center' ? 'items-center' : 'items-start'} gap-2 flex-wrap`}>
    <span
      className={`text-[11px] font-semibold text-gray-500 dark:text-white/45 w-9 shrink-0 ${
        align === 'center' ? '' : 'pt-1'
      }`}
    >
      {label}
    </span>
    <div className="flex gap-1.5 flex-wrap min-w-0">{children}</div>
  </div>
)

export const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
      active
        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
        : 'text-gray-500 dark:text-white/45 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100/70 dark:hover:bg-white/[0.04]'
    }`}
  >
    {children}
  </button>
)
