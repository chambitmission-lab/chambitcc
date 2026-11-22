// 기도멍 — 비 오는 밤 창가(빗멍).
//
// 김 서린 유리 너머로 도시의 밤과 건너편 아파트가 번져 보인다. 건너편에 불 켜진 창 하나하나가
// 지금 이 화면에 함께 머무는 사람이다(숫자만, 신원 없음). 올려드린 기도는 유리에 손가락으로 쓴
// 글씨처럼 김을 닦아 내며 나타나고, 김이 다시 서리며 천천히 지워진다. 빗방울은 이따금 흘러내리며
// 김에 길을 내고, 그 길도 금세 다시 흐려진다.
//
// 그리는 법
//  - 풍경은 또렷한 판(sharp)과 흐린 판(blur, 축소→확대) 두 장. 김이 걷힌 곳만 또렷한 판이 보인다.
//  - "김이 걷힌 정도(clear)"를 매 프레임 기록에서 새로 그린다 — 글씨 블록·빗자국 점마다 나이로 알파를
//    정한다. 캔버스를 조금씩 지워 서서히 사라지게 하면 8비트 알파 반올림에 막혀 자국이 영영 남는다
//    (1차 시안의 검은 줄기 원인).
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { fitCanvas } from './glyphLayout'
import type { SceneHandle, SceneProps } from './types'

/** 창턱(글상자 자리) 높이 — CSS .pws-sill 과 같은 값 */
export const SILL_PX = 190
// 유리 위쪽은 말씀, 아래쪽은 함께 머무는 사람 한 줄이 차지한다
const GLASS_TOP_PAD = 132
const GLASS_BOTTOM_PAD = 64

const FOG_ALPHA = 0.5
// 글씨: 또렷이 머무는 시간 → 다시 서리는 시간
const TEXT_HOLD = 9
const TEXT_FADE = 10
const WRITE_STEP = 0.1
// 빗자국이 다시 흐려지는 시간
const TRAIL_LIFE = 3.2

const rand = (a: number, b: number) => a + Math.random() * (b - a)

interface Block {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  /** 화면 좌표 — 블록 가운데·크기·기울기 */
  cx: number
  cy: number
  bw: number
  bh: number
  rot: number
  born: number
  chars: { ch: string; x: number; y: number; at: number; done: boolean; drip: number }[]
}

interface TrailPt {
  x: number
  y: number
  r: number
  born: number
}

interface Drop {
  x: number
  y: number
  r: number
  vy: number
  wait: number
  seed: number
  trail: TrailPt[]
  lastBead: number
  /** 다 흘러내렸다 — 자국만 사라지면 지운다 */
  gone: boolean
}

interface Bead {
  x: number
  y: number
  r: number
}

interface Cell {
  x: number
  y: number
  w: number
  h: number
  color: string
  /** 켜짐 정도 0~1 (부드럽게 켜지고 꺼진다) */
  on: number
}

// 건너편 창 불빛 — 따뜻한 전구, 하얀 LED, 가끔 TV 빛
const WINDOW_COLORS = ['255,196,128', '255,206,150', '255,186,110', '236,240,255', '226,234,255', '150,180,255']

