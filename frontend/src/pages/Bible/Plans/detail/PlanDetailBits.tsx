// 플랜 상세 소품 — 숫자 자간 · 이름 변경 시트 · 화면 셸 · 진행률 링 · 구분선.

import { useState } from 'react'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { numStyle } from './styles'


// ── Shell (헤더 + 컨테이너) ──
// 나만의 플랜 이름 바꾸기 — 브라우저 prompt 대신 작은 슬라이드업 시트
const RenameSheet = ({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: string
  saving: boolean
  onClose: () => void
  onSave: (title: string) => void
}) => {
  const [value, setValue] = useState(initial)
  useModalBackButton(onClose)
  const canSave = value.trim().length > 0 && value.trim() !== initial && !saving
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave(value.trim())
        }}
        className="w-full sm:max-w-sm bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl border border-black/[0.04] dark:border-white/[0.08] p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]"
      >
        <p className="text-brand text-[10.5px] font-bold tracking-[0.12em]">MY PLAN</p>
        <h3 className="text-[17px] font-bold text-ink-strong tracking-[-0.015em] mt-0.5">플랜 이름 바꾸기</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={120}
          autoFocus
          className="mt-4 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong focus:outline-none focus:border-brand"
        />
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-full text-gray-700 dark:text-white/75 text-[13px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="ml-auto px-5 h-10 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] disabled:opacity-40 disabled:shadow-none"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}

const Shell = ({
  onBack,
  title,
  actions,
  rail,
  children,
}: {
  onBack: () => void
  title: string
  actions?: React.ReactNode
  // rail 을 주면 lg+ 에서 2단(본문 + 우측 위젯 레일), 없으면 기존 좁은 셸 그대로
  rail?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div
      className={
        rail ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12' : ''
      }
    >
    <div
      className={`max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-bottomnav-safe ${
        rail
          ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden'
          : ''
      }`}
    >
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>

    {rail && (
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:sticky lg:top-[4.5rem]">
        {rail}
      </aside>
    )}
    </div>
  </div>
)

// 진행률 링 — 퍼센트 숫자만으로는 안 보이던 "걸어온 만큼"을 원호로 보여준다
const ProgressRing = ({ percent, size = 58 }: { percent: number; size?: number }) => {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200/90 dark:stroke-white/[0.1]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="var(--brand)"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-brand"
        style={numStyle}
      >
        {pct}%
      </span>
    </div>
  )
}

const Divider = () => <span className="w-px h-8 bg-gray-200 dark:bg-white/[0.08]" />

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { RenameSheet, Shell, ProgressRing, Divider }
