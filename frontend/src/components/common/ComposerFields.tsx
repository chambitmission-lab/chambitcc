// 일정·모임 작성 폼의 공통 조각 — 라벨 그룹, 빠른 선택 칩, 프리셋 칩,
// 그리고 DatePicker/TimePicker 트리거를 다른 입력과 같은 높이·테두리로 맞추는 클래스.
// EventComposer(어드민)와 CreateGroupMeetingModal(그룹장)이 같은 시각 언어를 쓰게 한다.
import type { ReactNode } from 'react'

interface FieldGroupProps {
  label: string
  required?: boolean
  /** 라벨 오른쪽에 붙는 보조 조작(편집/미리보기 전환 등) */
  action?: ReactNode
  children: ReactNode
}

export const FieldGroup = ({ label, required, action, children }: FieldGroupProps) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
    {children}
  </div>
)

/**
 * 값을 한 번에 채워 넣는 제안 칩(되돌릴 수 있는 지름길).
 * active 를 주지 않으면 항상 브랜드 아웃라인, boolean 이면 현재 값과 같은 칩만 켜진다
 * (게시일 '오늘·내일·모레' 처럼 선택 상태를 비추는 경우).
 */
export const QuickChip = ({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center px-3 h-8 rounded-full text-[11.5px] font-bold border transition-colors',
      active === undefined
        ? 'bg-[var(--brand-soft)] text-brand border-[var(--brand-glow)] hover:bg-[var(--brand-soft-strong)]'
        : active
          ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
          : 'bg-transparent border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] hover:text-brand',
    ].join(' ')}
  >
    {children}
  </button>
)

/** 하나만 선택되는 프리셋 칩 (선택 상태가 곧 현재 값) */
export const ScopeChip = ({
  active,
  onClick,
  disabled = false,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12.5px] font-bold transition-all',
      active
        ? 'bg-brand text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]'
        : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
      disabled ? 'opacity-40 cursor-not-allowed' : '',
    ].join(' ')}
  >
    {children}
  </button>
)

/* 날짜·시간 트리거를 폼의 다른 입력과 같은 높이·테두리로 맞춘다 */
export const dateTriggerClass =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-ink-strong hover:border-brand focus:outline-none focus:border-brand transition-colors flex items-center justify-between gap-2 text-left'

export const subLabelClass =
  'block text-[10.5px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-white/45 mb-1'

/* 텍스트 입력 — 위 트리거와 같은 결 */
export const textInputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'
