// 목양칼럼 '편지 도착' 표지의 계절 입자 — 봄 벚꽃잎 · 여름 초록잎(밤엔 반딧불) · 가을 단풍 · 겨울 눈.
// 오른쪽 나무 쪽에서 편지 쪽으로 날아오고, 일부는 편지 위에 내려앉았다 사라진다.
// 시안: /#/dev/ministry-redesign?v=a2&season=…  (dev/MinistryRedesignPreview.tsx)
// 동작 줄이기 설정이면 그리지 않는다.

import { useEffect, useRef, type RefObject } from 'react'
import type { LetterSeason } from './letterSeason'

const LEAF_COLORS = ['#e2672a', '#d9481f', '#f0a12b', '#c8361b', '#e8892c']

// CSS 키프레임(점 몇 개를 직선으로 잇고 등속 회전)은 "기계적으로 어색하다"는 피드백 →
// 캔버스 한 장에 매 프레임 간단한 물리로 그린다.
//  - 낙엽/꽃잎: 진자처럼 좌우로 흔들리며(흔들림 끝에서 느려지고 가운데서 빨라짐) 기울기도 따라감,
//    앞뒤로 뒤집힘(가로 폭 cos), 천천히 바뀌는 바람, 깊이(멀수록 작고 느리고 옅게)
//  - 편지에 닿으면 미끄러지듯 멈추고, 납작하게 누운 채 잠시 있다가 사라짐
//  - 눈: 깊이별 속도, 작은 흔들림, 편지 위에선 천천히 녹듯 사라짐
//  - 반딧불: 매끄럽게 방향을 바꾸며 떠다니고, 제각각 느리게 밝아졌다 어두워짐

type Shape = 'maple' | 'petal' | 'leaf' | 'snow'

interface FxSpec {
  shape: Shape
  count: number
  colors: string[]
  /** 기본 크기(px, 깊이 1 기준) */
  size: [number, number]
  /** 떨어지는 속도(px/s) */
  fall: [number, number]
  /** 좌우 흔들림 폭(px)·주기(Hz) */
  swayAmp: [number, number]
  swayHz: [number, number]
  /** 앞뒤 뒤집힘 속도(rad/s) */
  flip: [number, number]
  /** 왼쪽(편지 쪽)으로 부는 바람 기본값(px/s, 음수=왼쪽) */
  wind: number
  /** 시작 x 범위(폭 비율) */
  startX: [number, number]
  /** 편지에 내려앉는 비율 */
  land: number
}

const FX: Record<LetterSeason, FxSpec> = {
  spring: { shape: 'petal', count: 22, colors: ['#f9c5d1', '#f4a7b9', '#fde2e8', '#f7b6c8', '#fbd3dd'], size: [11, 16], fall: [26, 46], swayAmp: [18, 42], swayHz: [0.35, 0.7], flip: [2.4, 4.2], wind: -38, startX: [0.45, 1.05], land: 0.35 },
  summer: { shape: 'leaf', count: 8, colors: ['#6fbf5e', '#4fa046', '#93cf72', '#5fb35a'], size: [16, 22], fall: [40, 62], swayAmp: [26, 56], swayHz: [0.3, 0.55], flip: [1.4, 2.6], wind: -24, startX: [0.62, 1.02], land: 0.4 },
  autumn: { shape: 'maple', count: 12, colors: LEAF_COLORS, size: [22, 30], fall: [42, 68], swayAmp: [28, 64], swayHz: [0.28, 0.55], flip: [1.2, 2.6], wind: -26, startX: [0.6, 1.02], land: 0.4 },
  winter: { shape: 'snow', count: 64, colors: ['#ffffff'], size: [2.6, 5.2], fall: [26, 58], swayAmp: [6, 18], swayHz: [0.15, 0.4], flip: [0, 0], wind: -10, startX: [-0.05, 1.08], land: 0.22 },
}

