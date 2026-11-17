import { useEffect, useRef } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion'
import { SEOUL_GEO } from '../missionData'
import { LAND_POLYS, pointInPoly } from '../landGeometry'

// 등불 지도(PC 전용) — 도트 세계 지도 위 선교지마다 등불. 기도 탑승을 마치면
// 서울에서 여객기가 날아가(비행운·고도 따라 크기·그림자) 착륙과 함께 그 나라 등불이 켜진다.
// 색은 Mission.css 의 --lamp-* / --map-* 토큰을 읽는다(라이트는 새벽녘, 다크는 밤).

export interface LampPoint {
  country: string
  lat: number
  lng: number
}

const CENTER_LNG = 60
const TOP_LAT = 76
const BOTTOM_LAT = -46
const FLIGHT_MS = 2600

/** 육지 도트 — 모듈 로드 시 한 번 (2.4° 격자) */
const LAND: [number, number][] = []
for (let lat = 80; lat > -58; lat -= 2.4) {
  for (let lng = -180; lng < 180; lng += 2.4) {
    if (LAND_POLYS.some(p => pointInPoly(lng, lat, p))) LAND.push([lng, lat])
  }
}

/** 위에서 본 여객기 — 기수 +x, 길이 약 22 단위. 반쪽 외곽선을 대칭으로 접는다 */
const PLANE_HALF: [number, number][] = [
  [11, 0], [9.8, -1.1], [7.5, -1.55], [2.6, -1.6], [-1.2, -10.6], [-3.9, -10.6], [-1.9, -1.6],
  [-7.4, -1.3], [-9.5, -4.7], [-11.3, -4.7], [-10.2, -0.9], [-11.2, 0],
]
const PLANE: [number, number][] = [...PLANE_HALF, ...PLANE_HALF.slice(1, -1).reverse().map(([a, b]) => [a, -b] as [number, number])]

