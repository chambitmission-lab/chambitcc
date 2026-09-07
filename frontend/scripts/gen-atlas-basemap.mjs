/**
 * 성경 지도여행(/bible/atlas) 베이스맵 생성기.
 *
 * Natural Earth 1:50m 국가 경계(world-atlas)를 성경 무대(지중해 동부 ~ 메소포타미아)로
 * 잘라내고, 국경을 지운 한 덩어리 육지로 합친 뒤 SVG path 문자열로 굽는다.
 * 결과는 src/pages/Bible/Atlas/data/basemap.ts 에 정적 상수로 커밋된다.
 *
 * 왜 런타임이 아니라 빌드 전 1회인가
 * - 지도 타일/GeoJSON을 런타임에 받으면 요금·오프라인·다크모드 문제가 모두 생긴다.
 * - 성경 시대 지명은 어차피 현대 타일에 없어서 핀은 우리가 그린다. 배경만 있으면 된다.
 * - path 문자열 하나면 색은 CSS 토큰으로 갈아끼울 수 있다(라이트/다크).
 *
 * 실행:
 *   npm install --no-save world-atlas@2 topojson-client@3
 *   node scripts/gen-atlas-basemap.mjs
 *
 * 투영식은 src/pages/Bible/Atlas/projection.ts 와 반드시 같아야 한다.
 * (한쪽만 바꾸면 해안선과 핀이 어긋난다)
 */
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const topojson = require('topojson-client')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/pages/Bible/Atlas/data/basemap.ts')

// ── 투영 (projection.ts 와 동일) ────────────────────────────────
// 성경 무대 전체를 담는 경위도 상자. 서쪽 끝 로마(12.5E), 동쪽 끝 우르(46.1E),
// 남쪽 끝 시내산(28.5N)/상애굽, 북쪽 끝 빌립보(41.0N)·흑해 남안까지.
const BBOX = { west: 9.5, east: 50.5, south: 22, north: 44 }
const VIEW_W = 1000

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const Y_TOP = mercY(BBOX.north)
const Y_BOTTOM = mercY(BBOX.south)
const LON_SPAN = BBOX.east - BBOX.west
// 메르카토르는 경도 1rad 과 위도 1 머케이터 단위의 축척이 같다 — 그 비율로 높이를 정한다
const VIEW_H = (VIEW_W * (Y_TOP - Y_BOTTOM)) / ((LON_SPAN * Math.PI) / 180)

const projectX = (lon) => ((lon - BBOX.west) / LON_SPAN) * VIEW_W
const projectY = (lat) => ((Y_TOP - mercY(lat)) / (Y_TOP - Y_BOTTOM)) * VIEW_H

// ── 대상 국가 (현대 국경은 그리지 않는다, 육지 모양만 쓴다) ──────
// ISO 3166-1 numeric. 상자와 겹치는 나라만 골라야 병합 결과가 세계지도로 부풀지 않는다.
const COUNTRY_IDS = new Set([
  '792', // 튀르키예 (아나톨리아)
  '300', // 그리스
  '380', // 이탈리아
  '470', // 몰타
  '196', // 키프로스 (구브로)
  '760', // 시리아
  '422', // 레바논
  '376', // 이스라엘
  '275', // 팔레스타인
  '400', // 요르단
  '818', // 이집트 (애굽)
  '434', // 리비아
  '368', // 이라크 (바벨론·니느웨·우르)
  '364', // 이란 (바사)
  '682', // 사우디아라비아 (아라비아·미디안)
  '414', // 쿠웨이트
  '051', // 아르메니아 (아라랏)
  '268', // 조지아
  '031', // 아제르바이잔
  '100', // 불가리아
  '807', // 북마케도니아
  '008', // 알바니아
  '499', // 몬테네그로
  '688', // 세르비아
  '642', // 루마니아
  '729', // 수단
  '804', // 우크라이나 (흑해 북안 — 해안선 마감용)
  '643', // 러시아 (흑해 동안 — 해안선 마감용)
  '070', // 보스니아
  '191', // 크로아티아
  '705', // 슬로베니아
  '040', // 오스트리아
  '348', // 헝가리
  '756', // 스위스
  '250', // 프랑스 (이탈리아 서쪽 마감용)
  '788', // 튀니지
  '012', // 알제리
])

