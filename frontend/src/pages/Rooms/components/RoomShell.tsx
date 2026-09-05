import { type ReactNode } from 'react'

// ── 셸 — lg+ 는 본문 + 우측 레일 2단 ──
export const Shell = ({
  onBack,
  title,
  actions,
  rail,
  children,
}: {
  onBack: () => void
  title: string
  actions?: ReactNode
  rail?: ReactNode
  children: ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div className={rail ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12' : ''}>
      <div
        className={`max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 ${
          rail ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden' : ''
        }`}
      >
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors" aria-label="뒤로">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">{title}</h1>
          {actions}
        </div>
        {children}
      </div>

      {rail && (
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">{rail}</aside>
      )}
    </div>
  </div>
)
