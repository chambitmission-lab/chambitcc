/** 재생 시간(초) → 'm:ss'. 아직 길이를 모르면(NaN·Infinity·음수) '0:00' */
export const formatClock = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