// ── Douglas–Peucker 단순화 ─────────────────────────────────────
// 투영 후 화면 좌표에서 수행한다. 화면 폭 1000 기준 0.45 단위(≈0.018°) 이하 굴곡은 버린다.
const TOLERANCE = 0.45

const perpDistance = (p, a, b) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
  const cl = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + cl * dx), p[1] - (a[1] + cl * dy))
}

const simplify = (points, tolerance) => {
  if (points.length < 3) return points
  let maxDist = 0
  let index = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpDistance(points[i], points[0], points[points.length - 1])
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]]
  const left = simplify(points.slice(0, index + 1), tolerance)
  const right = simplify(points.slice(index), tolerance)
  return left.slice(0, -1).concat(right)
}

// 링의 부호 있는 면적 — 너무 작은 섬(화면에서 점보다 작은 것)은 버린다
const ringArea = (points) => {
  let sum = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1])
  }
  return Math.abs(sum / 2)
}

// 화면 밖으로 멀리 나간 링은 통째로 버린다 (상자와 전혀 겹치지 않는 것)
const MARGIN = 120
const intersectsView = (points) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return maxX >= -MARGIN && minX <= VIEW_W + MARGIN && maxY >= -MARGIN && minY <= VIEW_H + MARGIN
}

// 좌표를 상자에서 아주 멀리 두면 path 문자열만 커진다 — 여유를 두고 잘라 붙인다.
// (모양이 깨지지 않도록 자르지 않고 '가두기'만 한다)
const CLAMP = 400
const clampPoint = ([x, y]) => [
  Math.max(-CLAMP, Math.min(VIEW_W + CLAMP, x)),
  Math.max(-CLAMP, Math.min(VIEW_H + CLAMP, y)),
]

const MIN_AREA = 0.8

const round = (n) => {
  const r = Math.round(n * 10) / 10
  return Object.is(r, -0) ? 0 : r
}

const ringToPath = (ring) => {
  const projected = ring.map(([lon, lat]) => clampPoint([projectX(lon), projectY(lat)]))
  if (!intersectsView(projected)) return null
  const simplified = simplify(projected, TOLERANCE)
  if (simplified.length < 3) return null
  if (ringArea(simplified) < MIN_AREA) return null

  let out = ''
  let prev = null
  for (let i = 0; i < simplified.length; i += 1) {
    const x = round(simplified[i][0])
    const y = round(simplified[i][1])
    if (prev && prev[0] === x && prev[1] === y) continue
    out += i === 0 ? `M${x} ${y}` : `L${x} ${y}`
    prev = [x, y]
  }
  return `${out}Z`
}

