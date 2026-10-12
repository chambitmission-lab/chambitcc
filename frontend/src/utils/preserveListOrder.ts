/**
 * 조용한 재조회가 화면 순서를 흔들지 않게 한다.
 *
 * 홈 기도 목록은 지난 세션의 첫 페이지를 복원해 즉시 그린 뒤 백그라운드로 다시 받는다.
 * 관심순 점수는 10분마다 다시 계산되므로 새 응답은 순서가 달라져 있고, 그대로 덮어쓰면
 * 읽던 카드들이 자리를 바꾼다. 재조회의 목적은 카운트·'기도했어요' 상태를 맞추는 것이지
 * 재배열이 아니므로, 새 응답의 "내용"은 쓰되 "순서"는 화면에 있던 것을 따른다.
 *
 * - 화면에 있던 항목: 그 순서 그대로, 값은 새 응답의 것으로 교체
 * - 새 응답에만 있는 항목(새 기도·순위가 오른 기도): 서버가 준 위치에 끼워 넣는다
 * - 새 응답에 없는 항목(삭제·비공개·뒤 페이지로 밀림): 뺀다
 */
export const preserveListOrder = <T extends { id: number }>(cached: readonly T[], fresh: readonly T[]): T[] => {
  if (cached.length === 0) return [...fresh]
  const freshById = new Map(fresh.map((item) => [item.id, item]))
  const result: T[] = []
  const seen = new Set<number>()
  for (const old of cached) {
    const next = freshById.get(old.id)
    if (next && !seen.has(old.id)) {
      result.push(next)
      seen.add(old.id)
    }
  }
  // 서버 위치(index) 오름차순으로 끼워 넣어야 앞 항목이 밀려도 상대 순서가 유지된다
  fresh.forEach((item, index) => {
    if (seen.has(item.id)) return
    seen.add(item.id)
    result.splice(Math.min(index, result.length), 0, item)
  })
  return result
}
