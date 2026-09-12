// 문화교실 화면이 함께 쓰는 카드·폼 클래스.


const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

/* DatePicker 트리거를 이 폼의 입력들과 같은 테두리·높이로 맞춘다 */
const datePickerTriggerClass =
  `${inputClass} flex items-center justify-between gap-2 text-left hover:border-brand`

const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

const cardClass =
  'rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { inputClass, datePickerTriggerClass, labelClass, cardClass }
