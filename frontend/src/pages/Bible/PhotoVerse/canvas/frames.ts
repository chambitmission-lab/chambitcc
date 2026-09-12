// 프레임 — 폴라로이드/필름 여백 계산과 질감(그레인·빛샘·비네트), 절기 에디션 테두리.

import { dayOfYear, getSeasonSegments } from '../../../../utils/churchCalendar'
import type { ChurchSeason } from '../../../../utils/churchCalendar'
import { FONT_STACKS, minPx, setTracking } from './cardStyle'
import type { CardFrameId } from './cardStyle'
import { roundRect } from './text'
// ── 프레임 레이아웃 — 폴라로이드는 사진 주위에 여백이 붙어 canvas가 커진다 ──
const POLAROID = { side: 0.06, bottom: 0.2 } // 사진 너비 대비 비율

interface FrameLayout {
  canvasW: number
  canvasH: number
  /** 사진이 그려지는 영역 */
  px: number
  py: number
  pw: number
  ph: number
}

const frameLayout = (photoW: number, photoH: number, frame: CardFrameId): FrameLayout => {
  if (frame === 'polaroid') {
    const m = photoW * POLAROID.side
    return {
      canvasW: Math.round(photoW + m * 2),
      canvasH: Math.round(photoH + m + photoW * POLAROID.bottom),
      px: m,
      py: m,
      pw: photoW,
      ph: photoH,
    }
  }
  return { canvasW: Math.round(photoW), canvasH: Math.round(photoH), px: 0, py: 0, pw: photoW, ph: photoH }
}

/** canvas 크기에서 사진 영역을 역산한다 (frameLayout의 역함수) */
const layoutFromCanvas = (canvasW: number, canvasH: number, frame: CardFrameId): FrameLayout => {
  if (frame === 'polaroid') {
    const pw = canvasW / (1 + POLAROID.side * 2)
    const m = pw * POLAROID.side
    return { canvasW, canvasH, px: m, py: m, pw, ph: canvasH - m - pw * POLAROID.bottom }
  }
  return { canvasW, canvasH, px: 0, py: 0, pw: canvasW, ph: canvasH }
}