const PATHS: Partial<Record<Shape, string>> = {
  // 다섯 갈래 단풍 — 24칸을 꽉 채워야 실제 크기대로 보인다(이전 모양은 절반만 차서 점처럼 보였음)
  maple: 'M12 1.5L13.7 6l2.7-1.5-.6 4.4 4.3-1.5-1.2 3.2 3.6 1.1-3.8 2.7 1.1 2.6-5-.9-1.9 1.9-.2 4.6h-1.4l-.2-4.6-1.9-1.9-5 .9 1.1-2.6L.6 11.7l3.6-1.1L3 7.4l4.3 1.5-.6-4.4L9.3 6z',
  petal: 'M12 2c5 3 8 9 3.2 18.5L12 18l-3.2 2.5C4 11 7 5 12 2z',
  leaf: 'M4 20C4 10 10 4 21 3c0 10-6 17-17 17z',
}

// 뒷면은 조금 어둡게 — 뒤집힐 때 면이 바뀌는 느낌
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * k)
  const g = Math.round(((n >> 8) & 255) * k)
  const b = Math.round((n & 255) * k)
  return `rgb(${r},${g},${b})`
}

interface P {
  x: number
  y: number
  z: number // 깊이 0.65~1.15
  size: number
  fall: number
  swayAmp: number
  swayW: number // rad/s
  phase: number
  flipW: number
  flipPh: number
  spin: number // 천천히 도는 몫(rad/s)
  rot: number
  spinAcc: number
  color: string
  // 편지에 앉을 목표
  land: { x: number; y: number } | null
  driftVx: number // 목표까지 가기 위한 수평 속도
  landed: number // 앉은 뒤 경과(s), -1 = 떠 있음
  slide: number // 앉을 때 미끄러지는 속도
  alpha: number
  /** 눈: 0 가루(먼) · 1 솜뭉치(중간) · 2 결정(가까운) */
  kind: number
  sprite: number
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  turn: number
  glowPh: number
  glowW: number
}

