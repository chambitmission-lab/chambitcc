// 문항 종류 전략이 함께 쓰는 클래스·상수 — 컴포넌트 파일(parts)과 떼어 둔다(react-refresh 규칙)

/* large 일 때 입력칸에 덧붙이는 PC 크기 */
export const LARGE_INPUT = 'lg:px-4 lg:py-3.5 lg:rounded-2xl lg:text-[17px]'

export const bigInputCls = (large?: boolean) => (large ? LARGE_INPUT : '')

/* 관리자 빌더의 종류별 부가 설정 작은 입력칸 */
export const settingInputCls =
  'px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]'

export const settingLabelCls = 'flex items-center gap-1.5 text-ink'

export const STAR_PATH = 'M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z'

/** 별점 만점 — 설정이 없거나 0 이하면 5 */
export const ratingMax = (max?: number): number => (typeof max === 'number' && max > 0 ? max : 5)
