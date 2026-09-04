// 완주 기념 카드 — 참여자 이름이 들어간 이미지를 canvas 로 그려 카톡에 공유한다.
// 말씀 사진 카드(photoVerseCanvas)의 폰트 로드 규칙(실제 텍스트를 load 에 넘김)을 따른다.
import { ensureCardFonts } from '../Bible/PhotoVerse/photoVerseCanvas'
import type { RoomDetail } from '../../types/meditationRoom'
import { formatMd } from './roomCourses'

const W = 1080
const H = 1350

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export const drawCompletionCard = async (room: RoomDetail): Promise<HTMLCanvasElement> => {
  const names = room.members.map((m) => m.name)
  const first = room.days[0]?.title ?? ''
  const last = room.days[room.days.length - 1]?.title ?? ''
  const endDate = room.days[room.days.length - 1]?.date ?? room.start_date
  await ensureCardFonts(`${room.title} ${names.join(' ')} ${first} ${last} 완주 함께 읽은 말씀 일 명`)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 바탕 — 남색 → 브랜드 블루 사선 그라데이션 + 두 개의 글로우
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#0b1224')
  g.addColorStop(0.58, '#14306a')
  g.addColorStop(1, '#2563eb')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.14, 0, W * 0.82, H * 0.14, 520)
  glow.addColorStop(0, 'rgba(96,165,250,0.45)')
  glow.addColorStop(1, 'rgba(96,165,250,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  const glow2 = ctx.createRadialGradient(W * 0.15, H * 1.02, 0, W * 0.15, H * 1.02, 560)
  glow2.addColorStop(0, 'rgba(49,130,246,0.32)')
  glow2.addColorStop(1, 'rgba(49,130,246,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  // 안쪽 점선 링 — 인장 문법
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 12])
  roundRect(ctx, 54, 54, W - 108, H - 108, 44)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = '600 30px Pretendard, sans-serif'
  ctx.letterSpacing = '10px'
  ctx.fillText('TOGETHER · COMPLETED', W / 2, 190)
  ctx.letterSpacing = '0px'

  // 제목
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 84px "Noto Serif KR", serif'
  const titleLines = wrapText(ctx, room.title, W - 200).slice(0, 2)
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, 330 + i * 104))
  let y = 330 + titleLines.length * 104

  // 완주 수치
  ctx.font = '700 168px "Noto Serif KR", serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${room.total_days}일`, W / 2, y + 190)
  ctx.font = '500 38px Pretendard, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('함께 완주했어요', W / 2, y + 260)
  y += 340

  // 본문 범위
  ctx.font = '400 34px "Noto Serif KR", serif'
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  const range = first && last && first !== last ? `${first} — ${last}` : first
  wrapText(ctx, range, W - 240).slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, y + i * 46))
  y += 110

  // 이름들 — 흰 카드
  const nameLines = wrapText(ctx, names.join(' · '), W - 260)
  ctx.font = '600 36px Pretendard, sans-serif'
  const cardH = 90 + nameLines.length * 52
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 110, y, W - 220, cardH, 36)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 24px Pretendard, sans-serif'
  ctx.fillText(`함께한 ${names.length}명`, W / 2, y + 46)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 36px Pretendard, sans-serif'
  nameLines.forEach((l, i) => ctx.fillText(l, W / 2, y + 100 + i * 52))
  y += cardH + 70

  // 날짜
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = '500 28px Pretendard, sans-serif'
  ctx.fillText(`${formatMd(room.start_date)} — ${formatMd(String(endDate))}`, W / 2, Math.min(y, H - 150))

  // 브랜드
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '600 24px Pretendard, sans-serif'
  ctx.letterSpacing = '6px'
  ctx.fillText('참빛교회 · 공동 묵상방', W / 2, H - 92)
  ctx.letterSpacing = '0px'

  return canvas
}

export const completionCardFile = async (room: RoomDetail): Promise<File | null> => {
  const canvas = await drawCompletionCard(room)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) return null
  return new File([blob], `완주카드_${room.title.replace(/[\s/\\:]/g, '_')}.jpg`, { type: 'image/jpeg' })
}
