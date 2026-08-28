/** "위도,경도" 문자열 → 좌표. 형식이 깨져 있으면 null (지도가 안내 카드로 대체된다) */
export const parseCoords = (raw: string): { lat: number; lng: number } | null => {
  const [a, b] = raw.split(',').map((v) => Number(v.trim()))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null
  return { lat: a, lng: b }
}
