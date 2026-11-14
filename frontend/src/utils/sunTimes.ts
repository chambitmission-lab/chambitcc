/* 해 뜨는·지는 시각(ms) — 위도·경도와 날짜만으로 계산한다(네트워크 없음).
 * 표준 일출 방정식(대기 굴절 −0.833° 포함), 오차는 1~2분. 장식(레일 삽화의 해 위치)용이다.
 * 극지방처럼 해가 안 뜨거나 안 지는 날은 null. */
const RAD = Math.PI / 180
const DAY_MS = 86_400_000
const J1970 = 2440587.5
const J2000 = 2451545.0

export interface SunTimes {
  rise: number
  set: number
}

export const sunTimes = (at: number, lat: number, lon: number): SunTimes | null => {
  // 그 지역의 '오늘' — 경도로 어림한 지방시 기준 날짜의 정오 근처를 잡는다
  const localDays = Math.floor((at + (lon / 360) * DAY_MS) / DAY_MS)
  const n = localDays + 0.5 + J1970 - J2000 // 그날 UTC 정오의 J2000 일수
  const jStar = n - lon / 360
  const M = (357.5291 + 0.98560028 * jStar) % 360
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const transit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec)
  if (cosW < -1 || cosW > 1) return null
  const w = Math.acos(cosW) / RAD
  const toMs = (jd: number) => (jd - J1970) * DAY_MS
  return { rise: toMs(transit - w / 360), set: toMs(transit + w / 360) }
}
