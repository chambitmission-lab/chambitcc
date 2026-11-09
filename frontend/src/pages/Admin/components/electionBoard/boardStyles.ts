// 선거 현황판(ElectionBoard)과 오른쪽 진행 패널들이 같이 쓰는 클래스 문자열

export const panelCls = 'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4'
export const ghostBtn =
  'px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-40'
export const chipBtn = (active: boolean) =>
  `shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
    active
      ? 'bg-brand text-white border-transparent'
      : 'border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-brand hover:text-brand'
  }`