const main = () => {
  const topology = require('world-atlas/countries-50m.json')
  const geometries = topology.objects.countries.geometries.filter((g) =>
    COUNTRY_IDS.has(String(g.id).padStart(3, '0'))
  )
  if (!geometries.length) throw new Error('대상 국가를 하나도 찾지 못했습니다 — id 목록 확인 필요')

  // 국경을 지우고 한 덩어리 육지로 — 인접국 사이 실선/틈이 남지 않는다
  const merged = topojson.merge(topology, geometries)
  const polygons = merged.type === 'MultiPolygon' ? merged.coordinates : [merged.coordinates]

  const paths = []
  let kept = 0
  let dropped = 0
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const d = ringToPath(ring)
      if (d) {
        paths.push(d)
        kept += 1
      } else {
        dropped += 1
      }
    }
  }

  const landPath = paths.join('')

  // ── 비교용 미니맵 (거리 체감 카드) ────────────────────────
  // "참빛교회에서 같은 거리면 어디까지"를 겹쳐 보여 준다. 가까운 구간은 한반도,
  // 지중해를 가로지르는 먼 구간은 동아시아 판을 쓴다.
  const MINI_MAPS = [
    {
      key: 'KOREA',
      bbox: { west: 124.2, east: 131.4, south: 32.8, north: 39.4 },
      width: 300,
      tolerance: 0.3,
      ids: ['410', '408'],
    },
    {
      key: 'EAST_ASIA',
      bbox: { west: 104, east: 152, south: 19, north: 49 },
      width: 340,
      // 비교용 배경일 뿐이라 해안선은 알아볼 정도만 남긴다 (path 크기 절감)
      tolerance: 1.0,
      ids: ['410', '408', '392', '156', '158', '496', '643', '704', '418', '764', '116'],
    },
  ]

  const miniSources = MINI_MAPS.map(({ key, bbox, width, ids, tolerance }) => {
    const top = mercY(bbox.north)
    const bottom = mercY(bbox.south)
    const lonSpan = bbox.east - bbox.west
    const height = (width * (top - bottom)) / ((lonSpan * Math.PI) / 180)
    const mx = (lon) => ((lon - bbox.west) / lonSpan) * width
    const my = (lat) => ((top - mercY(lat)) / (top - bottom)) * height

    const geoms = topology.objects.countries.geometries.filter((g) =>
      ids.includes(String(g.id).padStart(3, '0'))
    )
    const mergedMini = topojson.merge(topology, geoms)
    const polys =
      mergedMini.type === 'MultiPolygon' ? mergedMini.coordinates : [mergedMini.coordinates]

    const parts = []
    for (const polygon of polys) {
      for (const ring of polygon) {
        const projected = ring.map(([lon, lat]) => [
          Math.max(-width, Math.min(width * 2, mx(lon))),
          Math.max(-height, Math.min(height * 2, my(lat))),
        ])
        if (
          !projected.some(([x, y]) => x >= -20 && x <= width + 20 && y >= -20 && y <= height + 20)
        ) {
          continue
        }
        const simplified = simplify(projected, tolerance)
        if (simplified.length < 3 || ringArea(simplified) < tolerance * 2) continue
        let out = ''
        let prev = null
        for (let i = 0; i < simplified.length; i += 1) {
          const x = round(simplified[i][0])
          const y = round(simplified[i][1])
          if (prev && prev[0] === x && prev[1] === y) continue
          out += i === 0 ? `M${x} ${y}` : `L${x} ${y}`
          prev = [x, y]
        }
        parts.push(`${out}Z`)
      }
    }

    return {
      key,
      path: parts.join(''),
      block: `export const ${key}_MINI = {
  path: '${parts.join('')}',
  west: ${bbox.west},
  east: ${bbox.east},
  south: ${bbox.south},
  north: ${bbox.north},
  width: ${round(width)},
  height: ${round(height)},
} as const`,
    }
  })

  const source = `// 자동 생성 파일 — 직접 수정하지 마세요.
//   생성: node scripts/gen-atlas-basemap.mjs
//   원본: Natural Earth 1:50m (world-atlas), 국경 병합 + Douglas-Peucker 단순화
//
// 좌표계는 projection.ts 의 메르카토르 상자와 동일하다. 둘 중 하나만 바꾸면
// 해안선과 핀이 어긋나므로 반드시 스크립트를 다시 돌릴 것.

/** 성경 무대 육지 — viewBox "0 0 ${round(VIEW_W)} ${round(VIEW_H)}" 기준 SVG path */
export const LAND_PATH = '${landPath}'

// ── 거리 체감 카드용 비교 지도 ────────────────────────────────
// "참빛교회에서 같은 거리면 어디까지"를 원으로 겹쳐 보여 줄 때 쓴다.
// 각 판은 자기 경위도 상자와 viewBox 크기를 함께 들고 있어, 원 반지름을
// km → 화면 단위로 환산할 수 있다 (miniMaps.ts).

${miniSources.map((m) => m.block).join(String.fromCharCode(10, 10))}
`

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, source, 'utf8')

  console.log(`✓ ${OUT}`)
  console.log(`  viewBox      : 0 0 ${round(VIEW_W)} ${round(VIEW_H)}`)
  console.log(`  링           : ${kept}개 사용 / ${dropped}개 제외`)
  console.log(`  육지 path    : ${(landPath.length / 1024).toFixed(1)} KB`)
  for (const m of miniSources) {
    console.log(`  ${m.key.padEnd(12)}: ${(m.path.length / 1024).toFixed(1)} KB`)
  }
}

main()
