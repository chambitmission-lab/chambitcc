// 선교사 한 분 = 기도 노선 하나. 안내판 행·탑승권·등불 지도가 같은 노선 목록을 본다.

import {
  countryCoordinates,
  countryDetail,
  type CountryDetail,
  type Missionary,
  type RegionKey,
} from '../missionData'

export interface PrayerRoute {
  /** 오늘 탑승 기록·선택 상태의 키 — 명단 순서가 바뀌어도 같은 분이면 같은 키 */
  key: string
  missionary: Missionary
  country: string
  region: RegionKey
  detail: CountryDetail
  /** 편명 "M101" — 명단 순번으로 고정 */
  flight: string
}

/** 지리 표(countryDetail)에 있는 나라의 선교사만 노선이 된다 — 좌표·시간대가 없으면 그릴 수 없다 */
export const buildRoutes = (missionaries: Missionary[]): PrayerRoute[] => {
  const seen = new Map<string, number>()
  const routes: PrayerRoute[] = []
  missionaries.forEach((m, i) => {
    const detail = countryDetail[m.country]
    const region = countryCoordinates[m.country]?.region
    if (!detail || !region) return
    const base = `${m.country}|${m.name}`
    const dup = seen.get(base) ?? 0
    seen.set(base, dup + 1)
    routes.push({
      key: dup ? `${base}|${dup}` : base,
      missionary: m,
      country: m.country,
      region,
      detail,
      flight: `M${String(101 + i * 7).padStart(3, '0')}`,
    })
  })
  return routes
}
