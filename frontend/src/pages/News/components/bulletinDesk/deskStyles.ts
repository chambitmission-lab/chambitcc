// ── 스타일 조각 ──────────────────────────────────
export const inputCls =
  'w-full h-10 px-3 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.09] ' +
  'text-[14.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none transition-colors ' +
  'hover:border-gray-300 dark:hover:border-white/[0.16] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft-strong)]'
export const textareaCls = inputCls.replace('h-10', 'min-h-[84px]') + ' py-2.5 leading-[1.6] resize-y [field-sizing:content]'
export const chipCls =
  'inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold border transition-colors ' +
  'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-[var(--brand)] hover:text-brand hover:bg-[var(--brand-soft)]'
export const iconBtnCls =
  'w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 dark:text-white/40 transition-colors ' +
  'hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-ink-strong disabled:opacity-30 disabled:pointer-events-none'

