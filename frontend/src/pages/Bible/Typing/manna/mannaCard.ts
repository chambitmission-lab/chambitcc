// 만나 내리기 공유 카드 — 드롭 9:16 스토리 카드(오늘의 만나 유형 · 점수 타일)를 지금 테마(라이트·다크)로 그린다.
// 인스타 스토리에 바로 올릴 수 있다. 색은 manna-skins.css 의 --dr-* 토큰과 같은 값이다(바꾸면 함께 맞출 것).
// 그리는 글자로 fonts.load 를 먼저 기다린다(canvas 한글 웹폰트는 조각이 늦게 와 폴백이 섞인다).
import { ensureFontFamily } from '../../../../utils/deferredFonts'
import { PLACES, type MannaResult } from './mannaEngine'
import { isoWeek, mannaPersona } from './mannaSkin'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'

const SANS = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", sans-serif'
const DISPLAY = '"Black Han Sans", "Pretendard Variable", "Pretendard", sans-serif'
const ICONS = '"Material Icons Round"'

const DROP = {
  // 라이트 화면의 스토리 카드는 잉크, 다크 화면은 크림으로 뒤집힌다(.mn-story 와 같다)
  light: { bg: '#14110f', ink: '#fff3e3', sub: '#e9dccd', tile: '#26211d', tileLine: '#3c342d', band: '#c6f24e', bandInk: '#14110f' },
  dark: { bg: '#fff3e3', ink: '#14110f', sub: '#4a3f36', tile: '#f0e2cf', tileLine: '#e0cfb8', band: '#14110f', bandInk: '#c6f24e' },
}
const D_ORANGE = '#ff5a1f'
const D_LIME = '#c6f24e'
const D_SKY = '#7fd3ff'
const D_GOLD = '#ffd23f'
const D_ON = '#14110f'

export interface MannaCardInput {
  dark: boolean
  result: MannaResult
  verses: number
  kindLabel: string
  modeLabel: string
  /** YYYY-MM-DD */
  date: string
  rank: number | null
  isBest: boolean
  rivalName: string | null
  rivalDelta: number | null
  live: boolean
}


/** maxWidth 안에 들어가는 가장 큰 글자 크기로 font 를 맞춘다 */
const fitFont = (ctx: CanvasRenderingContext2D, text: string, weight: string, family: string, size: number, maxWidth: number) => {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > 12 && ctx.measureText(text).width > maxWidth) {
    s -= 4
    ctx.font = `${weight} ${s}px ${family}`
  }
  return s
}

const ellipsize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

const loadFonts = async (loads: [string, string][]) => {
  try {
    await Promise.all(loads.map(([font, text]) => document.fonts.load(font, text)))
  } catch {
    /* 시스템 폰트 폴백 */
  }
}


