// 주간 기도 스토리 공유 카드 — 9:16 스토리 비율 canvas.
// 화면과 같은 A안 문법: 토스 블루 색면 + Black Han Sans 큰 숫자 + 명조 말씀.
import { ensureFontFamily } from '../../utils/deferredFonts'
import type { WeeklyStoryData } from '../../types/weeklyStory'

const W = 1080
const H = 1920
const DISPLAY = '"Black Han Sans", "Pretendard Variable", sans-serif'
const SANS = '"Pretendard Variable", Pretendard, sans-serif'
const SERIF = '"Noto Serif KR", serif'

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
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

const md = (iso: string) => iso.slice(5).replace('-', '.')

export const drawWeeklyStoryCard = async (story: WeeklyStoryData): Promise<HTMLCanvasElement> => {
  const ai = story.ai_narrative
  const total = story.hook.prayer_count
  const sample = `${ai.title} ${ai.verse_text ?? ''} ${ai.verse_reference ?? ''} ${total} 번 기도한 한 주 새 기도 응답 참빛교회 주간 기도 스토리 0123456789.–`
  try {
    await ensureFontFamily('blackHanSans')
    await Promise.all([
      document.fonts.load(`400 80px "Black Han Sans"`, sample),
      document.fonts.load(`600 40px "Pretendard Variable"`, sample),
      document.fonts.load(`500 40px "Noto Serif KR"`, sample),
    ])
  } catch {
    // 폰트 실패 시 폴백으로 그린다
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#3182f6'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.92, H * 0.08, 0, W * 0.92, H * 0.08, 620)
  glow.addColorStop(0, 'rgba(120,180,255,0.75)')
  glow.addColorStop(1, 'rgba(120,180,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const X = 96
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `700 40px ${SANS}`
  ctx.fillText(`${md(story.week_start)} – ${md(story.week_end)} · 이번 주`, X, 200)

  ctx.fillStyle = '#ffffff'
  ctx.font = `400 420px ${DISPLAY}`
  ctx.fillText(String(total), X - 16, 640)
  ctx.font = `400 128px ${DISPLAY}`
  ctx.fillText('번 기도했어요', X, 800)

  // 칩
  const chips = [`새 기도 ${story.hook.new_prayer_count}`, `응답 ${story.hook.answered_count}`]
  ctx.font = `700 38px ${SANS}`
  let cx = X
  for (const c of chips) {
    const w = ctx.measureText(c).width + 60
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    ctx.roundRect(cx, 860, w, 78, 39)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(c, cx + 30, 912)
    cx += w + 16
  }

  // 아래 흰 카드 — 한 문장 + 말씀
  const cardY = 1080
  ctx.save()
  ctx.translate(W / 2, cardY + 330)
  ctx.rotate((-2 * Math.PI) / 180)
  ctx.translate(-W / 2, -(cardY + 330))
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(X - 20, cardY, W - 2 * (X - 20), 640, 56)
  ctx.fill()
  ctx.fillStyle = '#191f28'
  ctx.font = `400 64px ${DISPLAY}`
  const titleLines = wrap(ctx, ai.title, W - 2 * X - 60).slice(0, 2)
  titleLines.forEach((l, i) => ctx.fillText(l, X + 30, cardY + 120 + i * 80))
  let y = cardY + 120 + titleLines.length * 80 + 30
  if (ai.verse_text) {
    ctx.fillStyle = '#4e5968'
    ctx.font = `500 38px ${SERIF}`
    const vLines = wrap(ctx, `“${ai.verse_text}”`, W - 2 * X - 60).slice(0, 5)
    vLines.forEach((l, i) => ctx.fillText(l, X + 30, y + i * 60))
    y += vLines.length * 60 + 10
    if (ai.verse_reference) {
      ctx.fillStyle = '#3182f6'
      ctx.font = `700 32px ${SANS}`
      ctx.fillText(ai.verse_reference, X + 30, y + 20)
    }
  }
  ctx.restore()

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `600 32px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('참빛교회 · 주간 기도 스토리', W / 2, H - 110)

  return canvas
}

export const weeklyStoryCardFile = async (story: WeeklyStoryData): Promise<File | null> => {
  const canvas = await drawWeeklyStoryCard(story)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) return null
  return new File([blob], `주간기도_${story.week_start}.jpg`, { type: 'image/jpeg' })
}
