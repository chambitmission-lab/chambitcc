import type { CultureApplicationStatus } from '../../../types/culture'

export const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardClass =
  'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

export const STATUS_LABEL: Record<CultureApplicationStatus, string> = {
  pending: '접수 대기',
  confirmed: '등록 완료',
  cancelled: '취소됨',
}

export const STATUS_BADGE: Record<CultureApplicationStatus, string> = {
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  confirmed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  cancelled:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/40 dark:border-white/[0.08]',
}

export const EMPTY_CLASS_FORM = {
  title: '',
  description: '',
  instructor: '',
  schedule: '',
  fee: '',
  capacity: '',
  location: '',
  quarter: '',
  is_open: true,
  is_active: true,
  display_order: 0,
}

export type ClassForm = typeof EMPTY_CLASS_FORM

export const EMPTY_NOTICE_FORM = { title: '', content: '', is_active: true }
export type NoticeForm = typeof EMPTY_NOTICE_FORM