interface Geo {
  w: number
  h: number
  t: { x: number; y: number; w: number; h: number }
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

interface LetterSeasonFxProps {
  season: LetterSeason
  /** 입자가 노는 판(표지) */
  boxRef: RefObject<HTMLElement | null>
  /** 편지지 — 입자 일부가 여기에 내려앉는다 */
  targetRef: RefObject<HTMLElement | null>
  /** 읽기 모달이 덮고 있을 땐 그리지 않는다 */
  paused?: boolean
}

const LetterSeasonFx = ({ season: s, boxRef, targetRef, paused = false }: LetterSeasonFxProps) => {
  // 그리기 루프는 effect 안에서 한 번만 만들고, 멈춤 여부는 ref 로만 읽는다(루프를 다시 만들지 않게)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // useLayoutEffect 면 부모(표지·편지) ref 가 아직 안 붙은 시점이라 null — 커밋이 끝난 뒤 시작한다
  useEffect(() => {
    const box = boxRef.current
    const tgt = targetRef.current
    const canvas = canvasRef.current
    if (!box || !tgt || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const spec = FX[s]
    const path = PATHS[spec.shape] ? new Path2D(PATHS[spec.shape]) : null
    const geo: Geo = { w: 0, h: 0, t: { x: 0, y: 0, w: 0, h: 0 } }

    const measure = () => {
      const b = box.getBoundingClientRect()
      const t = tgt.getBoundingClientRect()
      const k = box.offsetWidth ? b.width / box.offsetWidth : 1 // PC 글씨 크기 zoom 보정
      geo.w = box.offsetWidth
      geo.h = box.offsetHeight
      geo.t = { x: (t.left - b.left) / k, y: (t.top - b.top) / k, w: t.width / k, h: t.height / k }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(geo.w * dpr)
      canvas.height = Math.round(geo.h * dpr)
      canvas.style.width = `${geo.w}px`
      canvas.style.height = `${geo.h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    measure()

    const spawn = (p: Partial<P> | null, prewarm: boolean): P => {
      const z = rand(0.65, 1.15)
      const fall = rand(spec.fall[0], spec.fall[1]) * z
      const x = rand(spec.startX[0], spec.startX[1]) * geo.w
      const willLand = Math.random() < spec.land && geo.t.w > 0
      const y = prewarm && !willLand ? rand(-0.1, 0.95) * geo.h : rand(-60, -14)
      let land: P['land'] = null
      let driftVx = spec.wind * z * rand(0.7, 1.3)
      if (willLand) {
        const lx = geo.t.x + geo.t.w * rand(0.05, 0.95)
        // 제목·본문을 덜 가리게 편지 윗부분 위주
        const ly = geo.t.y + geo.t.h * rand(0.03, 0.5)
        land = { x: lx, y: ly }
        const tFall = Math.max(1.5, (ly - y) / fall)
        driftVx = (lx - x) / tFall
      }
      return {
        ...(p ?? {}),
        x,
        y,
        z,
        size: rand(spec.size[0], spec.size[1]) * z,
        fall,
        swayAmp: rand(spec.swayAmp[0], spec.swayAmp[1]) * z,
        swayW: rand(spec.swayHz[0], spec.swayHz[1]) * Math.PI * 2,
        phase: rand(0, Math.PI * 2),
        flipW: rand(spec.flip[0], spec.flip[1]) * (Math.random() < 0.5 ? -1 : 1),
        flipPh: rand(0, Math.PI * 2),
        spin: rand(-0.6, 0.6),
        rot: rand(-0.5, 0.5),
        spinAcc: 0,
        color: spec.colors[Math.floor(Math.random() * spec.colors.length)],
        land,
        driftVx,
        landed: -1,
        slide: 0,
        alpha: 0.6 + 0.4 * ((z - 0.65) / 0.5),
        // 가까울수록 결정 모양이 보이고, 멀수록 뭉개진 가루
        kind: z > 0.98 && Math.random() < 0.7 ? 2 : z > 0.8 ? 1 : 0,
        sprite: Math.floor(Math.random() * 4),
      }
    }

    // 멀리 있는 것부터 그리도록 깊이순
    let ps: P[] = Array.from({ length: spec.count }, () => spawn(null, true)).sort((a, b) => a.z - b.z)

    const flies: Firefly[] = Array.from({ length: 16 }, (_, i) => {
      const near = i % 3 === 0
      return {
        x: near ? geo.t.x + geo.t.w * rand(0.2, 1.05) : geo.w * rand(0.55, 0.98),
        y: near ? geo.t.y + rand(-30, geo.t.h * 0.25) : geo.h * rand(0.45, 0.92),
        vx: 0,
        vy: 0,
        heading: rand(0, Math.PI * 2),
        turn: 0,
        glowPh: rand(0, Math.PI * 2),
        glowW: rand(0.9, 1.8),
      }
    })

    let windT = rand(0, 100)
    let last = performance.now()
    let raf = 0
    let visible = true

    const drawLeaf = (p: P, flipScale: number) => {
      if (!path) return
      const k = p.size / 24
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      // 뒤집힘 — 완전히 0이 되면 사라져 보이므로 얇은 옆면을 남긴다
      const fx = Math.sign(flipScale || 1) * Math.max(0.12, Math.abs(flipScale))
      ctx.scale(fx * k, k)
      ctx.translate(-12, -12)
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = flipScale >= 0 ? p.color : shade(p.color, 0.78)
      if (p.landed >= 0) {
        // 종이에 앉은 잎 — 얕은 그림자
        ctx.shadowColor = 'rgba(40,30,20,0.25)'
        ctx.shadowBlur = 4 / k
        ctx.shadowOffsetY = 1.5 / k
      }
      ctx.fill(path)
      if (spec.shape === 'leaf') {
        ctx.strokeStyle = 'rgba(30,80,30,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(4, 20)
        ctx.lineTo(16, 8)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ── 눈송이 스프라이트 — 매 프레임 그리면 무거우니 미리 몇 장 구워 둔다 ──
    // 결정: 여섯 갈래 가지 + 곁가지(모양 4가지), 솜뭉치: 작은 원 여러 개를 겹친 불규칙한 덩어리
    const SPR = 64
    const makeCrystal = (variant: number, rgb: string) => {
      const c = document.createElement('canvas')
      c.width = c.height = SPR
      const g = c.getContext('2d')!
      g.translate(SPR / 2, SPR / 2)
      g.strokeStyle = `rgb(${rgb})`
      g.lineCap = 'round'
      g.shadowColor = `rgba(${rgb},0.9)`
      g.shadowBlur = 3
      const R = SPR * 0.4
      const branches = [
        [[0.42, 0.26], [0.7, 0.17]],
        [[0.35, 0.3], [0.62, 0.22], [0.85, 0.1]],
        [[0.55, 0.32]],
        [[0.3, 0.18], [0.55, 0.26], [0.78, 0.16]],
      ][variant]
      for (let i = 0; i < 6; i++) {
        g.save()
        g.rotate((Math.PI / 3) * i)
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(0, -R)
        g.stroke()
        g.lineWidth = 2.2
        for (const [at, len] of branches) {
          const y = -R * at
          const l = R * len
          g.beginPath()
          g.moveTo(0, y)
          g.lineTo(-l * 0.87, y - l * 0.5)
          g.moveTo(0, y)
          g.lineTo(l * 0.87, y - l * 0.5)
          g.stroke()
        }
        g.restore()
      }
      // 가운데 육각 판
      g.fillStyle = `rgb(${rgb})`
      g.beginPath()
      for (let i = 0; i < 6; i++) {
        const t = (Math.PI / 3) * i
        g[i ? 'lineTo' : 'moveTo'](Math.sin(t) * 4.5, -Math.cos(t) * 4.5)
      }
      g.closePath()
      g.fill()
      return c
    }
    const makeClump = (seed: number, rgb: string) => {
      const c = document.createElement('canvas')
      c.width = c.height = SPR
      const g = c.getContext('2d')!
      const n = 5 + (seed % 3)
      for (let i = 0; i < n; i++) {
        const a = seed * 1.7 + i * 2.39
        const d = i === 0 ? 0 : SPR * (0.08 + 0.1 * ((i * 7 + seed) % 5) / 4)
        const x = SPR / 2 + Math.cos(a) * d
        const y = SPR / 2 + Math.sin(a) * d
        const r = SPR * (i === 0 ? 0.2 : 0.11 + 0.05 * ((i + seed) % 3))
        const grd = g.createRadialGradient(x, y, 0, x, y, r)
        grd.addColorStop(0, `rgba(${rgb},0.95)`)
        grd.addColorStop(0.6, `rgba(${rgb},0.7)`)
        grd.addColorStop(1, `rgba(${rgb},0)`)
        g.fillStyle = grd
        g.beginPath()
        g.arc(x, y, r, 0, Math.PI * 2)
        g.fill()
      }
      return c
    }
    const WHITE = '255,255,255'
    const PAPER = '160,188,224' // 흰 편지지 위에선 옅은 하늘빛이어야 보인다
    const sprites =
      spec.shape === 'snow'
        ? {
            crystal: { sky: [0, 1, 2, 3].map((v) => makeCrystal(v, WHITE)), paper: [0, 1, 2, 3].map((v) => makeCrystal(v, PAPER)) },
            clump: { sky: [0, 1, 2, 3].map((v) => makeClump(v, WHITE)), paper: [0, 1, 2, 3].map((v) => makeClump(v, PAPER)) },
          }
        : null

    const drawSnow = (p: P) => {
      const onPaper =
        (p.landed >= 0 || (p.x > geo.t.x && p.x < geo.t.x + geo.t.w && p.y > geo.t.y && p.y < geo.t.y + geo.t.h)) &&
        !document.documentElement.classList.contains('dark')
      if (p.kind === 0 || !sprites) {
        // 먼 가루 — 작고 흐린 점
        const r = p.size * 0.8
        const c = onPaper ? PAPER : WHITE
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(${c},${p.alpha * 0.9})`)
        g.addColorStop(1, `rgba(${c},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        return
      }
      const set = p.kind === 2 ? sprites.crystal : sprites.clump
      const img = (onPaper ? set.paper : set.sky)[p.sprite]
      const size = p.kind === 2 ? p.size * 4.2 : p.size * 2.8
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden || pausedRef.current) {
        last = now
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      windT += dt
      // 천천히 바뀌는 돌풍 — 서로 다른 주기 둘을 겹쳐 반복이 티 나지 않게
      const gust = Math.sin(windT * 0.23) * 0.6 + Math.sin(windT * 0.071 + 1.3) * 0.4
      const isDark = document.documentElement.classList.contains('dark')

      ctx.clearRect(0, 0, geo.w, geo.h)

      if (s === 'summer' && isDark) {
        ctx.globalCompositeOperation = 'lighter'
        for (const f of flies) {
          f.turn += rand(-1.2, 1.2) * dt
          f.turn *= 0.96
          f.heading += f.turn * dt * 2
          const speed = 14
          f.vx += (Math.cos(f.heading) * speed - f.vx) * dt * 0.8
          f.vy += (Math.sin(f.heading) * speed * 0.6 - f.vy) * dt * 0.8
          f.x += f.vx * dt
          f.y += f.vy * dt
          // 표지 아래쪽 절반 안에서만 맴돌게 살살 되돌림
          if (f.x < geo.w * 0.08) f.heading = 0
          if (f.x > geo.w * 0.99) f.heading = Math.PI
          if (f.y < geo.h * 0.18) f.heading = Math.PI / 2
          if (f.y > geo.h * 0.96) f.heading = -Math.PI / 2
          f.glowPh += f.glowW * dt
          const glow = Math.max(0, Math.sin(f.glowPh)) ** 2 * 0.9 + 0.08
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 16)
          g.addColorStop(0, `rgba(255,246,170,${glow})`)
          g.addColorStop(0.18, `rgba(255,226,110,${glow * 0.7})`)
          g.addColorStop(1, 'rgba(255,200,60,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(f.x, f.y, 16, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
        return
      }

      ps = ps.map((p) => {
        if (p.landed >= 0) {
          // 앉은 뒤: 짧게 미끄러지며 멈추고, 잠시 머문 뒤 사라짐
          p.landed += dt
          p.x += p.slide * dt
          p.slide *= Math.pow(0.02, dt)
          p.flipPh += (Math.round(p.flipPh / Math.PI) * Math.PI - p.flipPh) * Math.min(1, dt * 6) // 납작하게 눕기
          const stay = spec.shape === 'snow' ? 2.2 : 2.6
          const fade = spec.shape === 'snow' ? 2.4 : 1.2
          if (p.landed > stay) p.alpha -= dt / fade
          if (p.alpha <= 0) return spawn(p, false)
        } else {
          p.phase += p.swayW * dt
          const swing = Math.sin(p.phase)
          // 진자: 흔들림 양 끝에서 느려지고(위로 살짝 뜨는 느낌) 가운데를 지날 때 빨리 떨어진다
          const vy = p.fall * (0.55 + 0.75 * Math.abs(Math.cos(p.phase)))
          const vx = p.driftVx + gust * 18 * p.z + p.swayAmp * p.swayW * Math.cos(p.phase) * 0.5
          p.x += vx * dt
          p.y += vy * dt
          // 기울기는 흔들리는 방향을 따라가고, 천천히 도는 몫을 더한다
          p.spinAcc += p.spin * dt
          p.rot += (p.spinAcc + swing * 0.55 - p.rot) * Math.min(1, dt * 3)
          p.flipPh += p.flipW * dt * (0.6 + 0.4 * Math.abs(swing))
          if (p.land && p.y >= p.land.y) {
            p.landed = 0
            p.slide = vx * 0.35
            if (spec.shape !== 'snow') p.spinAcc += rand(-0.3, 0.3)
          }
          if (p.y > geo.h + 30 || p.x < -40 || p.x > geo.w + 60) return spawn(p, false)
        }
        if (spec.shape === 'snow') drawSnow(p)
        else drawLeaf(p, Math.cos(p.flipPh))
        return p
      })
    }
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(tgt)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(box)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [s, boxRef, targetRef])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-20" />
}

export default LetterSeasonFx
