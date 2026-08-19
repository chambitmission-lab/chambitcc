/**
 * 도트 지구본 — 선교지 위치를 3D 구체(오소그래픽 투영) 위에 표현한다.
 * 라이브러리 없이 canvas 2D로 그린다:
 *  - 대륙: 근사 다각형(실제 위경도)을 도트 격자로 채운 뒤 앞면만 투영
 *  - 파송 아크: 서울 → 선교지 대권(great-circle) 경로 + 고도 lift, 대시 흐름 애니
 *  - 활성 대륙/선택 국가로 부드럽게 회전, 드래그로 자유 회전, 점 탭 → 국가 선택
 * 라이트 테마는 흰 구체 + 파란 도트(참고 시안), 다크는 남색 구체 + 시안 도트.
 */
import { memo, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

export interface GlobePoint {
  country: string
  lat: number
  lng: number
  color: string
  active: boolean
}

interface WorldGlobeProps {
  points: GlobePoint[]
  onHover?: (country: string | null) => void
  onSelect?: (country: string) => void
  selectedCountry?: string | null
  /** true면 지구 전체가 보이게 축소, false면 활성 대륙이 화면을 채우게 확대 */
  zoomOut?: boolean
}

const RAD = Math.PI / 180

/** 파송의 출발점 — 서울 실좌표 */
const SEOUL = { lat: 37.57, lng: 126.98 }

/**
 * 대륙 근사 다각형 [lng, lat][] — 정확한 국경이 아니라 도트로 채웠을 때
 * 실루엣이 읽히는 수준의 손그림 외곽선. 실제 위경도 좌표계라 선교지
 * 실좌표(countryDetail)와 어긋나지 않는다.
 */
const LAND_POLYS: [number, number][][] = [
  // 북아메리카 (알래스카~멕시코)
  [[-168, 66], [-155, 71], [-140, 70], [-125, 72], [-110, 73], [-95, 74], [-80, 73], [-70, 68], [-60, 60], [-65, 50], [-70, 45], [-75, 40], [-78, 34], [-81, 30], [-83, 27], [-90, 29], [-95, 27], [-97, 23], [-100, 18], [-95, 15], [-92, 14], [-105, 20], [-110, 24], [-117, 32], [-124, 40], [-125, 48], [-132, 55], [-140, 60], [-152, 60], [-160, 58], [-166, 62]],
  // 그린란드
  [[-52, 61], [-45, 60], [-30, 68], [-20, 76], [-30, 82], [-55, 82], [-60, 75]],
  // 남아메리카
  [[-77, 8], [-70, 11], [-62, 10], [-55, 5], [-50, 0], [-44, -3], [-38, -7], [-35, -9], [-39, -15], [-41, -22], [-48, -27], [-53, -34], [-58, -39], [-62, -41], [-65, -47], [-68, -52], [-72, -54], [-73, -46], [-73, -37], [-71, -30], [-70, -18], [-75, -14], [-80, -6], [-80, 0], [-77, 4]],
  // 유럽 본토
  [[-9, 43], [-8, 37], [-6, 36], [0, 38], [3, 42], [8, 44], [12, 38], [16, 38], [15, 41], [19, 42], [23, 36], [26, 38], [28, 41], [30, 45], [35, 45], [40, 47], [45, 48], [48, 52], [45, 58], [38, 60], [30, 60], [25, 58], [20, 55], [12, 54], [5, 52], [0, 50], [-5, 48]],
  // 스칸디나비아
  [[5, 58], [10, 63], [15, 68], [25, 70], [30, 70], [28, 65], [22, 60], [18, 57], [12, 56], [8, 58]],
  // 영국·아일랜드
  [[-10, 52], [-6, 55], [-5, 58], [-2, 58], [0, 53], [1, 51], [-5, 50]],
  // 아프리카
  [[-17, 15], [-16, 20], [-10, 28], [-6, 34], [0, 36], [10, 37], [12, 33], [20, 32], [30, 31], [33, 28], [35, 22], [38, 18], [43, 11], [48, 11], [51, 10], [45, 2], [41, -3], [40, -10], [36, -18], [33, -26], [28, -33], [20, -35], [17, -30], [14, -22], [12, -15], [9, -6], [8, 3], [4, 6], [-5, 5], [-10, 6], [-14, 10]],
  // 마다가스카르
  [[44, -16], [48, -13], [50, -16], [48, -22], [45, -25], [43, -21]],
  // 아라비아 반도
  [[35, 30], [40, 32], [45, 30], [50, 26], [55, 25], [58, 23], [55, 17], [50, 15], [45, 13], [43, 17], [40, 20], [36, 25]],
  // 유라시아 본토 (러시아·중앙아·중국·인도·동남아·한반도)
  [[45, 48], [50, 55], [55, 62], [65, 68], [75, 72], [90, 75], [105, 77], [120, 73], [135, 71], [150, 70], [165, 67], [179, 66], [179, 62], [170, 60], [160, 58], [155, 52], [145, 50], [135, 45], [130, 42], [128, 39], [126, 35], [122, 30], [121, 25], [115, 22], [108, 18], [105, 12], [103, 7], [100, 10], [98, 15], [94, 18], [90, 22], [88, 21], [85, 18], [80, 12], [77, 8], [73, 15], [70, 20], [66, 24], [62, 25], [58, 26], [56, 30], [52, 32], [48, 35], [46, 40], [44, 44]],
  // 일본 열도
  [[130, 32], [132, 34], [135, 35], [138, 36], [140, 38], [141, 41], [143, 44], [145, 44], [142, 40], [140, 35], [136, 33], [132, 31]],
  // 수마트라
  [[95, 5], [99, 2], [103, -2], [106, -6], [103, -5], [99, -1], [95, 3]],
  // 자바
  [[105, -6], [110, -7], [114, -8], [110, -8.5], [106, -7.5]],
  // 보르네오
  [[109, 1], [113, 4], [117, 6], [118, 1], [115, -2], [111, -2]],
  // 술라웨시
  [[119, 0], [122, 1], [124, -1], [121, -3], [119, -2]],
  // 뉴기니
  [[131, -1], [136, -2], [141, -3], [146, -6], [143, -8], [138, -7], [133, -4]],
  // 필리핀
  [[120, 18], [122, 16], [124, 12], [125, 8], [122, 8], [120, 13], [119, 16]],
  // 오스트레일리아
  [[114, -22], [113, -25], [115, -32], [118, -35], [124, -33], [130, -32], [136, -35], [140, -38], [147, -38], [150, -34], [153, -28], [151, -24], [146, -19], [142, -13], [137, -12], [132, -11], [126, -14], [122, -18], [118, -20]],
  // 뉴질랜드
  [[173, -35], [176, -38], [174, -41], [170, -44], [167, -46], [170, -43], [173, -39]],
]

const pointInPoly = (x: number, y: number, poly: [number, number][]) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * 도트 육지 — 위도별로 경도 간격을 1/cosφ 보정해 구체 위에서 도트 간격이
 * 균일해 보이게 한다(적도 기준 3°). 모듈 로드 시 1회 계산, ~1천 점.
 */
const LAND_DOTS: { lat: number; lng: number }[] = (() => {
  const dots: { lat: number; lng: number }[] = []
  const step = 3
  let row = 0
  for (let lat = -55; lat <= 80; lat += step, row++) {
    const stepLng = step / Math.max(0.35, Math.cos(lat * RAD))
    const offset = row % 2 === 1 ? stepLng / 2 : 0
    for (let lng = -180 + offset; lng < 180; lng += stepLng) {
      if (LAND_POLYS.some(poly => pointInPoly(lng, lat, poly))) {
        dots.push({ lat, lng })
      }
    }
  }
  return dots
})()

/** 위경도 → 단위 구면 벡터 */
const toVec = (lat: number, lng: number): [number, number, number] => {
  const φ = lat * RAD
  const λ = lng * RAD
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)]
}

