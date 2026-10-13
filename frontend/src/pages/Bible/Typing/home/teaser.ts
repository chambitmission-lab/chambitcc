/** 내일 이어질 말씀처럼 — 앞 몇 어절만 보여 주고 나머지는 남겨 둔다 */
export const teaser = (text: string, words = 4) => {
  const parts = text.trim().split(/\s+/)
  return parts.length <= words ? text : `${parts.slice(0, words).join(' ')}…`
}