const seeded = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const WindowScene = forwardRef<SceneHandle, SceneProps>(({ others }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const blocksRef = useRef<Block[]>([])
  const clockRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const litRef = useRef(others)
  litRef.current = others

  useImperativeHandle(ref, () => ({
    offer: (layout) => {
      const { w, h, dpr } = sizeRef.current
      if (!w) return
      const family = getComputedStyle(document.documentElement).getPropertyValue('--font-serif-kr') || 'serif'
      const glassTop = GLASS_TOP_PAD
      const glassBottom = h - SILL_PX - GLASS_BOTTOM_PAD
      const room = Math.max(80, glassBottom - glassTop)
      const measure = document.createElement('canvas').getContext('2d')!

      // 손가락 글씨 크기 — 길면 줄여 유리 안에 들인다. 한 블록은 유리 폭의 80%까지만
      const maxW = Math.min(w * 0.8, 520)
      let size = Math.max(24, Math.min(36, w * 0.07))
      let lines: string[] = []
      for (;;) {
        measure.font = `500 ${size}px ${family}`
        lines = []
        let cur = ''
        for (const ch of Array.from(layout.text)) {
          if (ch === '\n') {
            lines.push(cur)
            cur = ''
            continue
          }
          if (measure.measureText(cur + ch).width > maxW && cur) {
            lines.push(cur)
            cur = ch.trim() ? ch : ''
            continue
          }
          cur += ch
        }
        if (cur) lines.push(cur)
        if (lines.length * size * 1.45 <= room * 0.8 || size <= 15) break
        size -= 2
      }
      const lh = size * 1.45
      const bw = Math.max(...lines.map((l) => measure.measureText(l).width))
      const bh = lines.length * lh

      // ── 자리 고르기 — 아직 남아 있는 글씨와 가장 덜 겹치는 곳 (새 글씨일수록 피한다)
      const now = clockRef.current
      const alive = blocksRef.current.filter((b) => now - b.born < TEXT_HOLD + TEXT_FADE)
      const minX = 24 + bw / 2
      const maxX = w - 24 - bw / 2
      const minY = glassTop + bh / 2
      const maxY = Math.max(minY, glassBottom - bh / 2)
      let best = { x: w / 2, y: (minY + maxY) / 2, score: Infinity }
      for (let i = 0; i < 24; i++) {
        const x = maxX > minX ? rand(minX, maxX) : w / 2
        const y = rand(minY, maxY)
        let score = 0
        for (const b of alive) {
          const ox = Math.max(0, Math.min(x + bw / 2, b.cx + b.bw / 2) - Math.max(x - bw / 2, b.cx - b.bw / 2))
          const oy = Math.max(0, Math.min(y + bh / 2, b.cy + b.bh / 2) - Math.max(y - bh / 2, b.cy - b.bh / 2))
          const fresh = 1 - (now - b.born) / (TEXT_HOLD + TEXT_FADE)
          score += ox * oy * (0.2 + fresh)
        }
        // 첫 글씨는 가운데 근처가 자연스럽다 — 동점이면 가운데 쪽
        score += (Math.abs(x - w / 2) + Math.abs(y - (minY + maxY) / 2)) * 0.5
        if (score < best.score) best = { x, y, score }
      }

      // ── 블록 캔버스 — 글자를 차례로 닦아 넣는다
      const pad = 16
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil((bw + pad * 2) * dpr)
      canvas.height = Math.ceil((bh + pad * 2) * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `500 ${size}px ${family}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const chars: Block['chars'] = []
      let order = 0
      lines.forEach((ln, li) => {
        const lw = measure.measureText(ln).width
        let x = pad + (bw - lw) / 2
        for (const ch of Array.from(ln)) {
          const cw = measure.measureText(ch).width
          if (ch.trim()) {
            chars.push({
              ch,
              x: x + cw / 2,
              y: pad + li * lh + lh / 2,
              at: now + 0.2 + order * WRITE_STEP,
              done: false,
              drip: Math.random() < 0.22 ? rand(1, 4) : -1,
            })
            order += 1
          }
          x += cw
        }
      })
      blocksRef.current.push({
        canvas,
        ctx,
        cx: best.x,
        cy: best.y,
        bw: bw + pad * 2,
        bh: bh + pad * 2,
        rot: rand(-0.045, 0.045),
        born: now,
        chars,
      })
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let w = 0
    let h = 0
    let dpr = 1
    const mk = () => {
      const c = document.createElement('canvas')
      return { c, g: c.getContext('2d')! }
    }
    const sharp = mk() // 또렷한 풍경
    const blur = mk() // 흐린 풍경
    const fogTex = mk() // 김 — 아래로 갈수록, 가장자리일수록 짙다
    const beadMask = mk() // 맺힌 물방울 둘레의 걷힌 김 (고정)
    const beadLayer = mk() // 맺힌 물방울 그림 (고정)
    const clear = mk() // 이번 프레임의 걷힌 정도
    const tmp = mk()
    const fogFrame = mk()
    let cells: Cell[] = []
    const drops: Drop[] = []
    let beads: Bead[] = []

    const paintScenery = () => {
      const g = sharp.g
      const glassH = h - SILL_PX
      const sky = g.createLinearGradient(0, 0, 0, glassH)
      sky.addColorStop(0, '#090c18')
      sky.addColorStop(0.65, '#121729')
      sky.addColorStop(1, '#22202c')
      g.fillStyle = sky
      g.fillRect(0, 0, w, h)
      // 도시가 하늘에 비친 주황빛
      const haze = g.createRadialGradient(w * 0.4, glassH, 0, w * 0.4, glassH, Math.max(w, glassH) * 0.8)
      haze.addColorStop(0, 'rgba(255,150,90,0.16)')
      haze.addColorStop(1, 'rgba(255,150,90,0)')
      g.fillStyle = haze
      g.fillRect(0, 0, w, h)

      const rnd = seeded(11)
      // 먼 건물들 — 낮고 어둡게, 창은 희미하게 드문드문
      let x = -20
      while (x < w) {
        const bw = 40 + rnd() * 90
        const bh = glassH * (0.22 + rnd() * 0.34)
        g.fillStyle = `rgb(${14 + rnd() * 6},${17 + rnd() * 6},${30 + rnd() * 8})`
        g.fillRect(x, glassH - bh, bw, bh)
        for (let i = 0; i < bw * bh * 0.0006; i++) {
          g.fillStyle = `rgba(255,210,160,${0.08 + rnd() * 0.14})`
          g.fillRect(x + 4 + rnd() * (bw - 10), glassH - bh + 6 + rnd() * (bh - 12), 3, 2.5)
        }
        x += bw + rnd() * 12
      }
      // 길가 불빛 — 흐린 판에서 둥근 빛망울이 된다
      for (let i = 0; i < Math.max(10, w / 40); i++) {
        const lx = rnd() * w
        const ly = glassH * (0.86 + rnd() * 0.14)
        const r = 2 + rnd() * 3
        const c = rnd() < 0.5 ? '255,190,120' : rnd() < 0.5 ? '255,90,80' : '230,236,255'
        const gr = g.createRadialGradient(lx, ly, 0, lx, ly, r * 3)
        gr.addColorStop(0, `rgba(${c},0.9)`)
        gr.addColorStop(1, `rgba(${c},0)`)
        g.fillStyle = gr
        g.beginPath()
        g.arc(lx, ly, r * 3, 0, Math.PI * 2)
        g.fill()
      }
      // 건너편 아파트 — 창 격자(불은 매 프레임 따로 켠다)
      const bx = w < 640 ? w * 0.34 : w * 0.5
      const bwid = w < 640 ? w * 0.62 : Math.min(w * 0.4, 520)
      const btop = glassH * 0.16
      g.fillStyle = '#141827'
      g.fillRect(bx, btop, bwid, glassH - btop)
      g.fillStyle = 'rgba(255,255,255,0.035)'
      g.fillRect(bx, btop, 2, glassH - btop)
      const cw = 34
      const ch = 30
      const cols = Math.max(3, Math.floor((bwid - 16) / cw))
      const rows = Math.max(4, Math.floor((glassH - btop - 30) / ch))
      const ox = bx + (bwid - cols * cw) / 2
      const all: Cell[] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = ox + c * cw + 8
          const cy = btop + 18 + r * ch
          g.fillStyle = 'rgba(40,46,66,0.7)'
          g.fillRect(cx, cy, 18, 14)
          all.push({ x: cx, y: cy, w: 18, h: 14, color: WINDOW_COLORS[Math.floor(rnd() * WINDOW_COLORS.length)], on: 0 })
        }
      }
      // 켜지는 차례 — 섞어 두면 사람이 들어올 때마다 여기저기 하나씩 켜진다
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1))
        ;[all[i], all[j]] = [all[j], all[i]]
      }
      cells = all

      // 흐린 판 — 작게 줄였다가 키운다(두 번)
      const small = document.createElement('canvas')
      small.width = Math.max(8, Math.round(w / 8))
      small.height = Math.max(8, Math.round(h / 8))
      const sg = small.getContext('2d')!
      sg.drawImage(sharp.c, 0, 0, small.width, small.height)
      const tiny = document.createElement('canvas')
      tiny.width = Math.max(4, Math.round(w / 18))
      tiny.height = Math.max(4, Math.round(h / 18))
      const tg = tiny.getContext('2d')!
      tg.imageSmoothingQuality = 'high'
      tg.drawImage(small, 0, 0, tiny.width, tiny.height)
      blur.g.save()
      blur.g.setTransform(1, 0, 0, 1, 0, 0)
      blur.g.imageSmoothingQuality = 'high'
      blur.g.drawImage(tiny, 0, 0, blur.c.width, blur.c.height)
      blur.g.restore()
    }

    const paintFog = () => {
      const g = fogTex.g
      g.clearRect(0, 0, w, h)
      const v = g.createLinearGradient(0, 0, 0, h)
      v.addColorStop(0, 'rgba(176,186,204,0.78)')
      v.addColorStop(0.7, 'rgba(182,190,206,0.92)')
      v.addColorStop(1, 'rgba(190,196,210,1)')
      g.fillStyle = v
      g.fillRect(0, 0, w, h)
      // 고르지 않은 김 — 큰 얼룩 몇 개
      const rnd = seeded(5)
      for (let i = 0; i < 14; i++) {
        const x = rnd() * w
        const y = rnd() * h
        const r = 80 + rnd() * 220
        const gr = g.createRadialGradient(x, y, 0, x, y, r)
        gr.addColorStop(0, `rgba(200,206,220,${0.12 + rnd() * 0.15})`)
        gr.addColorStop(1, 'rgba(200,206,220,0)')
        g.fillStyle = gr
        g.fillRect(x - r, y - r, r * 2, r * 2)
      }
    }

    const drawBeadSprite = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      // 작은 물방울 — 아래는 빛을 모아 밝고, 위 가장자리는 살짝 어둡고, 하이라이트 한 점
      const gr = g.createRadialGradient(x, y + r * 0.35, 0, x, y, r)
      gr.addColorStop(0, 'rgba(255,245,230,0.22)')
      gr.addColorStop(0.75, 'rgba(255,255,255,0.04)')
      gr.addColorStop(1, 'rgba(10,14,26,0.22)')
      g.fillStyle = gr
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
      if (r > 0.9) {
        g.fillStyle = 'rgba(255,255,255,0.5)'
        g.beginPath()
        g.arc(x - r * 0.3, y - r * 0.35, r * 0.24, 0, Math.PI * 2)
        g.fill()
      }
    }

    const addBead = (x: number, y: number, r: number) => {
      beads.push({ x, y, r })
      beadMask.g.fillStyle = 'rgba(255,255,255,0.45)'
      beadMask.g.beginPath()
      beadMask.g.arc(x, y, r * 1.5, 0, Math.PI * 2)
      beadMask.g.fill()
      drawBeadSprite(beadLayer.g, x, y, r)
    }

    const resize = () => {
      const fit = fitCanvas(canvas, ctx, 1.5)
      w = fit.w
      h = fit.h
      dpr = fit.dpr
      sizeRef.current = { w, h, dpr }
      for (const l of [sharp, blur, fogTex, beadMask, beadLayer, clear, tmp, fogFrame]) {
        l.c.width = canvas.width
        l.c.height = canvas.height
        l.g.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      paintScenery()
      paintFog()
      beads = []
      const n = Math.round((w * h) / 3800)
      for (let i = 0; i < n; i++) addBead(Math.random() * w, Math.random() * (h - SILL_PX), Math.pow(Math.random(), 2.6) * 2.2 + 0.4)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawnDrop = (x: number, y: number, r: number) => {
      drops.push({ x, y, r, vy: 0, wait: rand(0.2, 1.2), seed: Math.random() * 100, trail: [], lastBead: y, gone: false })
    }

    /** 물방울 — 바깥 풍경을 거꾸로 담는 작은 렌즈 */
    const drawDrop = (d: Drop) => {
      const stretch = Math.min(0.45, d.vy / 260)
      const rx = d.r * (1 - stretch * 0.25)
      const ry = d.r * (1 + stretch)
      const cy = d.y - (ry - d.r) * 0.6
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(d.x, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.clip()
      const R = d.r * 6
      const sx = Math.max(0, (d.x - R) * dpr)
      const sy = Math.max(0, (cy - R) * dpr)
      const sw = Math.min(sharp.c.width - sx, R * 2 * dpr)
      const sh = Math.min(sharp.c.height - sy, R * 2 * dpr)
      ctx.translate(d.x, cy)
      ctx.scale(1, -1)
      if (sw > 0 && sh > 0) ctx.drawImage(sharp.c, sx, sy, sw, sh, -rx, -ry, rx * 2, ry * 2)
      ctx.restore()
      // 가장자리 그늘 + 아래 밝은 초승달 + 하이라이트
      const edge = ctx.createRadialGradient(d.x, cy + ry * 0.15, Math.min(rx, ry) * 0.4, d.x, cy, Math.max(rx, ry))
      edge.addColorStop(0, 'rgba(0,0,0,0)')
      edge.addColorStop(1, 'rgba(6,8,16,0.45)')
      ctx.fillStyle = edge
      ctx.beginPath()
      ctx.ellipse(d.x, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,240,220,0.22)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(d.x, cy, rx * 0.82, ry * 0.82, 0, Math.PI * 0.15, Math.PI * 0.85)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.beginPath()
      ctx.ellipse(d.x - rx * 0.32, cy - ry * 0.42, rx * 0.2, ry * 0.15, -0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    let last = performance.now()
    let spawnIn = 0.8
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      clockRef.current += dt
      const t = clockRef.current
      const glassH = h - SILL_PX

      // ── 빗방울 — 이따금 하나씩 맺혔다가 흘러내린다. 멈췄다 미끄러졌다 한다
      spawnIn -= dt
      if (spawnIn <= 0 && drops.filter((d) => !d.gone).length < 7) {
        spawnIn = reduce ? rand(4, 7) : rand(1.2, 3.2)
        spawnDrop(Math.random() * w, rand(-10, glassH * 0.55), rand(2.4, 4.2))
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.trail = d.trail.filter((p) => t - p.born < TRAIL_LIFE)
        if (d.gone) {
          if (!d.trail.length) drops.splice(i, 1)
          continue
        }
        if (d.wait > 0) {
          d.wait -= dt
          d.vy = 0
        } else {
          d.vy += (70 + d.r * 34 - d.vy) * dt * 1.6
          if (Math.random() < dt * 0.6) d.wait = rand(0.15, 0.9)
        }
        const prevY = d.y
        d.y += d.vy * dt
        // 미끄러질 때 가끔 옆으로 꺾인다
        if (d.vy > 0 && Math.random() < dt * 1.5) d.x += rand(-1.6, 1.6)
        if (d.y - prevY > 0.01) {
          d.trail.push({ x: d.x, y: d.y, r: d.r * 0.62, born: t })
          // 지나간 자리에 잔 물방울을 떨군다
          if (d.y - d.lastBead > rand(9, 20)) {
            d.lastBead = d.y
            if (Math.random() < 0.6) {
              const br = d.r * rand(0.18, 0.36)
              d.r = Math.max(1.6, d.r - br * 0.08)
              addBead(d.x + rand(-1, 1), d.y - d.r, br)
            }
          }
        }
        // 맺힌 물방울을 지나면 흡수해 조금 커진다
        for (let j = beads.length - 1; j >= 0; j--) {
          const b = beads[j]
          if (Math.abs(b.x - d.x) < d.r && Math.abs(b.y - d.y) < d.r && b.r > 0.9) {
            d.r = Math.min(5, d.r + b.r * 0.12)
            beads.splice(j, 1)
            break
          }
        }
        if (d.y - d.r > glassH) d.gone = true
      }

      // ── 이번 프레임의 걷힌 김 = 맺힌 물방울 + 빗자국 + 손글씨
      const cg = clear.g
      cg.globalCompositeOperation = 'source-over'
      cg.clearRect(0, 0, w, h)
      cg.globalAlpha = 1
      cg.drawImage(beadMask.c, 0, 0, w, h)
      cg.lineCap = 'round'
      cg.lineJoin = 'round'
      for (const d of drops) {
        const tr = d.trail
        if (tr.length < 2) continue
        // 나이 구간별로 한 경로씩 — 짧은 선분을 하나씩 그으면 겹친 끝마다 알파가 쌓인다
        const per = Math.max(2, Math.ceil(tr.length / 10))
        for (let s = 0; s < tr.length - 1; s += per) {
          const e = Math.min(tr.length - 1, s + per)
          const mid = tr[Math.floor((s + e) / 2)]
          const k = (t - mid.born) / TRAIL_LIFE
          cg.globalAlpha = Math.max(0, 0.85 * (1 - k) * (1 - k))
          cg.strokeStyle = '#fff'
          cg.lineWidth = mid.r * 2
          cg.beginPath()
          cg.moveTo(tr[s].x, tr[s].y)
          for (let q = s + 1; q <= e; q++) cg.lineTo(tr[q].x, tr[q].y)
          cg.stroke()
        }
      }
      const blocks = blocksRef.current
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i]
        const age = t - b.born
        if (age > TEXT_HOLD + TEXT_FADE) {
          blocks.splice(i, 1)
          continue
        }
        // 차례가 된 글자를 닦아 넣는다 — 0.3초에 걸쳐 문지르듯
        b.ctx.fillStyle = '#fff'
        for (const c of b.chars) {
          const local = t - c.at
          if (local < 0) continue
          if (!c.done) {
            b.ctx.globalAlpha = Math.min(1, dt / 0.3 + 0.06)
            b.ctx.shadowColor = '#fff'
            b.ctx.shadowBlur = 5
            b.ctx.fillText(c.ch, c.x, c.y)
            b.ctx.shadowBlur = 0
            if (local > 0.3) c.done = true
          }
          // 글씨 아래로 물이 맺혀 한 줄기 흘러내린다
          if (c.drip > 0 && local > c.drip) {
            c.drip = -1
            const cos = Math.cos(b.rot)
            const sin = Math.sin(b.rot)
            const lx = c.x - b.bw / 2
            const ly = c.y - b.bh / 2 + 12
            spawnDrop(b.cx + lx * cos - ly * sin, b.cy + lx * sin + ly * cos, rand(1.8, 2.6))
          }
        }
        const fade = age < TEXT_HOLD ? 1 : Math.max(0, 1 - (age - TEXT_HOLD) / TEXT_FADE)
        cg.save()
        cg.globalAlpha = fade * fade
        cg.translate(b.cx, b.cy)
        cg.rotate(b.rot)
        cg.drawImage(b.canvas, -b.bw / 2, -b.bh / 2, b.bw, b.bh)
        cg.restore()
      }
      cg.globalAlpha = 1

      // ── 건너편 창 — 함께 머무는 사람 수만큼 켜져 있다
      const lit = Math.min(cells.length, litRef.current)
      cells.forEach((c, i) => {
        const target = i < lit ? 1 : 0
        c.on += (target - c.on) * Math.min(1, dt * 1.2)
      })

      // ── 그리기: 흐린 풍경 → (걷힌 곳만) 또렷한 풍경 → 김 → 물방울
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(blur.c, 0, 0, w, h)
      for (const c of cells) {
        if (c.on < 0.02) continue
        const gr = ctx.createRadialGradient(c.x + c.w / 2, c.y + c.h / 2, 0, c.x + c.w / 2, c.y + c.h / 2, 26)
        gr.addColorStop(0, `rgba(${c.color},${0.55 * c.on})`)
        gr.addColorStop(1, `rgba(${c.color},0)`)
        ctx.fillStyle = gr
        ctx.fillRect(c.x - 20, c.y - 20, c.w + 40, c.h + 40)
      }
      const tg = tmp.g
      tg.globalCompositeOperation = 'source-over'
      tg.clearRect(0, 0, w, h)
      tg.drawImage(sharp.c, 0, 0, w, h)
      for (const c of cells) {
        if (c.on < 0.02) continue
        tg.fillStyle = `rgba(${c.color},${0.92 * c.on})`
        tg.fillRect(c.x, c.y, c.w, c.h)
      }
      tg.globalCompositeOperation = 'destination-in'
      tg.drawImage(clear.c, 0, 0, w, h)
      ctx.drawImage(tmp.c, 0, 0, w, h)

      const fg = fogFrame.g
      fg.globalCompositeOperation = 'source-over'
      fg.clearRect(0, 0, w, h)
      fg.drawImage(fogTex.c, 0, 0, w, h)
      fg.globalCompositeOperation = 'destination-out'
      fg.drawImage(clear.c, 0, 0, w, h)
      ctx.globalAlpha = FOG_ALPHA
      ctx.drawImage(fogFrame.c, 0, 0, w, h)
      ctx.globalAlpha = 1

      // 흡수된 물방울은 그림에서도 빠지도록, 맺힌 물방울 층은 가끔 다시 그린다
      if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
        beadLayer.g.clearRect(0, 0, w, h)
        beadMask.g.clearRect(0, 0, w, h)
        beadMask.g.fillStyle = 'rgba(255,255,255,0.45)'
        for (const b of beads) {
          drawBeadSprite(beadLayer.g, b.x, b.y, b.r)
          beadMask.g.beginPath()
          beadMask.g.arc(b.x, b.y, b.r * 1.5, 0, Math.PI * 2)
          beadMask.g.fill()
        }
        // 오래 쌓이면 무거워진다 — 너무 많으면 오래된 것부터 버린다
        if (beads.length > 900) beads = beads.slice(beads.length - 900)
      }
      ctx.drawImage(beadLayer.c, 0, 0, w, h)
      for (const d of drops) if (!d.gone) drawDrop(d)

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
      <div className="pws-frame" aria-hidden />
      <div className="pws-sill" aria-hidden />
    </>
  )
})

WindowScene.displayName = 'WindowScene'
export default WindowScene
