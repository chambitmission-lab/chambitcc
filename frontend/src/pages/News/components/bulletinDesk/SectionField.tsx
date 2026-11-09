import type { ReactNode } from 'react'
import { DAYS, normalizeDay } from './deskParsers'
import type { SectionId } from './deskSections'

// ── 섹션 · 필드 ──────────────────────────────────
export const Section = ({
  id,
  title,
  hint,
  action,
  children,
}: {
  id: SectionId
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section data-desk-section={id} className="scroll-mt-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1 h-5 rounded-full bg-[var(--brand)]" />
      <h2 className="text-[19px] font-bold text-ink-strong tracking-[-0.01em]">{title}</h2>
      {hint && <span className="min-w-0 truncate text-[12.5px] text-gray-400 dark:text-white/40">{hint}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
    <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-5 space-y-4">
      {children}
    </div>
  </section>
)

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block">
    <span className="flex items-baseline gap-2 mb-1.5">
      <span className="text-[13.5px] font-semibold text-gray-600 dark:text-white/70">{label}</span>
      {hint && <span className="text-[12px] text-gray-400 dark:text-white/40">{hint}</span>}
    </span>
    {children}
  </label>
)

export const DayPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const norm = normalizeDay(value)
  return (
    <div className="flex gap-0.5">
      {DAYS.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={[
            'h-10 rounded-lg text-[13px] font-bold transition-colors',
            d === '주일' ? 'px-1.5' : 'w-7',
            norm === d
              ? 'bg-brand text-white'
              : 'text-gray-500 dark:text-white/55 hover:bg-[var(--brand-soft)] hover:text-brand',
          ].join(' ')}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