/** 필카 감성 날짜 스탬프 — '26 07 31 */
const drawDateStamp = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const stamp = `'${yy} ${mm} ${dd}`
  const px = minPx(l.pw, l.pw * 0.036, 11)
  ctx.save()
  ctx.font = `700 ${px}px Orbitron, monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(255, 130, 30, 0.85)'
  ctx.shadowBlur = px * 0.55
  ctx.fillStyle = 'rgba(255, 176, 77, 0.95)'
  ctx.fillText(stamp, l.px + l.pw - l.pw * 0.05, l.py + l.ph - l.pw * 0.05)
  ctx.restore()
}

/** 가장자리를 어둡게 하는 비네트 — 필름 프레임과 질감 옵션이 공유 */
const drawVignette = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  const cx = l.px + l.pw / 2
  const cy = l.py + l.ph / 2
  const inner = Math.min(l.pw, l.ph) * 0.42
  const outer = Math.hypot(l.pw, l.ph) * 0.62
  const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(10,8,14,0.34)')
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(l.px, l.py, l.pw, l.ph)
  ctx.restore()
}

// ── 질감 레이어 — 필름 그레인 / 빛샘 ─────────────────────────────
// 그레인 타일은 한 번 만들어 재사용한다
let grainTile: HTMLCanvasElement | null = null
const getGrainTile = (): HTMLCanvasElement | null => {
  if (grainTile) return grainTile
  const size = 128
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  const data = tctx.createImageData(size, size)
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + Math.round((Math.random() - 0.5) * 220)
    data.data[i] = v
    data.data[i + 1] = v
    data.data[i + 2] = v
    data.data[i + 3] = 255
  }
  tctx.putImageData(data, 0, 0)
  grainTile = tile
  return tile
}

/** 필름 그레인 — 미리보기·저장본에서 입자 크기가 같아 보이도록 해상도에 비례해 확대한다 */
const drawGrain = (ctx: CanvasRenderingContext2D, l: FrameLayout, alpha = 0.22) => {
  const tile = getGrainTile()
  if (!tile) return
  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern) return
  const scale = Math.max(0.5, l.pw / 1080)
  try {
    pattern.setTransform(new DOMMatrix().scaleSelf(scale, scale))
  } catch {
    /* setTransform 미지원 — 입자가 조금 곱게 보일 뿐 무해 */
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(l.px, l.py, l.pw, l.ph)
  ctx.clip()
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = alpha
  ctx.fillStyle = pattern
  ctx.fillRect(l.px, l.py, l.pw, l.ph)
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

/** 빛샘 — 오른쪽 위 모서리로 스며드는 따뜻한 빛 (필름 카메라의 라이트 리크) */
const drawLightLeak = (ctx: CanvasRenderingContext2D, l: FrameLayout) => {
  ctx.save()
  ctx.beginPath()
  ctx.rect(l.px, l.py, l.pw, l.ph)
  ctx.clip()
  ctx.globalCompositeOperation = 'screen'

  const cx = l.px + l.pw * 1.02
  const cy = l.py - l.ph * 0.04
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, l.pw * 0.85)
  glow.addColorStop(0, 'rgba(255, 110, 60, 0.5)')
  glow.addColorStop(0.45, 'rgba(255, 150, 80, 0.22)')
  glow.addColorStop(1, 'rgba(255, 170, 90, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(l.px, l.py, l.pw, l.ph)

  // 오른쪽 가장자리를 타고 흐르는 얇은 빛줄기
  const band = ctx.createLinearGradient(l.px + l.pw * 0.8, 0, l.px + l.pw, 0)
  band.addColorStop(0, 'rgba(255, 190, 120, 0)')
  band.addColorStop(1, 'rgba(255, 190, 120, 0.26)')
  ctx.fillStyle = band
  ctx.fillRect(l.px + l.pw * 0.8, l.py, l.pw * 0.2, l.ph)

  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
}

// ── 절기 에디션 — 교회력 계산(churchCalendar)으로 지금 절기의 스탬프를 찍는다 ──
interface SeasonTheme {
  labelKo: string
  labelEn: string
  accent: string
  /** 주차를 라벨에 붙일지 (사순 셋째 주 등) */
  weekly: boolean
  symbol: 'star' | 'cross' | 'flame' | 'sunrise' | 'leaf'
}

const SEASON_THEMES: Record<ChurchSeason, SeasonTheme> = {
  advent: { labelKo: '대림', labelEn: 'Advent', accent: '#a8bef2', weekly: true, symbol: 'flame' },
  christmas: { labelKo: '성탄절기', labelEn: 'Christmastide', accent: '#f6d488', weekly: false, symbol: 'star' },
  epiphany: { labelKo: '주현절기', labelEn: 'Epiphany', accent: '#cfe3f5', weekly: false, symbol: 'star' },
  lent: { labelKo: '사순', labelEn: 'Lent', accent: '#c9b3e8', weekly: true, symbol: 'cross' },
  easter: { labelKo: '부활', labelEn: 'Easter', accent: '#ffe8a8', weekly: true, symbol: 'sunrise' },
  ordinary: { labelKo: '연중', labelEn: 'Ordinary Time', accent: '#b5d6a8', weekly: false, symbol: 'leaf' },
}

const KO_ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째']

export interface SeasonStamp {
  key: ChurchSeason
  week: number
  year: number
  label: string
  accent: string
}

/** 오늘이 속한 절기 + 주차 라벨 — UI(프레임 이름)와 캔버스가 함께 쓴다 */
export const getSeasonStamp = (lang: 'ko' | 'en', date = new Date()): SeasonStamp => {
  const doy = dayOfYear(date)
  const segment = getSeasonSegments(date.getFullYear()).find(
    (s) => doy >= dayOfYear(s.start) && doy <= dayOfYear(s.end),
  )
  const key = segment?.key ?? 'ordinary'
  const week = segment ? Math.floor((doy - dayOfYear(segment.start)) / 7) + 1 : 1
  const theme = SEASON_THEMES[key]
  let label: string
  if (lang === 'ko') {
    label = theme.weekly ? `${theme.labelKo} ${KO_ORDINALS[week - 1] ?? `${week}째`} 주` : theme.labelKo
  } else {
    label = theme.weekly ? `${theme.labelEn} · Week ${week}` : theme.labelEn
  }
  return { key, week, year: date.getFullYear(), label, accent: theme.accent }
}

/** 절기 심볼 — 작은 선화(line art) */
const drawSeasonSymbol = (
  ctx: CanvasRenderingContext2D,
  symbol: SeasonTheme['symbol'],
  cx: number,
  cy: number,
  s: number
) => {
  ctx.save()
  ctx.lineWidth = Math.max(1, s * 0.14)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  switch (symbol) {
    case 'star':
      // 4각 별 — 베들레헴의 별
      ctx.moveTo(cx, cy - s)
      ctx.quadraticCurveTo(cx, cy, cx + s, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy + s)
      ctx.quadraticCurveTo(cx, cy, cx - s, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy - s)
      break
    case 'cross':
      ctx.moveTo(cx, cy - s)
      ctx.lineTo(cx, cy + s)
      ctx.moveTo(cx - s * 0.62, cy - s * 0.3)
      ctx.lineTo(cx + s * 0.62, cy - s * 0.3)
      break
    case 'flame':
      // 촛불 — 심지 위 물방울 모양 불꽃
      ctx.moveTo(cx, cy + s)
      ctx.lineTo(cx, cy + s * 0.45)
      ctx.moveTo(cx, cy - s)
      ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.15, cx + s * 0.45, cy + s * 0.45, cx, cy + s * 0.45)
      ctx.bezierCurveTo(cx - s * 0.45, cy + s * 0.45, cx - s * 0.7, cy - s * 0.15, cx, cy - s)
      break
    case 'sunrise':
      // 떠오르는 해 — 반원과 세 가닥 빛
      ctx.arc(cx, cy + s * 0.5, s * 0.55, Math.PI, 0)
      ctx.moveTo(cx, cy - s * 0.9)
      ctx.lineTo(cx, cy - s * 0.35)
      ctx.moveTo(cx - s * 0.75, cy - s * 0.55)
      ctx.lineTo(cx - s * 0.45, cy - s * 0.15)
      ctx.moveTo(cx + s * 0.75, cy - s * 0.55)
      ctx.lineTo(cx + s * 0.45, cy - s * 0.15)
      ctx.moveTo(cx - s, cy + s * 0.5)
      ctx.lineTo(cx + s, cy + s * 0.5)
      break
    case 'leaf':
      // 새순 — 줄기와 잎 하나
      ctx.moveTo(cx, cy + s)
      ctx.quadraticCurveTo(cx - s * 0.1, cy, cx, cy - s * 0.9)
      ctx.moveTo(cx, cy - s * 0.1)
      ctx.quadraticCurveTo(cx + s * 0.95, cy - s * 0.35, cx + s * 0.5, cy - s * 1.05)
      ctx.quadraticCurveTo(cx - s * 0.05, cy - s * 0.75, cx, cy - s * 0.1)
      break
  }
  ctx.stroke()
  ctx.restore()
}

/** 절기 에디션 프레임 — 이중 괘선 + 하단 절기 스탬프. 지금 이 절기에만 만들 수 있는 카드. */
const drawSeasonFrame = (ctx: CanvasRenderingContext2D, l: FrameLayout, lang: 'ko' | 'en') => {
  const stamp = getSeasonStamp(lang)
  const theme = SEASON_THEMES[stamp.key]
  const inset = l.pw * 0.035

  ctx.save()
  // 이중 괘선 — 클래식 인쇄물의 테두리
  ctx.strokeStyle = theme.accent
  ctx.globalAlpha = 0.9
  ctx.lineWidth = Math.max(1.4, l.pw * 0.0022)
  ctx.strokeRect(l.px + inset, l.py + inset, l.pw - inset * 2, l.ph - inset * 2)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = Math.max(0.8, l.pw * 0.001)
  const inner = inset + l.pw * 0.012
  ctx.strokeRect(l.px + inner, l.py + inner, l.pw - inner * 2, l.ph - inner * 2)
  ctx.globalAlpha = 1

  // 하단 중앙 스탬프 — 심볼 + "사순 셋째 주 · 2026"
  const labelPx = minPx(l.pw, l.pw * 0.026, 10)
  const text = `${stamp.label} · ${stamp.year}`
  ctx.font = `600 ${labelPx}px ${FONT_STACKS.serif}`
  setTracking(ctx, labelPx * 0.16)
  const textW = ctx.measureText(text).width
  const symS = labelPx * 0.72
  const gap = labelPx * 0.55
  const totalW = symS * 2 + gap + textW
  const cy = l.py + l.ph - inset - labelPx * 1.9
  const startX = l.px + l.pw / 2 - totalW / 2

  // 사진 위 가독성 — 은은한 어두운 필로우
  ctx.fillStyle = 'rgba(8, 8, 14, 0.3)'
  roundRect(
    ctx,
    startX - labelPx * 0.9,
    cy - labelPx * 0.95,
    totalW + labelPx * 1.8,
    labelPx * 1.95,
    labelPx
  )
  ctx.fill()

  ctx.strokeStyle = theme.accent
  ctx.fillStyle = theme.accent
  drawSeasonSymbol(ctx, theme.symbol, startX + symS, cy, symS)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, startX + symS * 2 + gap, cy + labelPx * 0.06)
  setTracking(ctx, 0)
  ctx.restore()
}


// ── photoVerseCanvas 내부 공유 ──
export { POLAROID, frameLayout, layoutFromCanvas, drawDateStamp, drawVignette, getGrainTile, drawGrain, drawLightLeak, SEASON_THEMES, KO_ORDINALS, drawSeasonSymbol, drawSeasonFrame }
export type { FrameLayout, SeasonTheme }
