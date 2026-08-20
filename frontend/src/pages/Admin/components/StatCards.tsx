// 어드민 통계 화면 공용 껍데기 — 말씀 반응 통계에 있던 카드를 대시보드·돌봄 레이더와 공유한다.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export const AdminPageHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate()
  return (
    <div className="sticky top-0 lg:static lg:rounded-t-3xl z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
      >
        <span className="material-icons-outlined">arrow_back</span>
        <span className="text-sm font-semibold">뒤로</span>
      </button>
      <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">{title}</h1>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
        ADMIN
      </span>
    </div>
  )
}

export const SectionCard = ({
  title,
  action,
  children,
}: {
  title: string
  /** 제목 오른쪽에 붙는 보조 텍스트/버튼 (선택) */
  action?: ReactNode
  children: ReactNode
}) => (
  <div className="px-4 pt-4">
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-ink-strong tracking-[-0.01em]">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  </div>
)

export const EmptyHint = ({ text }: { text: string }) => (
  <p className="py-6 text-center text-[12.5px] text-gray-400 dark:text-white/40">{text}</p>
)

export const StatSpinner = ({ label = '집계 중...' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-8 h-8 border-[3px] border-[var(--brand-glow)] border-t-brand rounded-full animate-spin" />
    <p className="text-[13px] text-gray-500 dark:text-white/50">{label}</p>
  </div>
)
