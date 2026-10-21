// 동행 우정 카드 — 4:5 세로(인스타 피드·스토리 겸용) 캔버스 한 장.
// 두 사람의 이름 도장은 번갈아 같은 수만큼(누가 더 걸었는지 보이지 않게), 길 끝 촛불은 켜진 채로.
import type { Milestone } from './milestones'
import { stampChars } from './stampChars'

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
  colors: { me: string; you: string }
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

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

/** 이름 첫 글자 음각 도장 — 꽉 찬 인주 위로 글자가 하얗게 빠지고, 덜 묻은 자리·덜 눌린 쪽이 비친다.
    한 장씩 오프스크린에 그려 잉크를 덜어 낸 뒤 살짝 기울여 찍는다 */
const stamp = (ctx: CanvasRenderingContext2D, x: number, y: number, deg: number, color: string, char: string, seed: number) => {
  const box = 110
  const off = document.createElement('canvas')
  off.width = box
  off.height = box
  const c = off.getContext('2d')
  if (!c) return
  c.translate(box / 2, box / 2)
  c.fillStyle = color
  c.beginPath()
  c.roundRect(-37, -37, 74, 74, 16)
  c.fill()
  c.globalCompositeOperation = 'destination-out'
  c.font = `800 44px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(char, 0, 2)
  c.setTransform(1, 0, 0, 1, 0, 0)

  // 인주가 덜 묻은 자리
  const rand = rng(seed * 97 + 13)
  for (let k = 0; k < box * 1.6; k++) {
    c.globalAlpha = 0.25 + rand() * 0.6
    c.beginPath()
    c.arc(rand() * box, rand() * box, 0.6 + rand() * 1.8, 0, Math.PI * 2)
    c.fill()
  }
  // 한쪽이 덜 눌린 결
  const side = rand() * Math.PI * 2
  const dx = (Math.cos(side) * box) / 2
  const dy = (Math.sin(side) * box) / 2
  const fade = c.createLinearGradient(box / 2 + dx, box / 2 + dy, box / 2 - dx, box / 2 - dy)
  fade.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
  fade.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
  c.globalAlpha = 1
  c.fillStyle = fade
  c.fillRect(0, 0, box, box)

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.globalAlpha = 0.9
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(off, -box / 2, -box / 2)
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

  // 짝수 — 둘이 같은 수만큼 찍는다
  const steps = 8
  const tilt = rng(41)
  const [meChar, youChar] = stampChars(i.myName, i.partnerName)
  for (let s = 0; s < steps; s++) {
    const x = x0 + ((x1 - x0) * (s + 0.5)) / steps
    const angle = Math.atan2(slope(x), 1)
    const mine = s % 2 === 0
    const side = mine ? -36 : 36
    stamp(
      ctx,
      x - Math.sin(angle) * side,
      y(x) + Math.cos(angle) * side,
      (tilt() - 0.5) * 16,
      mine ? i.colors.me : i.colors.you,
      mine ? meChar : youChar,
      s + 1,
    )
  }

  // 길 끝 촛불 — 켜진 채로. 화면의 FootprintPath 처럼 길 높이에 맞춰 세운다
  drawCandle(ctx, 950, mid + 28, 104)
}

/* 길 끝 촛불 — 화면의 MiniCandle(CandleSvg)을 캔버스로 옮긴 것. 경로·색은 그 viewBox(5 1 14 26)
   좌표 그대로 쓰고, 흔들림 없는 한 장이라 빛무리는 맥동의 중간 밝기로 둔다. */
const drawCandle = (ctx: CanvasRenderingContext2D, cx: number, bottom: number, height: number) => {
  const s = height / 26
  ctx.save()
  // 카드 종이 위로 번지는 넓은 온기 — 화면에선 주변 면이 대신 해 주는 몫
  const warm = ctx.createRadialGradient(cx, bottom - 17 * s, 0, cx, bottom - 17 * s, 120)
  warm.addColorStop(0, 'rgba(255, 176, 96, 0.22)')
  warm.addColorStop(1, 'rgba(255, 176, 96, 0)')
  ctx.fillStyle = warm
  ctx.fillRect(cx - 120, bottom - 17 * s - 120, 240, 240)

  ctx.translate(cx, bottom)
  ctx.scale(s, s)
  ctx.translate(-12, -27)

  // 빛무리
  const gl = ctx.createRadialGradient(12, 10, 0, 12, 10, 9)
  gl.addColorStop(0, 'rgba(255, 196, 122, 0.55)')
  gl.addColorStop(1, 'rgba(255, 176, 96, 0)')
  ctx.globalAlpha = 0.8
  ctx.fillStyle = gl
  ctx.beginPath()
  ctx.arc(12, 10, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // 초 몸통: 불빛 받은 윗부분은 밝은 크림, 아래로 갈수록 그늘 + 좌우 원통 음영
  const body = () => {
    ctx.beginPath()
    ctx.moveTo(7, 15)
    ctx.lineTo(7, 24.5)
    ctx.ellipse(12, 24.5, 5, 1.2, 0, Math.PI, 0, true)
    ctx.lineTo(17, 15)
    ctx.ellipse(12, 15, 5, 1.2, 0, 0, Math.PI, true)
    ctx.closePath()
  }
  const wv = ctx.createLinearGradient(0, 13.8, 0, 25.7)
  wv.addColorStop(0, '#fff4e2')
  wv.addColorStop(0.35, '#f6e2c8')
  wv.addColorStop(1, '#c9a37e')
  body()
  ctx.fillStyle = wv
  ctx.fill()
  const wh = ctx.createLinearGradient(7, 0, 17, 0)
  wh.addColorStop(0, 'rgba(74, 44, 20, 0.35)')
  wh.addColorStop(0.3, 'rgba(74, 44, 20, 0)')
  wh.addColorStop(0.7, 'rgba(74, 44, 20, 0)')
  wh.addColorStop(1, 'rgba(74, 44, 20, 0.4)')
  body()
  ctx.fillStyle = wh
  ctx.fill()
  ctx.fillStyle = '#fdecd2'
  ctx.beginPath()
  ctx.ellipse(12, 15, 5, 1.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // 심지
  ctx.strokeStyle = '#3a2a1e'
  ctx.lineWidth = 0.9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(12, 15)
  ctx.quadraticCurveTo(11.8, 13.8, 12.2, 12.6)
  ctx.stroke()

  // 겉불꽃 — SVG 는 bbox 기준 타원 그라데이션이라, 경로를 잡은 뒤 좌표만 bbox 로 바꿔 칠한다.
  // drop-shadow 두 겹은 캔버스 그림자로(그림자 흐림은 변환과 무관한 픽셀 단위라 s 를 곱한다)
  const flame = () => {
    ctx.beginPath()
    ctx.moveTo(12.2, 3)
    ctx.bezierCurveTo(12.8, 6, 15.2, 8.6, 15.2, 10.8)
    ctx.bezierCurveTo(15.2, 12.6, 13.8, 13.6, 12.2, 13.6)
    ctx.bezierCurveTo(10.6, 13.6, 9.2, 12.6, 9.2, 10.8)
    ctx.bezierCurveTo(9.2, 8.6, 11.6, 6, 12.2, 3)
    ctx.closePath()
  }
  const paintFlame = (shadow: string, blur: number) => {
    flame()
    ctx.save()
    ctx.shadowColor = shadow
    ctx.shadowBlur = blur * s
    ctx.translate(9.2, 3)
    ctx.scale(6, 10.6)
    const ff = ctx.createRadialGradient(0.5, 0.74, 0, 0.5, 0.74, 0.62)
    ff.addColorStop(0, '#fffdf4')
    ff.addColorStop(0.32, '#fff0bf')
    ff.addColorStop(0.62, '#ffc15a')
    ff.addColorStop(0.88, 'rgba(255, 138, 61, 0.9)')
    ff.addColorStop(1, 'rgba(255, 122, 46, 0)')
    ctx.fillStyle = ff
    ctx.fill()
    ctx.restore()
  }
  paintFlame('rgba(251, 146, 60, 0.45)', 7)
  paintFlame('rgba(255, 170, 80, 0.85)', 3)

  // 속불꽃
  ctx.globalAlpha = 0.92
  ctx.fillStyle = '#fffef8'
  ctx.beginPath()
  ctx.moveTo(12.2, 8)
  ctx.bezierCurveTo(12.5, 9.4, 13.4, 10.6, 13.4, 11.6)
  ctx.bezierCurveTo(13.4, 12.5, 12.9, 13, 12.2, 13)
  ctx.bezierCurveTo(11.5, 13, 11, 12.5, 11, 11.6)
  ctx.bezierCurveTo(11, 10.6, 11.9, 9.4, 12.2, 8)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
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