const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number, color: string) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.beginPath()
  PLANE.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
  ctx.closePath()
  ctx.fill()
  ctx.beginPath() // 엔진 두 개
  ctx.ellipse(1.2, -5, 1.6, 0.75, 0, 0, Math.PI * 2)
  ctx.ellipse(1.2, 5, 1.6, 0.75, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

interface Colors {
  dot: string
  lamp: string
  core: string
  glow: string // "r,g,b"
  brand: string
  ink: string
  muted: string
  font: string
}

export function LampMap({
  points,
  selectedCountry,
  litCountries,
  flight,
  onSelect,
  onLanded,
  originLabel,
}: {
  /** 출발지(파란 점) 이름 — 예: 대한민국 */
  originLabel?: string
  points: LampPoint[]
  selectedCountry: string | null
  litCountries: ReadonlySet<string>
  /** 새 비행 요청 — id 가 바뀔 때마다 한 번 */
  flight: { country: string; id: number } | null
  onSelect: (country: string) => void
  onLanded: (country: string) => void
}) {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colors = useRef<Colors | null>(null)
  const props = useRef({ points, selectedCountry, litCountries, onSelect, onLanded, originLabel })
  useEffect(() => {
    props.current = { points, selectedCountry, litCountries, onSelect, onLanded, originLabel }
  })
  const flights = useRef<{ country: string; start: number }[]>([])
  const bursts = useRef<{ country: string; start: number }[]>([])
  const lastFlightId = useRef<number | null>(null)

  // 테마가 바뀌면 색 토큰을 다시 읽는다
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const cs = getComputedStyle(el)
    const v = (k: string) => cs.getPropertyValue(k).trim()
    colors.current = {
      dot: v('--map-dot'),
      lamp: v('--lamp'),
      core: v('--lamp-core'),
      glow: v('--lamp-rgb'),
      brand: v('--brand'),
      ink: v('--map-plane'),
      muted: v('--text-muted'),
      font: cs.fontFamily, // 앱 본문 글꼴 그대로
    }
  }, [theme])

  // 새 비행 요청 받기
  useEffect(() => {
    if (!flight || flight.id === lastFlightId.current) return
    lastFlightId.current = flight.id
    if (prefersReducedMotion()) {
      props.current.onLanded(flight.country)
      return
    }
    flights.current.push({ country: flight.country, start: performance.now() })
  }, [flight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0
    let H = 0
    let dots: [number, number][] = []
    const proj = (lng: number, lat: number): [number, number] => {
      let l = lng - CENTER_LNG
      if (l < -180) l += 360
      if (l > 180) l -= 360
      return [((l + 180) / 360) * W, ((TOP_LAT - lat) / (TOP_LAT - BOTTOM_LAT)) * H]
    }
    const resize = () => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = LAND.map(([a, b]) => proj(a, b)).filter(([, y]) => y > -4 && y < H + 4)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const still = prefersReducedMotion()
    let raf = 0
    let visible = true

    const frame = (t: number) => {
      raf = 0
      const c = colors.current
      if (!c || !W) {
        schedule()
        return
      }
      const { points: pts, selectedCountry: sel, litCountries: lit } = props.current
      const sc = Math.max(1, W / 620)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = c.dot
      const ds = Math.max(1.3, W / 420)
      for (const [x, y] of dots) ctx.fillRect(x - ds / 2, y - ds / 2, ds, ds)

      const xy = new Map<string, [number, number]>()
      pts.forEach((p, i) => {
        const [x, y] = proj(p.lng, p.lat)
        xy.set(p.country, [x, y])
        const on = lit.has(p.country)
        const fl = still ? 1 : 0.78 + 0.22 * Math.sin(t / 320 + i * 1.7)
        const r = (on ? 16 : 8) * sc * fl
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `rgba(${c.glow},${on ? 0.95 : 0.5})`)
        g.addColorStop(1, `rgba(${c.glow},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = on ? c.core : c.lamp
        ctx.beginPath()
        ctx.arc(x, y, (on ? 2.8 : 1.8) * sc, 0, Math.PI * 2)
        ctx.fill()
        const isSel = p.country === sel
        if (isSel) {
          ctx.strokeStyle = `rgba(${c.glow},0.75)`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(x, y, (11 + (still ? 0 : 3 * Math.sin(t / 240))) * sc, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.font = `${isSel ? 700 : 500} ${11 * sc}px ${c.font}`
        ctx.fillStyle = isSel ? c.ink : c.muted
        ctx.fillText(p.country, x + 8 * sc, y - 6 * sc)
      })

      const seoul = proj(SEOUL_GEO.lng, SEOUL_GEO.lat)
      ctx.fillStyle = c.brand
      ctx.beginPath()
      ctx.arc(seoul[0], seoul[1], 3.4 * sc, 0, Math.PI * 2)
      ctx.fill()
      // 출발지 이름 — 위엔 중국, 오른쪽엔 일본 이름이 있어 왼쪽 아래에 둔다
      const origin = props.current.originLabel
      if (origin) {
        ctx.font = `700 ${11 * sc}px ${c.font}`
        ctx.fillStyle = c.brand
        ctx.textAlign = 'right'
        ctx.fillText(origin, seoul[0] - 6 * sc, seoul[1] + 13 * sc)
        ctx.textAlign = 'left'
      }

      // 비행 — 이륙·착륙은 천천히, 고도(가운데)일수록 크고 그림자가 멀다
      flights.current = flights.current.filter(f => {
        const to = xy.get(f.country)
        if (!to) return false
        const raw = Math.min((t - f.start) / FLIGHT_MS, 1)
        const p = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2
        const [x1, y1] = seoul
        const [x2, y2] = to
        const mx = (x1 + x2) / 2
        const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.35 - 20
        const B = (u: number): [number, number] => {
          const q = 1 - u
          return [q * q * x1 + 2 * q * u * mx + u * u * x2, q * q * y1 + 2 * q * u * my + u * u * y2]
        }
        ctx.strokeStyle = `rgba(${c.glow},0.22)`
        ctx.lineWidth = 1
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(mx, my, x2, y2)
        ctx.stroke()
        ctx.setLineDash([])
        // 비행운 — 꼬리로 갈수록 가늘고 옅게
        const N = 28
        const from = Math.max(0, p - 0.32)
        ctx.lineCap = 'round'
        for (let k = 0; k < N; k++) {
          const [a0, b0] = B(from + ((p - from) * k) / N)
          const [a1, b1] = B(from + ((p - from) * (k + 1)) / N)
          const w = k / N
          ctx.strokeStyle = `rgba(${c.glow},${(w * 0.65).toFixed(3)})`
          ctx.lineWidth = (0.6 + w * 2.2) * sc
          ctx.beginPath()
          ctx.moveTo(a0, b0)
          ctx.lineTo(a1, b1)
          ctx.stroke()
        }
        const [x, y] = B(p)
        const [fx, fy] = B(Math.min(1, p + 0.008))
        const [bx, by] = B(Math.max(0, p - 0.008))
        const ang = Math.atan2(fy - by, fx - bx)
        const alt = Math.sin(p * Math.PI)
        const size = (0.62 + 0.38 * alt) * sc
        const off = (2 + alt * 9) * sc
        drawPlane(ctx, x + off, y + off, ang, size, 'rgba(0,0,0,0.22)')
        drawPlane(ctx, x, y, ang, size, c.ink)
        if (Math.floor(t / 500) % 2) {
          ctx.fillStyle = '#ff4d4f' // 꼬리 점멸등
          ctx.beginPath()
          ctx.arc(x - Math.cos(ang) * 10.5 * size, y - Math.sin(ang) * 10.5 * size, 1.3 * sc, 0, Math.PI * 2)
          ctx.fill()
        }
        if (raw >= 1) {
          bursts.current.push({ country: f.country, start: t })
          props.current.onLanded(f.country)
          return false
        }
        return true
      })
      // 착륙 — 등불이 켜지며 퍼지는 고리
      bursts.current = bursts.current.filter(b => {
        const k = (t - b.start) / 800
        const at = xy.get(b.country)
        if (k >= 1 || !at) return false
        ctx.strokeStyle = `rgba(${c.glow},${(1 - k) * 0.8})`
        ctx.lineWidth = 2 * sc * (1 - k) + 0.5
        ctx.beginPath()
        ctx.arc(at[0], at[1], (6 + k * 30) * sc, 0, Math.PI * 2)
        ctx.stroke()
        return true
      })
      schedule()
    }
    // 정적 모드(움직임 줄이기)에선 비행이 없으니 1초에 한 번만 다시 그린다
    let slow: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      if (!visible || raf || slow) return
      if (still && flights.current.length === 0) {
        slow = setTimeout(() => {
          slow = null
          raf = requestAnimationFrame(frame)
        }, 1000)
      } else {
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting && document.visibilityState === 'visible'
      if (visible) schedule()
    })
    io.observe(canvas)
    const onVis = () => {
      visible = document.visibilityState === 'visible'
      if (visible) schedule()
    }
    document.addEventListener('visibilitychange', onVis)
    schedule()

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) * W) / rect.width
      const y = ((e.clientY - rect.top) * H) / rect.height
      let best: string | null = null
      let bestD = 30 * 30
      for (const p of props.current.points) {
        const [px, py] = proj(p.lng, p.lat)
        const d = (px - x) ** 2 + (py - y) ** 2
        if (d < bestD) {
          bestD = d
          best = p.country
        }
      }
      if (best) props.current.onSelect(best)
    }
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      if (slow) clearTimeout(slow)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="lamp-map__canvas" aria-hidden="true" />
}
