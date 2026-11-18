import { useEffect, useRef } from 'react'
import { geoGraticule, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import { useTheme } from '../../../contexts/ThemeContext'
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion'
import {
  BORDERS,
  COUNTRIES,
  COUNTRY_EN,
  LAND,
  ORIGIN,
  ORIGIN_COUNTRY,
  drawFlight,
  easeInOut,
  fitBand,
  lampGlow,
  originMark,
  placeLabels,
  type LabelItem,
  type MapInk,
} from './worldMap'

// 등불 지도(PC 전용) — 항공 노선도. 하늘빛 바다 위 실제 국경, 부천(CBC)에서 선교지마다 노선이 뻗는다.
// 기도 탑승을 마치면 여객기가 노선을 따라 날아가 착륙과 함께 그 나라가 금빛으로 켜진다.
// 2026-11-18 C1 '맑은 바다' 채택(시안 4종 중). 입체감 = 바다 그라데이션·비네트, 해안 얕은 물빛,
// 땅 그림자, 켠 노선 그림자, 핀 그림자. 다크는 깊은 남색 밤바다.
// 이름은 겹치면 우선순위(고른 > 마우스 > 켠 > 나머지)로 숨기고, 평소엔 공항 코드만 단다.

export interface LampPoint {
  country: string
  lat: number
  lng: number
  /** 공항 코드 — 이름표 */
  code: string
}

const FLIGHT_MS = 2600

interface Pal {
  oceanTop: string
  oceanBot: string
  vignette: string
  shallow: string
  grat: string
  landTop: string
  landBot: string
  landShadow: string
  coast: string
  border: string
  tint: string // "r,g,b"
  route: string
  routeDot: string
  pin: string
  pinShadow: string
  pill: string
  /** 어두운 바다 — 안 켠 선교지는 칠하지 않고 금빛 테두리만(옅은 금빛 채움이 회갈색으로 탁해진다) */
  dark: boolean
}

const LIGHT: Pal = {
  oceanTop: '#dcefff',
  oceanBot: '#a9d3f3',
  vignette: 'rgba(30,80,140,0.14)',
  shallow: 'rgba(255,255,255,0.75)',
  grat: 'rgba(255,255,255,0.45)',
  landTop: '#fffdf8',
  landBot: '#f3ecdd',
  landShadow: 'rgba(30,90,150,0.32)',
  coast: 'rgba(120,160,200,0.55)',
  border: 'rgba(200,182,150,0.6)',
  tint: '245,159,0',
  route: 'rgba(40,95,160,0.3)',
  routeDot: 'rgba(40,95,160,0.9)',
  pin: '#ffffff',
  pinShadow: 'rgba(20,60,110,0.35)',
  pill: '#ffffff',
  dark: false,
}

const DARK: Pal = {
  oceanTop: '#0d2546',
  oceanBot: '#050e1e',
  vignette: 'rgba(0,0,0,0.45)',
  shallow: 'rgba(70,160,255,0.32)',
  grat: 'rgba(120,180,255,0.09)',
  landTop: '#21406a',
  landBot: '#162d4c',
  landShadow: 'rgba(0,0,0,0.6)',
  coast: 'rgba(130,190,255,0.45)',
  border: 'rgba(6,16,34,0.85)',
  tint: '255,196,90',
  route: 'rgba(140,195,255,0.3)',
  routeDot: 'rgba(140,195,255,0.9)',
  pin: '#0b1a30',
  pinShadow: 'rgba(0,0,0,0.5)',
  pill: '#1d3354',
  dark: true,
}

// 극점에서 경선이 모여 별처럼 보이지 않게 위도를 자른다
const GRATICULE = geoGraticule().extent([[-180, -58], [180.1, 80.1]]).step([15, 15])()

/** 지도 나라 이름 → 그 나라의 선교지들(중국=중국·위구르, 러시아=러시아·연해주) */
const byCountry = (points: LampPoint[]) =>
  points.reduce<Record<string, string[]>>((acc, p) => {
    const en = COUNTRY_EN[p.country]
    if (en) (acc[en] ??= []).push(p.country)
    return acc
  }, {})

/** 한국 → 목적지 노선 — 진행 방향 위쪽으로 휜 2차 곡선 */
const routeArc = (o: [number, number], to: [number, number]) => {
  const [x1, y1] = o
  const [x2, y2] = to
  const d = Math.hypot(x2 - x1, y2 - y1)
  const nx = -(y2 - y1) / (d || 1)
  const ny = (x2 - x1) / (d || 1)
  const s = ny > 0 ? -1 : 1
  const mx = (x1 + x2) / 2 + nx * d * 0.22 * s
  const my = (y1 + y2) / 2 + ny * d * 0.22 * s
  return {
    mx,
    my,
    d,
    B: (u: number): [number, number] => {
      const q = 1 - u
      return [q * q * x1 + 2 * q * u * mx + u * u * x2, q * q * y1 + 2 * q * u * my + u * u * y2]
    },
  }
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
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
  points: LampPoint[]
  selectedCountry: string | null
  litCountries: ReadonlySet<string>
  /** 새 비행 요청 — id 가 바뀔 때마다 한 번 */
  flight: { country: string; id: number } | null
  onSelect: (country: string) => void
  onLanded: (country: string) => void
  /** 출발지(파란 점) 이름 — 예: 대한민국 */
  originLabel?: string
}) {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ink = useRef<{ c: MapInk; pal: Pal } | null>(null)
  const props = useRef({ points, selectedCountry, litCountries, onSelect, onLanded, originLabel })
  useEffect(() => {
    props.current = { points, selectedCountry, litCountries, onSelect, onLanded, originLabel }
  })
  const flights = useRef<{ country: string; start: number }[]>([])
  const bursts = useRef<{ country: string; start: number }[]>([])
  const lastFlightId = useRef<number | null>(null)
  const hover = useRef<string | null>(null)

  // 테마가 바뀌면 색 토큰을 다시 읽는다
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const cs = getComputedStyle(el)
    const v = (k: string) => cs.getPropertyValue(k).trim()
    const pal = theme === 'dark' ? DARK : LIGHT
    const brand = v('--brand') || '#3182f6'
    ink.current = {
      pal,
      c: {
        lamp: v('--lamp'),
        core: v('--lamp-core'),
        glow: v('--lamp-rgb'),
        brand,
        brandRgb: brand.startsWith('#') ? hexToRgb(brand) : '49,130,246',
        ink: v('--map-plane'),
        muted: v('--text-muted'),
        pill: pal.pill,
        font: cs.fontFamily, // 앱 본문 글꼴 그대로
      },
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
    let proj: GeoProjection = geoNaturalEarth1()
    let xy: { p: LampPoint; x: number; y: number }[] = []
    let xyKey: LampPoint[] | null = null
    // 바다·땅·물들임은 켠 나라·고른 나라·테마가 바뀔 때만 다시 굽는다
    const base = document.createElement('canvas')
    let baseKey = ''

    const project = () => {
      const pts = props.current.points
      if (pts === xyKey) return
      xyKey = pts
      xy = pts.map(p => {
        const [x, y] = proj([p.lng, p.lat])!
        return { p, x, y }
      })
    }

    const resize = () => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // 중심 경도 30° — 페루부터 일본까지 한 장에, 남극·북극해는 잘라 낸다
      proj = fitBand(geoNaturalEarth1().rotate([-30, 0]), W, H, 72, -44, 6, 132)
      xyKey = null
      baseKey = ''
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const renderBase = (pal: Pal, c: MapInk, sc: number) => {
      const { litCountries: lit, selectedCountry: sel, points: pts } = props.current
      const key = `${[...lit].sort().join()}|${sel}|${pal.dark}|${W}x${H}|${pts.length}`
      if (key === baseKey) return
      baseKey = key
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      base.width = Math.round(W * dpr)
      base.height = Math.round(H * dpr)
      const b = base.getContext('2d')!
      b.setTransform(dpr, 0, 0, dpr, 0, 0)
      const path = geoPath(proj, b)

      // 바다 — 위가 밝은 세로 그라데이션 + 가장자리 어둡게
      const sea = b.createLinearGradient(0, 0, 0, H)
      sea.addColorStop(0, pal.oceanTop)
      sea.addColorStop(1, pal.oceanBot)
      b.fillStyle = sea
      b.fillRect(0, 0, W, H)
      const vg = b.createRadialGradient(W * 0.55, H * 0.45, Math.min(W, H) * 0.35, W * 0.55, H * 0.45, Math.max(W, H) * 0.8)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, pal.vignette)
      b.fillStyle = vg
      b.fillRect(0, 0, W, H)
      b.strokeStyle = pal.grat
      b.lineWidth = 0.6
      b.beginPath()
      path(GRATICULE)
      b.stroke()
      // 해안 얕은 물빛 — 땅 윤곽을 두껍게 번지게(filter 미지원 브라우저는 번짐 없이 띠만)
      b.save()
      b.filter = `blur(${5 * sc}px)`
      b.strokeStyle = pal.shallow
      b.lineWidth = 10 * sc
      b.lineJoin = 'round'
      b.beginPath()
      path(LAND)
      b.stroke()
      b.restore()
      // 땅 — 그림자로 바다 위에 띄우고, 위가 밝은 그라데이션
      const land = b.createLinearGradient(0, 0, 0, H)
      land.addColorStop(0, pal.landTop)
      land.addColorStop(1, pal.landBot)
      b.save()
      b.shadowColor = pal.landShadow
      b.shadowBlur = 9 * sc
      b.shadowOffsetY = 3 * sc
      b.fillStyle = land
      b.beginPath()
      path(LAND)
      b.fill()
      b.restore()
      // 선교지 나라 물들임
      const groups = byCountry(pts)
      const outline: typeof COUNTRIES = []
      for (const f of COUNTRIES) {
        const en = f.properties.name
        const names = groups[en]
        let a = 0
        let rgb = pal.tint
        if (en === ORIGIN_COUNTRY) {
          a = 0.75
          rgb = c.brandRgb
        } else if (names) {
          const on = names.some(n => lit.has(n))
          const picked = !!sel && names.includes(sel)
          a = on ? (pal.dark ? 0.78 : 0.62) : picked ? (pal.dark ? 0.5 : 0.42) : pal.dark ? 0 : 0.2
          if (pal.dark && !on) outline.push(f)
        }
        if (!a) continue
        b.fillStyle = `rgba(${rgb},${a})`
        b.beginPath()
        path(f)
        b.fill()
      }
      b.strokeStyle = pal.border
      b.lineWidth = 0.6
      b.beginPath()
      path(BORDERS)
      b.stroke()
      b.strokeStyle = pal.coast
      b.lineWidth = 0.8
      b.beginPath()
      path(LAND)
      b.stroke()
      if (outline.length) {
        b.strokeStyle = `rgba(${pal.tint},0.6)`
        b.lineWidth = 0.9 * sc
        b.beginPath()
        outline.forEach(f => path(f))
        b.stroke()
      }
    }

    const still = prefersReducedMotion()
    let raf = 0
    let visible = true

    const frame = (t: number) => {
      raf = 0
      const k = ink.current
      if (!k || !W) {
        schedule()
        return
      }
      const { c, pal } = k
      const { selectedCountry: sel, litCountries: lit, originLabel: originName } = props.current
      const sc = Math.max(1, W / 620)
      project()
      renderBase(pal, c, sc)
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(base, 0, 0, W, H)
      const o = proj(ORIGIN)! as [number, number]
      ctx.lineCap = 'round'
      // 아직 안 간 노선 — 바다색에 맞춘 가는 점선
      ctx.strokeStyle = pal.route
      ctx.lineWidth = 0.9 * sc
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      for (const { p, x, y } of xy) {
        if (lit.has(p.country) || p.country === sel) continue
        const { mx, my } = routeArc(o, [x, y])
        ctx.moveTo(o[0], o[1])
        ctx.quadraticCurveTo(mx, my, x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
      // 켠 노선·고른 노선 — 그림자를 드리워 떠 있게, 고른 노선은 흐른다
      for (const { p, x, y } of xy) {
        const on = lit.has(p.country)
        const picked = p.country === sel
        if (!on && !picked) continue
        const { mx, my, d } = routeArc(o, [x, y])
        const lift = Math.min(10, d * 0.025) * sc
        ctx.strokeStyle = 'rgba(0,0,0,0.13)'
        ctx.lineWidth = (picked ? 2.2 : 1.6) * sc
        ctx.beginPath()
        ctx.moveTo(o[0], o[1] + 1)
        ctx.quadraticCurveTo(mx, my + lift, x, y + 1)
        ctx.stroke()
        ctx.strokeStyle = `rgba(${pal.tint},${picked ? 1 : 0.85})`
        ctx.lineWidth = (picked ? 2 : 1.4) * sc
        ctx.setLineDash(picked && !on ? [6, 5] : [])
        ctx.lineDashOffset = still ? 0 : -t / 45
        ctx.beginPath()
        ctx.moveTo(o[0], o[1])
        ctx.quadraticCurveTo(mx, my, x, y)
        ctx.stroke()
        ctx.setLineDash([])
      }
      // 공항 핀 — 작은 그림자 위 단추, 켠 곳은 등불
      xy.forEach(({ p, x, y }, i) => {
        const on = lit.has(p.country)
        const picked = p.country === sel
        if (on) lampGlow(ctx, x, y, sc, still ? 1 : 0.8 + 0.2 * Math.sin(t / 320 + i * 1.7), c)
        ctx.save()
        ctx.shadowColor = pal.pinShadow
        ctx.shadowBlur = 3 * sc
        ctx.shadowOffsetY = 1.2 * sc
        ctx.fillStyle = pal.pin
        ctx.beginPath()
        ctx.arc(x, y, (picked ? 3.6 : 3) * sc, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.fillStyle = on || picked ? `rgb(${pal.tint})` : pal.routeDot
        ctx.beginPath()
        ctx.arc(x, y, (picked ? 1.8 : 1.4) * sc, 0, Math.PI * 2)
        ctx.fill()
        if (picked && !still) {
          ctx.strokeStyle = `rgba(${c.glow},0.75)`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(x, y, (10 + 3 * Math.sin(t / 240)) * sc, 0, Math.PI * 2)
          ctx.stroke()
        }
      })
      // 비행
      flights.current = flights.current.filter(f => {
        const to = xy.find(q => q.p.country === f.country)
        if (!to) return false
        const raw = Math.min((t - f.start) / FLIGHT_MS, 1)
        drawFlight(ctx, routeArc(o, [to.x, to.y]).B, easeInOut(raw), sc, t, c)
        if (raw >= 1) {
          bursts.current.push({ country: f.country, start: t })
          props.current.onLanded(f.country)
          return false
        }
        return true
      })
      // 착륙 — 등불이 켜지며 퍼지는 고리
      bursts.current = bursts.current.filter(bu => {
        const kk = (t - bu.start) / 800
        const at = xy.find(q => q.p.country === bu.country)
        if (kk >= 1 || !at) return false
        ctx.strokeStyle = `rgba(${c.glow},${(1 - kk) * 0.8})`
        ctx.lineWidth = 2 * sc * (1 - kk) + 0.5
        ctx.beginPath()
        ctx.arc(at.x, at.y, (6 + kk * 30) * sc, 0, Math.PI * 2)
        ctx.stroke()
        return true
      })
      originMark(ctx, o[0], o[1], sc, t, c, still)
      // 이름표 — 평소엔 공항 코드, 고른·마우스 올린 나라만 이름
      const items: LabelItem[] = []
      if (originName) items.push({ text: `CBC · ${originName}`, x: o[0], y: o[1], priority: 90, kind: 'origin' })
      for (const { p, x, y } of xy) {
        const picked = p.country === sel
        const hov = p.country === hover.current
        items.push({
          text: picked || hov ? p.country : p.code,
          x,
          y,
          priority: picked ? 100 : hov ? 95 : lit.has(p.country) ? 50 : 10,
          kind: picked || hov ? 'pill' : 'code',
        })
      }
      placeLabels(ctx, items, sc, c, W, H)
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

    const pick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) * W) / rect.width
      const y = ((e.clientY - rect.top) * H) / rect.height
      let best: string | null = null
      let bestD = 24 * 24
      for (const q of xy) {
        const d = (q.x - x) ** 2 + (q.y - y) ** 2
        if (d < bestD) {
          bestD = d
          best = q.p.country
        }
      }
      return best
    }
    const onClick = (e: MouseEvent) => {
      const best = pick(e)
      if (best) props.current.onSelect(best)
    }
    const onMove = (e: MouseEvent) => {
      const h = pick(e)
      hover.current = h
      canvas.style.cursor = h ? 'pointer' : 'default'
    }
    const onLeave = () => {
      hover.current = null
    }
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      if (slow) clearTimeout(slow)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="lamp-map__canvas" aria-hidden="true" />
}

export default LampMap
