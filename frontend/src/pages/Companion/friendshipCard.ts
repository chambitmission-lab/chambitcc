// 동행 우정 카드 — 4:5 세로(인스타 피드·스토리 겸용) 캔버스 한 장.
// 두 사람의 발자국은 번갈아(누가 더 걸었는지 보이지 않게), 길 끝 등불은 켜진 채로.
import type { Milestone } from './milestones'

const W = 1080
const H = 1350
const FONT = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'

export interface FriendshipCardInput {
  milestone: Milestone
  myName: string
  partnerName: string
  togetherWeeks: number
  litWeeks: number
  cheers: number
  colors: { me: string; you: string; flame: string }
}

const statsLine = (i: FriendshipCardInput) =>
  `함께 걸은 ${i.togetherWeeks}주 · 등불 ${i.litWeeks}개 · 서로를 위한 기도 ${i.cheers}번`

const dateLine = () => {
  const d = new Date()
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`
}

/** canvas 는 미로드 한글 서브셋 조각을 기다리지 않는다 — 실제로 그릴 글자로 미리 받아 둔다 */
const ensureFonts = async (text: string) => {
  try {
    await Promise.all(
      ['800 96px', '700 44px', '500 32px'].map((spec) => document.fonts.load(`${spec} ${FONT}`, text)),
    )
  } catch {
    /* 폰트가 없으면 시스템 글꼴로 그린다 */
  }
}

const foot = (ctx: CanvasRenderingContext2D, x: number, y: number, deg: number, color: string) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, -5, 10, 14, 0, 0, Math.PI * 2)
  ctx.ellipse(0, 16, 7.5, 6.8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const drawPath = (ctx: CanvasRenderingContext2D, i: FriendshipCardInput) => {
  const x0 = 120
  const x1 = 860
  const mid = 760
  const amp = 46
  const y = (x: number) => mid + amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 2)
  const slope = (x: number) => amp * Math.cos(((x - x0) / (x1 - x0)) * Math.PI * 2) * ((Math.PI * 2) / (x1 - x0))

  ctx.save()
  ctx.strokeStyle = 'rgba(25, 31, 40, 0.14)'
  ctx.lineWidth = 3
  ctx.setLineDash([4, 14])
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let k = 0; k <= 60; k++) {
    const x = x0 + ((x1 - x0) * k) / 60
    if (k === 0) ctx.moveTo(x, y(x))
    else ctx.lineTo(x, y(x))
  }
  ctx.stroke()
  ctx.restore()

  const steps = 12
  for (let s = 0; s < steps; s++) {
    const x = x0 + ((x1 - x0) * (s + 0.5)) / steps
    const angle = Math.atan2(slope(x), 1)
    const side = s % 2 === 0 ? -18 : 18
    foot(
      ctx,
      x - Math.sin(angle) * side,
      y(x) + Math.cos(angle) * side,
      (angle * 180) / Math.PI + 90,
      s % 2 === 0 ? i.colors.me : i.colors.you,
    )
  }

  // 길 끝 등불 — 켜진 채로
  const lx = 950
  const ly = mid - 12
  const glow = ctx.createRadialGradient(lx, ly + 10, 4, lx, ly + 10, 110)
  glow.addColorStop(0, 'rgba(255, 181, 71, 0.55)')
  glow.addColorStop(1, 'rgba(255, 181, 71, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(lx, ly + 10, 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = i.colors.flame
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(lx, ly - 52)
  ctx.lineTo(lx, ly - 40)
  ctx.moveTo(lx - 16, ly - 40)
  ctx.lineTo(lx + 16, ly - 40)
  ctx.moveTo(lx - 16, ly + 30)
  ctx.lineTo(lx + 16, ly + 30)
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(lx - 22, ly - 40, 44, 62, 13)
  ctx.stroke()
  ctx.fillStyle = i.colors.flame
  ctx.beginPath()
  ctx.moveTo(lx, ly - 22)
  ctx.bezierCurveTo(lx + 8, ly - 12, lx + 11, ly - 5, lx + 11, ly + 2)
  ctx.arc(lx, ly + 2, 11, 0, Math.PI, false)
  ctx.bezierCurveTo(lx - 11, ly - 5, lx - 8, ly - 12, lx, ly - 22)
  ctx.fill()
}

/** 종이 질감 — 고정 시드라 같은 카드는 늘 같은 결 */
const grain = (ctx: CanvasRenderingContext2D) => {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  ctx.save()
  for (let k = 0; k < 9000; k++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(80, 60, 30, 0.05)' : 'rgba(255, 255, 255, 0.35)'
    ctx.fillRect(rand() * W, rand() * H, 1.6, 1.6)
  }
  ctx.restore()
}

export const drawFriendshipCard = async (input: FriendshipCardInput): Promise<HTMLCanvasElement> => {
  const pair = `${input.myName} · ${input.partnerName}`
  await ensureFonts(`WALK TOGETHER동행${input.milestone.label}${input.milestone.line}${pair}${statsLine(input)}${dateLine()}참빛`)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#fbf8f1')
  bg.addColorStop(1, '#f2ebdd')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  grain(ctx)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = input.colors.me
  ctx.font = `700 26px ${FONT}`
  ctx.letterSpacing = '10px'
  ctx.fillText('WALK TOGETHER', W / 2, 190)
  ctx.letterSpacing = '0px'

  ctx.fillStyle = '#191f28'
  ctx.font = `800 96px ${FONT}`
  ctx.fillText(input.milestone.label, W / 2, 330)

  ctx.fillStyle = '#4e5968'
  ctx.font = `500 36px ${FONT}`
  ctx.fillText(input.milestone.line, W / 2, 400)

  ctx.fillStyle = '#191f28'
  ctx.font = `700 46px ${FONT}`
  ctx.fillText(pair, W / 2, 540)

  drawPath(ctx, input)

  ctx.fillStyle = '#4e5968'
  ctx.font = `500 32px ${FONT}`
  ctx.fillText(statsLine(input), W / 2, 1040)

  ctx.fillStyle = 'rgba(25, 31, 40, 0.45)'
  ctx.font = `500 28px ${FONT}`
  ctx.fillText(dateLine(), W / 2, 1210)
  ctx.font = `700 28px ${FONT}`
  ctx.fillText('참빛 · 동행', W / 2, 1256)

  return canvas
}

export const friendshipCardFile = async (input: FriendshipCardInput): Promise<File | null> => {
  const canvas = await drawFriendshipCard(input)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ? new File([blob], `동행_${input.milestone.label.replace(/\s/g, '_')}.png`, { type: 'image/png' }) : null
}
