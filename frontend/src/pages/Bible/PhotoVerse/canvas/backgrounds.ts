// 감성 배경 — 사진이 없어도 장면(하늘·별밭·보케·종이)으로 카드를 만든다.

// ── 감성 배경 — 사진이 없어도 '장면'으로 카드를 만들 수 있다 ──────────
// 그라데이션 한 장이 아니라 하늘·별·안개·보케·종이 결을 직접 그린다.
export interface VerseBackground {
  id: string
  nameKo: string
  nameEn: string
  /** 스와치 미리보기용 대표색 (CSS 그라데이션) */
  stops: string[]
  /** 배경 위 기본 글자색 — 밝은 배경은 어두운 글자로 시작 */
  textColor: string
}

export const BACKGROUNDS: VerseBackground[] = [
  { id: 'dawn', nameKo: '새벽', nameEn: 'Dawn', stops: ['#1b2447', '#5a6fa8', '#f2c9b0'], textColor: '#ffffff' },
  { id: 'midnight', nameKo: '별밤', nameEn: 'Starry Night', stops: ['#0a1024', '#1c2a52'], textColor: '#ffffff' },
  { id: 'sunset', nameKo: '노을', nameEn: 'Sunset', stops: ['#3b2a4f', '#c75f5f', '#fbd07a'], textColor: '#ffffff' },
  { id: 'sea', nameKo: '바다', nameEn: 'Sea', stops: ['#a8c8e8', '#5a8fc4', '#2f5f95'], textColor: '#ffffff' },
  { id: 'ink', nameKo: '먹빛', nameEn: 'Ink', stops: ['#232228', '#141317'], textColor: '#ffffff' },
  { id: 'bokeh', nameKo: '보케', nameEn: 'Bokeh', stops: ['#2a1b2c', '#5a3340', '#e8a25c'], textColor: '#ffffff' },
  { id: 'lavender', nameKo: '라벤더', nameEn: 'Lavender', stops: ['#7d72c4', '#b79ddd', '#d9b8d6'], textColor: '#ffffff' },
  { id: 'sage', nameKo: '세이지', nameEn: 'Sage', stops: ['#dfe6da', '#a9bca5'], textColor: '#2f3a2f' },
  { id: 'cream', nameKo: '종이', nameEn: 'Paper', stops: ['#fbf5ea', '#ecdfc9'], textColor: '#5c4a36' },
  { id: 'hanji', nameKo: '한지', nameEn: 'Hanji', stops: ['#f3eee3', '#d9d2c3', '#5c5a58'], textColor: '#2b2722' },
  { id: 'rose', nameKo: '로즈', nameEn: 'Rose', stops: ['#fbe4e6', '#e8a3ad'], textColor: '#6b3540' },
]

/** 미리보기 스와치용 CSS 그라데이션 */
export const backgroundCss = (bg: VerseBackground) =>
  `linear-gradient(160deg, ${bg.stops.join(', ')})`

// 결정적 난수 — 같은 배경은 언제 만들어도 같은 별자리·같은 보케가 나온다
const seeded = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Painter = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number) => void

