/**
 * 번역 문구의 자리표시자를 채운다 — `fill(t('groupsTodaySummary'), { count: 3, prayed: 5 })`.
 * t() 는 문자열만 돌려주므로 {count} 같은 값은 호출부에서 채운다. 없는 키는 그대로 둔다.
 */
export const fill = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
