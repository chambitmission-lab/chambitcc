import { useMemo } from 'react'
import { LAND_POLYS, pointInPoly } from './landGeometry'
import { countryDetail } from './missionData'

/**
 * 국가 카드 배경의 미니 지역 지도 — 지구본과 같은 대륙 도트 데이터를
 * 해당 국가 좌표 중심으로 잘라 도트 실루엣으로 깔고, 그 위에 위치 핀을 얹는다.
 * 위도에 따른 가로 왜곡은 cos(중심 위도)로 보정해 도트 간격이 균일해 보인다.
 */

const RAD = Math.PI / 180
/** 창의 위도 반경(°) — 국가 주변이 이만큼 보인다 */
const SPAN_LAT = 11
const STEP = 1.5

const cache = new Map<string, { x: number; y: number }[]>()

const dotsFor = (country: string): { x: number; y: number }[] => {
  const hit = cache.get(country)
  if (hit) return hit
  const geo = countryDetail[country]
  const dots: { x: number; y: number }[] = []
  if (geo) {
    const cosC = Math.max(0.35, Math.cos(geo.lat * RAD))
    const scale = 100 / (SPAN_LAT * 2) // viewBox 단위 / 위도 1°
    const lngHalf = SPAN_LAT / cosC
    let row = 0
    for (let lat = geo.lat - SPAN_LAT; lat <= geo.lat + SPAN_LAT; lat += STEP, row++) {
      const stepLng = STEP / cosC
      const offset = row % 2 ? stepLng / 2 : 0
      for (let lng = geo.lng - lngHalf + offset; lng <= geo.lng + lngHalf; lng += stepLng) {
        // 경도 랩 정규화 — 180° 부근(연해주 등)에서도 폴리곤 판정이 맞도록
        const nlng = ((lng + 540) % 360) - 180
        if (!LAND_POLYS.some(poly => pointInPoly(nlng, lat, poly))) continue
        dots.push({
          x: Math.round((50 + (lng - geo.lng) * cosC * scale) * 10) / 10,
          y: Math.round((50 - (lat - geo.lat) * scale) * 10) / 10,
        })
      }
    }
  }
  cache.set(country, dots)
  return dots
}

export default function CountryMiniMap({ country }: { country: string }) {
  const dots = useMemo(() => dotsFor(country), [country])
  if (!countryDetail[country]) return null

  return (
    <svg
      className="group-map-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g className="mini-land">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="1" />
        ))}
      </g>
      {/* 위치 핀 — 꼭짓점이 국가 좌표(중앙) */}
      <g className="mini-pin">
        <path d="M50 53C46.2 48.6 44.5 46.3 44.5 43.6a5.5 5.5 0 1 1 11 0C55.5 46.3 53.8 48.6 50 53Z" />
        <circle className="mini-pin-hole" cx="50" cy="43.5" r="2.1" />
      </g>
    </svg>
  )
}
