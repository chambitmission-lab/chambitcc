/** 위도,경도 문자열 → 좌표. 형식이 깨져 있으면 null (거리 카드가 조용히 사라진다) */
export const parseCoords = (raw: string): { lat: number; lng: number } | null => {
  const [a, b] = raw.split(',').map((v) => Number(v.trim()))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null
  return { lat: a, lng: b }
}

/** 두 좌표 사이 대권거리(km) */
export const haversineKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(to.lat - from.lat)
  const dLng = rad(to.lng - from.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// 직선거리는 실제 도로보다 짧다 — 도심 우회율(detour index) 통상값으로 보정한다.
export const DETOUR = 1.3
export const CAR_KMH = 22 // 도심 평균 주행 속도
export const WALK_KMH = 4.5