const vertical = (ctx: CanvasRenderingContext2D, W: number, H: number, stops: [number, string][]) => {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  for (const [at, color] of stops) g.addColorStop(at, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

const glow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  alpha: number,
  blend: GlobalCompositeOperation = 'screen',
) => {
  ctx.save()
  ctx.globalCompositeOperation = blend
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${rgb},${alpha})`)
  g.addColorStop(0.5, `rgba(${rgb},${alpha * 0.45})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

/** 별밭 — 크기·밝기가 제각각인 점 + 몇 개의 빛나는 별 */
const stars = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, count: number, maxY: number, fade: boolean) => {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H * maxY
    const size = (0.5 + rnd() * rnd() * 1.9) * (W / 1080)
    let a = 0.25 + rnd() * 0.7
    if (fade) a *= 1 - y / (H * maxY)
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  // 빛나는 별 몇 개
  for (let i = 0; i < 7; i++) {
    const x = rnd() * W
    const y = rnd() * H * maxY * 0.9
    glow(ctx, x, y, (6 + rnd() * 10) * (W / 1080), '255,250,235', 0.5)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.arc(x, y, 1.3 * (W / 1080), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** 부드러운 가로 띠 — 안개·물결·구름 */
const softBand = (ctx: CanvasRenderingContext2D, W: number, y: number, h: number, rgb: string, alpha: number, blend: GlobalCompositeOperation = 'screen') => {
  ctx.save()
  ctx.globalCompositeOperation = blend
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2)
  g.addColorStop(0, `rgba(${rgb},0)`)
  g.addColorStop(0.5, `rgba(${rgb},${alpha})`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, y - h / 2, W, h)
  ctx.restore()
}

/** 종이 섬유 — 짧고 옅은 선을 무작위로 흩뿌린다 */
const fibers = (ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, count: number, rgb: string) => {
  ctx.save()
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const len = (4 + rnd() * 18) * (W / 1080)
    const ang = rnd() * Math.PI
    ctx.strokeStyle = `rgba(${rgb},${0.03 + rnd() * 0.06})`
    ctx.lineWidth = (0.6 + rnd() * 0.9) * (W / 1080)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
    ctx.stroke()
  }
  ctx.restore()
}

const PAINTERS: Record<string, Painter> = {
  dawn: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#161d3d'],
      [0.42, '#3f4f8c'],
      [0.7, '#8d8db8'],
      [0.86, '#d9aeb0'],
      [1, '#f5cfb4'],
    ])
    stars(ctx, W, H, rnd, 140, 0.55, true)
    // 지평선의 여명
    glow(ctx, W * 0.5, H * 0.92, W * 0.75, '255,205,170', 0.55)
    glow(ctx, W * 0.5, H * 0.96, W * 0.35, '255,236,205', 0.5)
    // 낮게 깔린 안개
    softBand(ctx, W, H * 0.8, H * 0.08, '255,230,220', 0.12)
    softBand(ctx, W, H * 0.88, H * 0.06, '255,240,230', 0.1)
  },
  midnight: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#070b1c'],
      [0.6, '#111a3a'],
      [1, '#1f2d5a'],
    ])
    // 은하수 — 비스듬한 옅은 띠
    ctx.save()
    ctx.translate(W * 0.5, H * 0.45)
    ctx.rotate(-0.5)
    softBand(ctx, W * 2.4, 0, H * 0.34, '170,185,230', 0.16)
    softBand(ctx, W * 2.4, H * 0.02, H * 0.14, '215,220,245', 0.12)
    ctx.restore()
    stars(ctx, W, H, rnd, 320, 1, false)
    glow(ctx, W * 0.5, H * 1.02, W * 0.6, '70,95,170', 0.35)
  },
  sunset: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#2f2445'],
      [0.35, '#7a4a6a'],
      [0.6, '#d0665f'],
      [0.8, '#f29a5c'],
      [1, '#fbd28a'],
    ])
    // 해 — 지평선 아래로 반쯤 잠긴 빛
    glow(ctx, W * 0.6, H * 0.84, W * 0.55, '255,190,110', 0.55)
    glow(ctx, W * 0.6, H * 0.84, W * 0.18, '255,240,200', 0.85)
    // 얇게 걸린 구름 줄
    for (let i = 0; i < 6; i++) {
      const y = H * (0.3 + rnd() * 0.35)
      const w = W * (0.35 + rnd() * 0.5)
      const x = rnd() * W
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.translate(x, y)
      ctx.scale(1, 0.12 + rnd() * 0.08)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2)
      g.addColorStop(0, 'rgba(255,200,160,0.28)')
      g.addColorStop(1, 'rgba(255,200,160,0)')
      ctx.fillStyle = g
      ctx.fillRect(-w / 2, -w / 2, w, w)
      ctx.restore()
    }
  },
  sea: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#b7d3ec'],
      [0.5, '#7fb0d8'],
      [0.56, '#3b78b0'],
      [1, '#1f4d80'],
    ])
    glow(ctx, W * 0.5, H * 0.1, W * 0.8, '255,255,255', 0.28)
    // 수평선의 밝은 띠
    softBand(ctx, W, H * 0.555, H * 0.02, '235,245,255', 0.55)
    // 물결의 반짝임
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 90; i++) {
      const t = rnd()
      const y = H * (0.57 + t * t * 0.43)
      const w = W * (0.03 + rnd() * 0.16) * (0.4 + t)
      const x = rnd() * W
      ctx.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.1})`
      ctx.beginPath()
      ctx.ellipse(x, y, w / 2, Math.max(0.6, H * 0.0015 * (0.5 + t)), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  },
  ink: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#26252b'],
      [1, '#121114'],
    ])
    // 왼쪽 위에서 비치는 금빛 — 검은 종이 위 촛불의 온기
    glow(ctx, W * 0.12, H * 0.08, W * 0.7, '205,165,95', 0.14)
    glow(ctx, W * 0.9, H * 0.95, W * 0.5, '80,75,105', 0.28)
  },
  bokeh: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#1e1522'],
      [0.6, '#3a2230'],
      [1, '#5a3340'],
    ])
    const palette = ['255,207,138', '255,154,118', '255,228,184', '240,170,120']
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 44; i++) {
      const x = rnd() * W
      const y = H * (0.05 + rnd() * 0.9)
      const r = W * (0.025 + rnd() * rnd() * 0.11)
      const rgb = palette[Math.floor(rnd() * palette.length)]
      const a = 0.1 + rnd() * 0.24
      // 보케 원 — 가장자리가 살짝 더 밝은 렌즈 흐림
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${rgb},${a * 0.75})`)
      g.addColorStop(0.82, `rgba(${rgb},${a})`)
      g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    glow(ctx, W * 0.5, H * 1.05, W * 0.7, '232,162,92', 0.3)
  },
  lavender: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#8b80cc'],
      [1, '#c7a9de'],
    ])
    glow(ctx, W * 0.15, H * 0.2, W * 0.8, '240,205,225', 0.45)
    glow(ctx, W * 0.9, H * 0.75, W * 0.75, '150,140,225', 0.5, 'multiply')
    glow(ctx, W * 0.8, H * 0.1, W * 0.5, '255,235,245', 0.35)
    glow(ctx, W * 0.3, H * 0.95, W * 0.6, '225,190,225', 0.35)
  },
  sage: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#e3e9de'],
      [1, '#a7baa2'],
    ])
    glow(ctx, W * 0.2, H * 0.15, W * 0.7, '250,252,245', 0.5)
    glow(ctx, W * 0.85, H * 0.85, W * 0.7, '120,145,115', 0.35, 'multiply')
    fibers(ctx, W, H, rnd, 1400, '60,80,55')
  },
  cream: (ctx, W, H, rnd) => {
    vertical(ctx, W, H, [
      [0, '#fcf7ee'],
      [1, '#eee1cc'],
    ])
    fibers(ctx, W, H, rnd, 2600, '120,95,60')
    // 모서리가 살짝 바랜 종이
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6)
    v.addColorStop(0, 'rgba(210,190,150,0)')
    v.addColorStop(1, 'rgba(200,175,130,0.35)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  },
  hanji: (ctx, W, H, rnd) => {
    // 닥나무 결이 비치는 누런 종이 위에 먹이 번진 자국 — 붓글씨 족자의 바탕
    vertical(ctx, W, H, [
      [0, '#f4efe4'],
      [1, '#e6dfcf'],
    ])
    fibers(ctx, W, H, rnd, 3200, '110,95,70')
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    // 먹 번짐 — 왼쪽 아래에서 위로 스치듯 올라가는 담묵 두 붓
    const wash = (x: number, y: number, rx: number, ry: number, rot: number, a: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.scale(1, ry / rx)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
      g.addColorStop(0, `rgba(70,72,78,${a})`)
      g.addColorStop(0.55, `rgba(70,72,78,${a * 0.55})`)
      g.addColorStop(1, 'rgba(70,72,78,0)')
      ctx.fillStyle = g
      ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
      ctx.restore()
    }
    wash(W * 0.18, H * 0.86, W * 0.55, W * 0.16, -0.55, 0.32)
    wash(W * 0.32, H * 0.78, W * 0.4, W * 0.09, -0.7, 0.22)
    wash(W * 0.88, H * 0.12, W * 0.3, W * 0.1, 0.5, 0.14)
    // 종이 가장자리의 바램
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6)
    v.addColorStop(0, 'rgba(200,185,150,0)')
    v.addColorStop(1, 'rgba(190,170,135,0.35)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  },
  rose: (ctx, W, H) => {
    vertical(ctx, W, H, [
      [0, '#fbe6e8'],
      [1, '#e9a9b3'],
    ])
    glow(ctx, W * 0.2, H * 0.2, W * 0.75, '255,245,240', 0.6)
    glow(ctx, W * 0.85, H * 0.8, W * 0.7, '215,135,150', 0.4, 'multiply')
    glow(ctx, W * 0.75, H * 0.15, W * 0.45, '255,225,215', 0.4)
  },
}

const bgImageCache = new Map<string, Promise<HTMLImageElement>>()

/** 배경 장면을 4:5 이미지로 만든다 — 이후 사진과 동일한 파이프라인을 탄다. 한 번 만든 장면은 재사용한다 */
export const createBackgroundImage = (bg: VerseBackground): Promise<HTMLImageElement> => {
  const cached = bgImageCache.get(bg.id)
  if (cached) return cached
  const job = (async () => {
    const W = 1080
    const H = 1350
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')

    const rnd = seeded(Array.from(bg.id).reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
    const painter = PAINTERS[bg.id]
    if (painter) {
      painter(ctx, W, H, rnd)
    } else {
      const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, H)
      bg.stops.forEach((stop, i) => g.addColorStop(bg.stops.length === 1 ? 0 : i / (bg.stops.length - 1), stop))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }

    // 미세한 노이즈 — 그라데이션 밴딩(줄무늬)을 없애 인화지 질감을 준다
    const noise = ctx.getImageData(0, 0, W, H)
    const data = noise.data
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 7
      data[i] += n
      data[i + 1] += n
      data[i + 2] += n
    }
    ctx.putImageData(noise, 0, 0)

    const img = new Image()
    img.src = canvas.toDataURL('image/jpeg', 0.92)
    await img.decode()
    return img
  })()
  bgImageCache.set(bg.id, job)
  job.catch(() => bgImageCache.delete(bg.id))
  return job
}



// ── photoVerseCanvas 내부 공유 ──
export { seeded, vertical, glow, stars, softBand, fibers, PAINTERS, bgImageCache }
export type { Painter }
