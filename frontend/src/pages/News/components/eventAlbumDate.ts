import type { Translate } from '../../../locales'

export const formatEventDate = (value: string, t: Translate): string => {
  // 'YYYY-MM-DD' — 타임존 보정 없이 그대로 읽는다 (행사일은 날짜 개념)
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const days = t('newsWeekdays').split(',')
  const weekday = days[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday})`
}
