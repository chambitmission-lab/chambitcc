// 오늘의 한 절 결과 카드 — 인스타 스토리·카톡으로 보내기 좋은 4:5 이미지
// canvas 한글 웹폰트는 서브셋 조각이 늦게 와 폴백이 섞이므로, 그릴 글자로 fonts.load 를 먼저 기다린다

const W = 1080
const H = 1350
const SERIF = '"Noto Serif KR", "Apple SD Gothic Neo", serif'
const SANS = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", sans-serif'

interface DailyCardInput {
  text: string
  refLabel: string
  dateLabel: string
  statLine: string
}

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = []
  let line = ''
  for (const word of text.replace(/\s+/g, ' ').trim().split(' ')) {
    const tryLine = line ? `${line} ${word}` : word
    if (ctx.measureText(tryLine).width <= maxWidth) {
      line = tryLine
      continue
    }
    if (line) lines.push(line)
    // 한 어절이 줄보다 길면 글자 단위로 자른다
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = ''
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width > maxWidth) {
          lines.push(chunk)
          chunk = ch
        } else chunk += ch
      }
      line = chunk
    } else line = word
  }
  if (line) lines.push(line)
  return lines
}

const loadFonts = async (sample: string) => {
  try {
    await Promise.all([
      document.fonts.load(`600 52px ${SERIF}`, sample),
      document.fonts.load(`600 32px ${SANS}`, sample),
      document.fonts.load(`500 30px ${SANS}`, sample),
    ])
  } catch {
    /* 시스템 폰트 폴백 */
  }
}

export const renderDailyCard = async (input: DailyCardInput): Promise<Blob | null> => {
  const sample = `${input.text}${input.refLabel}${input.dateLabel}${input.statLine}오늘의한절말씀필사손끝으로새긴`
  await loadFonts(sample)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // 종이 바탕
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#fbf8f1')
  bg.addColorStop(1, '#efe8d8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // 잉크 번짐 장식
  const blot = ctx.createRadialGradient(W - 150, 170, 10, W - 150, 170, 220)
  blot.addColorStop(0, 'rgba(49,130,246,0.16)')
  blot.addColorStop(1, 'rgba(49,130,246,0)')
  ctx.fillStyle = blot
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(60,50,30,0.14)'
  ctx.lineWidth = 2
  ctx.strokeRect(48, 48, W - 96, H - 96)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#3182f6'
  ctx.font = `600 32px ${SANS}`
  ctx.fillText('오늘의 한 절', 110, 180)
  ctx.fillStyle = '#8a8270'
  ctx.font = `500 30px ${SANS}`
  ctx.fillText(input.dateLabel, 110, 228)

  // 본문 — 길면 글씨를 줄인다
  let size = 56
  let lines: string[] = []
  for (; size >= 36; size -= 4) {
    ctx.font = `600 ${size}px ${SERIF}`
    lines = wrap(ctx, input.text, W - 220)
    if (lines.length * size * 1.7 <= 700) break
  }
  const lh = size * 1.7
  const blockH = lines.length * lh
  let y = 330 + (720 - blockH) / 2 + size
  ctx.fillStyle = '#1f2430'
  ctx.font = `600 ${size}px ${SERIF}`
  for (const l of lines) {
    ctx.fillText(l, 110, y)
    y += lh
  }
  ctx.fillStyle = '#6b6352'
  ctx.font = `600 34px ${SANS}`
  ctx.fillText(`— ${input.refLabel}`, 110, Math.min(y + 30, 1120))

  ctx.strokeStyle = 'rgba(60,50,30,0.18)'
  ctx.beginPath()
  ctx.moveTo(110, 1170)
  ctx.lineTo(W - 110, 1170)
  ctx.stroke()
  ctx.fillStyle = '#3a3426'
  ctx.font = `600 30px ${SANS}`
  ctx.fillText(input.statLine, 110, 1225)
  ctx.fillStyle = '#9a917c'
  ctx.font = `500 26px ${SANS}`
  ctx.fillText('말씀 필사 · 손끝으로 새긴 말씀', 110, 1268)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** OS 공유(파일) → 안 되면 내려받기 */
export const shareOrDownload = async (blob: Blob, filename: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> => {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
