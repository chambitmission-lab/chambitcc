import { KOREA_MINI, EAST_ASIA_MINI } from './data/basemap'
import { distanceKm } from './projection'

// "이 거리가 얼마나 먼가"를 몸으로 느끼게 하는 계산.
//
// 숫자만으로는 아무 느낌이 없다. 하란에서 세겜까지 700km 라고 쓰면 그냥 숫자지만,
// "부천 참빛교회에서 오사카쯤"이라고 하면 그제야 놀란다. 초보자에게 지도여행이
// 통하는 지점이 정확히 여기라서, 비교 기준을 우리 교회로 잡았다.

/** 참빛교회 (경기도 부천시 상동) — 비교의 기준점 */
export const CHURCH = { lat: 37.4855, lng: 126.753, name: '참빛교회' } as const

/** 고대 육로 대상(隊商)의 하루 행군 거리 */
const WALK_KM_PER_DAY = 30
/** 고대 지중해 범선의 순풍 하루 항해 거리 */
const SAIL_KM_PER_DAY = 120

export interface RefPlace {
  name: string
  lat: number
  lng: number
}

// 비교 지점 — 국내는 촘촘하게, 국외는 지중해를 가로지르는 긴 구간용.
// 동아시아 미니맵 상자(104–152E, 19–49N) 안에 있는 곳만 넣는다.
const REFERENCES: RefPlace[] = [
  { name: '인천', lat: 37.456, lng: 126.705 },
  { name: '수원', lat: 37.264, lng: 127.029 },
  { name: '춘천', lat: 37.881, lng: 127.73 },
  { name: '대전', lat: 36.351, lng: 127.385 },
  { name: '속초', lat: 38.207, lng: 128.591 },
  { name: '전주', lat: 35.824, lng: 127.148 },
  { name: '대구', lat: 35.871, lng: 128.601 },
  { name: '광주', lat: 35.16, lng: 126.851 },
  { name: '목포', lat: 34.812, lng: 126.392 },
  { name: '부산', lat: 35.18, lng: 129.075 },
  { name: '제주', lat: 33.499, lng: 126.531 },
  { name: '후쿠오카', lat: 33.59, lng: 130.402 },
  { name: '오사카', lat: 34.694, lng: 135.502 },
  { name: '베이징', lat: 39.904, lng: 116.407 },
  { name: '상하이', lat: 31.23, lng: 121.474 },
  { name: '도쿄', lat: 35.69, lng: 139.692 },
  { name: '블라디보스토크', lat: 43.116, lng: 131.885 },
  { name: '타이베이', lat: 25.033, lng: 121.565 },
  { name: '홍콩', lat: 22.319, lng: 114.169 },
]

export interface MiniMapDef {
  path: string
  west: number
  east: number
  south: number
  north: number
  width: number
  height: number
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

/** 미니맵 좌표 변환 */
export const miniProject = (map: MiniMapDef, lat: number, lng: number) => {
  const top = mercY(map.north)
  const bottom = mercY(map.south)
  return {
    x: ((lng - map.west) / (map.east - map.west)) * map.width,
    y: ((top - mercY(lat)) / (top - bottom)) * map.height,
  }
}

/**
 * km → 미니맵 단위.
 * 메르카토르는 위도가 달라지면 축척도 달라지지만, 여기서는 중심(교회) 위도의
 * 축척으로 그린 원 하나면 충분하다 — 정확한 등거리선이 아니라 "이만큼"을
 * 보여 주는 장치다.
 */
export const kmToUnits = (map: MiniMapDef, km: number, atLat: number): number => {
  const unitsPerDegLon = map.width / (map.east - map.west)
  const kmPerDegLon = 111.32 * Math.cos((atLat * Math.PI) / 180)
  return (km / kmPerDegLon) * unitsPerDegLon
}

export interface DistanceFeel {
  km: number
  /** 이동 방식에 따른 어림 일수 */
  days: number
  mode: 'walk' | 'sail'
  /** 겹쳐 그릴 비교 지도 */
  map: MiniMapDef
  /** 지도에서 이 거리에 가장 가까운 익숙한 지점 */
  nearest: RefPlace
  /** 그 지점까지의 실제 거리 (km) */
  nearestKm: number
}

/** 한반도 안에서 원이 어색해지지 않는 상한 — 이보다 멀면 동아시아 판으로 */
const KOREA_MAX_KM = 300

export const distanceFeelOf = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  bySea: boolean
): DistanceFeel => {
  const km = distanceKm(from, to)
  const perDay = bySea ? SAIL_KM_PER_DAY : WALK_KM_PER_DAY
  const days = Math.max(1, Math.round(km / perDay))

  const map = km <= KOREA_MAX_KM ? KOREA_MINI : EAST_ASIA_MINI

  let nearest = REFERENCES[0]
  let nearestKm = distanceKm(CHURCH, REFERENCES[0])
  let bestGap = Math.abs(nearestKm - km)
  for (const ref of REFERENCES) {
    const refKm = distanceKm(CHURCH, ref)
    // 지도 밖에 있는 비교 지점은 원과 함께 보여 줄 수 없으니 제외
    if (ref.lng < map.west || ref.lng > map.east || ref.lat < map.south || ref.lat > map.north) {
      continue
    }
    const gap = Math.abs(refKm - km)
    if (gap < bestGap) {
      bestGap = gap
      nearest = ref
      nearestKm = refKm
    }
  }

  return { km, days, mode: bySea ? 'sail' : 'walk', map, nearest, nearestKm }
}

/** 320 → '320km', 1180 → '1,180km' */
export const formatKm = (km: number): string => Math.round(km).toLocaleString('ko-KR')

/** 받침 유무에 따라 을/를 을 고른다 — "부산을", "대구를" */
const objectParticle = (word: string): string => {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return '를' // 한글이 아니면 기본값
  return (last - 0xac00) % 28 === 0 ? '를' : '을'
}

/** 비교 문장 — "부산을 훌쩍 지나는 거리" 처럼 읽히게 */
export const comparisonSentence = (feel: DistanceFeel): string => {
  const name = feel.nearest.name
  const ratio = feel.km / feel.nearestKm
  if (ratio > 1.35) return `${name}${objectParticle(name)} 훌쩍 지나는 거리`
  if (ratio < 0.7) return `${name}에 못 미치는 거리`
  return `${name}쯤 되는 거리`
}