export const renderMannaCard = async (input: MannaCardInput): Promise<Blob | null> => {
  const W = 1080
  const H = 1920
  const c = input.dark ? DROP.dark : DROP.light
  const { result: r } = input
  const p = mannaPersona(r, input.verses)
  const titleLines = p.title.split('\n')
  const descLines = p.desc.split('\n')
  const place = PLACES[Math.min(r.versesDone, PLACES.length - 1)]
  const tags = [
    r.reachedCanaan ? '#가나안도착' : `#${place.replace(/\s/g, '')}까지`,
    r.maxCombo >= 5 ? `#콤보${r.maxCombo}` : null,
    input.isBest ? '#최고기록' : null,
    input.live ? '#라이브' : null,
    `#${input.modeLabel}`,
  ].filter(Boolean) as string[]
  const tiles: [string, string][] = [
    ['점수', fmt(r.score)],
    ['오늘 순위', input.rank ? `${input.rank}위` : '–'],
    [p.stat.label, p.stat.value],
    input.rivalName && input.rivalDelta !== null
      ? [`${input.rivalName}님보다`, `${input.rivalDelta >= 0 ? '+' : '−'}${fmt(Math.abs(input.rivalDelta))}`]
      : ['새긴 말씀', `${r.versesDone}/${input.verses}`],
  ]
  const sample = `오늘의나는${titleLines.join('')}${descLines.join('')}${tags.join('')}${tiles.flat().join('')}MYMANNATYPEDROPSEASON·만나드롭참빛${r.refs.join('')}0123456789,.+−`
  await ensureFontFamily('blackHanSans')
  await loadFonts([
    [`400 120px ${DISPLAY}`, sample],
    [`800 34px ${SANS}`, sample],
    [`600 40px ${SANS}`, sample],
    [`400 200px ${ICONS}`, p.icon],
  ])
  const iconReady = (() => {
    try {
      return document.fonts.check(`400 200px ${ICONS}`, p.icon)
    } catch {
      return false
    }
  })()

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, W, H)

  // 맨 위 띠
  ctx.fillStyle = c.band
  ctx.fillRect(0, 0, W, 84)
  ctx.fillStyle = c.bandInk
  ctx.font = `800 30px ${SANS}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const bandText = `MANNA DROP ● SEASON ${isoWeek(new Date(`${input.date}T12:00:00`))} ● 광야 ● `
  const bw = ctx.measureText(bandText).width
  for (let x = 40; x < W; x += bw) ctx.fillText(bandText, x, 44)
  ctx.textBaseline = 'alphabetic'

  // 유형 원(글자 뒤)
  const blob = { perfect: D_GOLD, gold: D_GOLD, speed: D_SKY, stroll: D_SKY, combo: D_LIME }[p.key] ?? D_ORANGE
  ctx.fillStyle = blob
  ctx.beginPath()
  ctx.arc(1000, 1010, 250, 0, Math.PI * 2)
  ctx.fill()
  if (iconReady) {
    ctx.fillStyle = D_ON
    ctx.font = `400 220px ${ICONS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.icon, 930, 1010)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
  }

  ctx.fillStyle = D_ORANGE
  ctx.font = `800 34px ${SANS}`
  ctx.fillText(`MY MANNA TYPE · ${input.date.slice(5).replace('-', '.')}`, 80, 220)

  ctx.fillStyle = c.ink
  ctx.font = `400 104px ${DISPLAY}`
  ctx.fillText('오늘의 나는', 80, 370)
  ctx.fillStyle = D_ORANGE
  let ty = 510
  for (const line of titleLines) {
    fitFont(ctx, line, '400', DISPLAY, 140, W - 160)
    ctx.fillText(line, 80, ty)
    ty += 150
  }

  ctx.fillStyle = c.sub
  ctx.font = `600 40px ${SANS}`
  ty += 10
  for (const line of descLines) {
    ctx.fillText(ellipsize(ctx, line, 660), 80, ty)
    ty += 58
  }

  // 해시태그 칩
  ctx.font = `800 32px ${SANS}`
  let x = 80
  let y = ty + 40
  for (const t of tags) {
    const w = ctx.measureText(t).width + 44
    if (x + w > W - 80) {
      x = 80
      y += 72
    }
    ctx.fillStyle = c.tile
    ctx.beginPath()
    ctx.roundRect(x, y - 42, w, 58, 29)
    ctx.fill()
    ctx.strokeStyle = c.tileLine
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = c.ink
    ctx.fillText(t, x + 22, y - 2)
    x += w + 14
  }

  // 점수 타일 2×2
  const gx = 80
  const gw = (W - 160 - 20) / 2
  const gh = 190
  const gy = 1290
  tiles.forEach(([label, value], i) => {
    const tx = gx + (i % 2) * (gw + 20)
    const tyy = gy + Math.floor(i / 2) * (gh + 20)
    ctx.fillStyle = i === 0 ? D_LIME : c.tile
    ctx.beginPath()
    ctx.roundRect(tx, tyy, gw, gh, 32)
    ctx.fill()
    const ink = i === 0 ? D_ON : c.ink
    ctx.fillStyle = ink
    ctx.globalAlpha = 0.72
    ctx.font = `700 30px ${SANS}`
    ctx.fillText(ellipsize(ctx, label, gw - 60), tx + 32, tyy + 58)
    ctx.globalAlpha = 1
    fitFont(ctx, value, '400', DISPLAY, 84, gw - 64)
    ctx.fillText(value, tx + 32, tyy + 156)
  })

  // 새긴 말씀 + 바닥 서명
  ctx.fillStyle = c.sub
  ctx.font = `600 30px ${SANS}`
  if (r.refs.length) ctx.fillText(ellipsize(ctx, `새긴 말씀 · ${r.refs.join(' · ')}`, W - 160), 80, 1745)
  ctx.fillStyle = c.ink
  ctx.font = `400 44px ${DISPLAY}`
  ctx.fillText('만나 드롭', 80, 1840)
  ctx.textAlign = 'right'
  ctx.font = `800 30px ${SANS}`
  ctx.fillStyle = c.sub
  ctx.fillText(`${input.kindLabel} · ${input.modeLabel}`, W - 80, 1836)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
