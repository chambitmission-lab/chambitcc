// 설문 날짜 계산 — 홈 배너(엔트리 번들)도 쓰므로 surveyShared 의 문항·상태 표와 떼어 작게 둔다
/** 마감일까지 남은 날 — 오늘 마감이면 0, 이미 지났으면 음수 */
export const daysLeft = (endsAt?: string | null): number | null => {
  if (!endsAt) return null
  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) return null
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfDay(end) - startOfDay(new Date())) / 86400000)
}