/** 단위 벡터 → 위경도 */
const toGeo = (v: [number, number, number]): { lat: number; lng: number } => ({
  lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD,
  lng: Math.atan2(v[1], v[0]) / RAD,
})

/** 대권 보간(slerp) — 서울→선교지 아크의 경로 샘플 */
const slerp = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const ang = Math.acos(dot)
  if (ang < 1e-6) return a
  const s = Math.sin(ang)
  const w1 = Math.sin((1 - t) * ang) / s
  const w2 = Math.sin(t * ang) / s
  return [
    a[0] * w1 + b[0] * w2,
    a[1] * w1 + b[1] * w2,
    a[2] * w1 + b[2] * w2,
  ]
}

/** 경도 차이를 -180~180으로 정규화 — 회전 애니가 항상 짧은 쪽으로 돌게 */
const wrapLng = (d: number) => ((d + 540) % 360) - 180

interface Projected {
  x: number
  y: number
  /** 시선 방향 코사인 — 양수면 앞면 */
  z: number
}

const WorldGlobe = ({ points, onHover, onSelect, selectedCountry, zoomOut }: WorldGlobeProps) => {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 렌더 루프가 매 프레임 읽는 값 전부 ref — React 재렌더 없이 애니메이션
  const propsRef = useRef({ points, selectedCountry, zoomOut, theme })
  propsRef.current = { points, selectedCountry, zoomOut, theme }
  const onHoverRef = useRef(onHover)
  onHoverRef.current = onHover
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // 카메라 상태(현재/목표) — 목표를 향해 매 프레임 감쇠 보간
  const camRef = useRef({ lat: 25, lng: 100, r: 0, targetLat: 25, targetLng: 100, targetR: 0 })
  // 드래그하면 자동 회전 목표 추적을 멈춘다 — 대륙/선택이 바뀌면 다시 추적
  const freeRef = useRef(false)

  // 대륙 탭·국가 선택이 바뀌면 그 지점을 향해 회전 목표를 갱신
  useEffect(() => {
    const cam = camRef.current
    freeRef.current = false
    const sel = selectedCountry
      ? points.find(p => p.country === selectedCountry)
      : null
    const actives = points.filter(p => p.active)
    const focus = sel ?? null
    if (focus) {
      cam.targetLat = focus.lat
      cam.targetLng = focus.lng
    } else if (actives.length) {
      // 활성 대륙 중심(단순 평균) — 같은 대륙 안이라 경도 랩 문제 없음
      cam.targetLat = actives.reduce((s, p) => s + p.lat, 0) / actives.length
      cam.targetLng = actives.reduce((s, p) => s + p.lng, 0) / actives.length
    }
    cam.targetLat = Math.max(-60, Math.min(60, cam.targetLat))
  }, [points, selectedCountry])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = false
    let cssW = 0
    let cssH = 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = wrap.clientWidth
      cssH = wrap.clientHeight
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    /** 현재 카메라에서 필요한 반지름 — 활성 점들이 화면 안에 들어오는 확대 배율 */
    const desiredRadius = () => {
      const { points: pts, zoomOut: out } = propsRef.current
      const minDim = Math.min(cssW, cssH)
      if (out) return minDim * 0.47
      const cam = camRef.current
      const c = toVec(cam.targetLat, cam.targetLng)
      let maxAng = 0.25
      for (const p of pts) {
        if (!p.active) continue
        const v = toVec(p.lat, p.lng)
        const dot = Math.max(-1, Math.min(1, c[0] * v[0] + c[1] * v[1] + c[2] * v[2]))
        maxAng = Math.max(maxAng, Math.acos(dot))
      }
      const fit = (minDim * 0.42) / Math.sin(Math.min(maxAng * 1.15, Math.PI / 2))
      return Math.max(minDim * 0.47, Math.min(minDim * 1.5, fit))
    }

    const project = (lat: number, lng: number, R: number, cx: number, cy: number): Projected => {
      const cam = camRef.current
      const φ = lat * RAD
      const λ = (lng - cam.lng) * RAD
      const φ0 = cam.lat * RAD
      const cosφ = Math.cos(φ)
      const z = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * cosφ * Math.cos(λ)
      return {
        x: cx + R * cosφ * Math.sin(λ),
        y: cy - R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * cosφ * Math.cos(λ)),
        z,
      }
    }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    const draw = (now: number) => {
      const { points: pts, selectedCountry: sel, theme: th } = propsRef.current
      const dark = th === 'dark'
      const cam = camRef.current
      const cx = cssW / 2
      const cy = cssH / 2

      // 카메라 보간 — 목표를 향해 감쇠 (드래그 중엔 freeRef로 목표 추적 정지)
      cam.targetR = desiredRadius()
      if (cam.r === 0) cam.r = cam.targetR
      const ease = reduceMotion ? 1 : 0.075
      if (!freeRef.current) {
        cam.lat += (cam.targetLat - cam.lat) * ease
        cam.lng += wrapLng(cam.targetLng - cam.lng) * ease
      }
      cam.r += (cam.targetR - cam.r) * ease
      const R = cam.r

      ctx.clearRect(0, 0, cssW, cssH)

      // ── 대기 글로우 + 구체 ──
      const glow = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18)
      glow.addColorStop(0, dark ? 'rgba(56,189,248,0.22)' : 'rgba(59,130,246,0.16)')
      glow.addColorStop(1, 'rgba(56,189,248,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2)
      ctx.fill()

      const sphere = ctx.createRadialGradient(
        cx - R * 0.3, cy - R * 0.35, R * 0.1,
        cx, cy, R,
      )
      if (dark) {
        sphere.addColorStop(0, 'rgba(37,64,124,0.55)')
        sphere.addColorStop(0.65, 'rgba(15,28,62,0.75)')
        sphere.addColorStop(1, 'rgba(6,13,32,0.95)')
      } else {
        sphere.addColorStop(0, '#ffffff')
        sphere.addColorStop(0.7, '#f2f7fd')
        sphere.addColorStop(1, '#dbe7f5')
      }
      ctx.fillStyle = sphere
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = dark ? 'rgba(125,211,252,0.22)' : 'rgba(148,163,184,0.45)'
      ctx.lineWidth = 1
      ctx.stroke()

      // ── 도트 육지 (앞면만) ──
      ctx.fillStyle = dark ? 'rgba(125,211,252,0.32)' : 'rgba(37,99,235,0.34)'
      const dotR = Math.max(1.1, R * 0.012)
      for (const d of LAND_DOTS) {
        const p = project(d.lat, d.lng, R, cx, cy)
        if (p.z <= 0.02) continue
        const s = 0.55 + 0.45 * p.z // 가장자리로 갈수록 작고 옅게 — 입체감
        ctx.globalAlpha = s
        ctx.beginPath()
        ctx.arc(p.x, p.y, dotR * s, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── 파송 아크 (활성 대륙 + 선택 국가) ──
      const seoulVec = toVec(SEOUL.lat, SEOUL.lng)
      const dashShift = reduceMotion ? 0 : now * 0.012
      for (const p of pts) {
        const isSel = sel === p.country
        if (!p.active && !isSel) continue
        const v = toVec(p.lat, p.lng)
        const N = 36
        ctx.beginPath()
        let pen = false
        for (let i = 0; i <= N; i++) {
          const t = i / N
          const lift = 1 + 0.14 * Math.sin(Math.PI * t) // 대권 위로 살짝 떠오르는 고도
          const g = toGeo(slerp(seoulVec, v, t))
          const pr = project(g.lat, g.lng, R * lift, cx, cy)
          if (pr.z > -0.06) {
            if (pen) ctx.lineTo(pr.x, pr.y)
            else ctx.moveTo(pr.x, pr.y)
            pen = true
          } else {
            pen = false
          }
        }
        ctx.strokeStyle = p.color
        ctx.globalAlpha = isSel ? 0.95 : 0.55
        ctx.lineWidth = isSel ? 1.6 : 1.1
        ctx.setLineDash([2.5, 5.5])
        ctx.lineDashOffset = -dashShift
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }

      // ── 서울 마커 ──
      const sp = project(SEOUL.lat, SEOUL.lng, R, cx, cy)
      if (sp.z > 0) {
        ctx.fillStyle = 'rgba(56,189,248,0.25)'
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.font = '700 9px Pretendard, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = dark ? 'rgba(224,242,254,0.9)' : 'rgba(3,105,161,0.9)'
        ctx.fillText('SEOUL', sp.x, sp.y - 11)
      }

      // ── 선교지 점 ──
      const pulse = reduceMotion ? 0.5 : (Math.sin(now * 0.004) + 1) / 2
      let labelTarget: { p: GlobePoint; pr: Projected } | null = null
      for (const p of pts) {
        const pr = project(p.lat, p.lng, R, cx, cy)
        if (pr.z <= 0) continue
        const isSel = sel === p.country
        if (isSel) labelTarget = { p, pr }
        const core = isSel ? 5.5 : p.active ? 4 : 2.4
        if (p.active || isSel) {
          // 은은한 halo + 맥동 링
          ctx.fillStyle = p.color
          ctx.globalAlpha = isSel ? 0.28 : 0.18
          ctx.beginPath()
          ctx.arc(pr.x, pr.y, core + 6 + pulse * 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        ctx.beginPath()
        ctx.arc(pr.x, pr.y, core, 0, Math.PI * 2)
        ctx.fillStyle = isSel ? '#ffffff' : p.color
        ctx.globalAlpha = p.active || isSel ? 1 : 0.35
        ctx.fill()
        if (isSel) {
          ctx.strokeStyle = p.color
          ctx.lineWidth = 2
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // ── 선택 국가 라벨 ──
      if (labelTarget) {
        const { p, pr } = labelTarget
        ctx.font = '700 11px Pretendard, sans-serif'
        const w = ctx.measureText(p.country).width + 16
        const x = Math.max(6, Math.min(cssW - w - 6, pr.x - w / 2))
        const above = pr.y > 44
        const y = above ? pr.y - 30 : pr.y + 12
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.95
        roundRect(x, y, w, 20, 10)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(p.country, x + w / 2, y + 14)
      }
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // 화면에 보일 때만 그린다 — 스크롤로 벗어나면 배터리 절약
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 }
    )
    io.observe(wrap)

    // ── 포인터: 드래그 회전 + 탭 선택 + 호버 ──
    let dragging = false
    let moved = 0
    let lastX = 0
    let lastY = 0

    /** 화면 좌표에서 가장 가까운 앞면 선교지 점 (탭 반경 22px) */
    const hitTest = (x: number, y: number): GlobePoint | null => {
      const cam = camRef.current
      const cx = cssW / 2
      const cy = cssH / 2
      let best: GlobePoint | null = null
      let bestD = 22
      for (const p of propsRef.current.points) {
        const pr = project(p.lat, p.lng, cam.r, cx, cy)
        if (pr.z <= 0) continue
        const d = Math.hypot(pr.x - x, pr.y - y)
        if (d < bestD) {
          bestD = d
          best = p
        }
      }
      return best
    }

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (!dragging) {
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
        canvas.style.cursor = hit ? 'pointer' : 'grab'
        onHoverRef.current?.(hit?.country ?? null)
        return
      }
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 4) {
        freeRef.current = true
        const cam = camRef.current
        const speed = 0.28 * (200 / Math.max(120, cam.r))
        cam.lng = ((cam.lng - dx * speed + 540) % 360) - 180
        // 세로로 시작한 터치는 touch-action: pan-y로 브라우저가 스크롤로 가져가
        // 여기까지 오지 않는다 — 들어온 드래그의 dy는 안심하고 회전에 쓴다
        cam.lat = Math.max(-75, Math.min(75, cam.lat + dy * speed))
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (moved <= 6) {
        const rect = canvas.getBoundingClientRect()
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
        if (hit) onSelectRef.current?.(hit.country)
      }
    }
    // 브라우저가 제스처를 스크롤로 가져갈 때(pointercancel)는 탭 판정 금지 —
    // 세로 스크롤 시작이 근처 점 선택으로 오인되는 모바일 오탭 방지
    const onPointerCancel = () => {
      dragging = false
    }
    const onPointerLeave = () => {
      onHoverRef.current?.(null)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className="world-globe" role="img" aria-label="참빛교회 해외 선교 지구본">
      <canvas ref={canvasRef} className="world-globe__canvas" />
    </div>
  )
}

export default memo(WorldGlobe)
