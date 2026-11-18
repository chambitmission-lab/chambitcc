// 카카오톡 말씀 엽서 — 완성된 카드를 인화지 한 장으로 종이 위에 올리고 날짜 소인과 손글씨 한 줄을 곁들인다.
// 카톡 피드 카드의 그림 자리는 정사각이 가장 안전해서(긴 카드는 위아래가 잘린다) 어떤 비율의 카드든
// 이 판 안에 온전히 넣는다. 나누기 버튼의 엽서·소인, 목양칼럼 엽서와 같은 세계.

import { FONT_STACKS, setTracking } from './cardStyle'
import { wrapGreedy } from './text'

export const POSTCARD_SIZE = 800

const PAPER = '#f6f1e7'
const INK = '#3a3128'
const STAMP = '#b5452f'
const CHURCH: Record<'ko' | 'en', string> = { ko: '참빛교회', en: 'CHAMBIT' }

export interface PostcardOptions {
  /** 인화지 아래 손글씨 출처 — 카드가 이미 폴라로이드 프레임이면 생략한다 */
  refLabel: string
  /** 오른쪽 손글씨 한마디 */
  note: string
  /** 보내는 사람 서명("참빛 드림") — 없으면 생략 */
  signature?: string
  /** 소인 날짜 */
  date: Date
  lang: 'ko' | 'en'
  /** 카드에 이미 흰 여백(폴라로이드)이 있으면 인화지 테두리를 겹치지 않는다 */
  hasOwnMat?: boolean
}

const drawSeal = (ctx: CanvasRenderingContext2D, S: number, date: Date, lang: 'ko' | 'en') => {
  const r = S * 0.118
  ctx.save()
  ctx.translate(S * 0.775, S * 0.2)
  ctx.rotate((11 * Math.PI) / 180)
  ctx.globalAlpha = 0.86
  ctx.strokeStyle = STAMP
  ctx.fillStyle = STAMP
  ctx.lineWidth = S * 0.007
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = S * 0.003
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.87, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 ${S * 0.056}px ${FONT_STACKS.serif}`
  ctx.fillText(`${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`, 0, S * 0.006)
  ctx.font = `600 ${S * 0.027}px ${FONT_STACKS.serif}`
  setTracking(ctx, S * 0.004)
  ctx.fillText(CHURCH[lang], S * 0.002, S * 0.05)
  setTracking(ctx, 0)
  ctx.restore()
}

const drawNote = (ctx: CanvasRenderingContext2D, S: number, note: string, signature?: string) => {
  const left = S * 0.585
  const right = S * 0.925
  const width = right - left
  ctx.save()
  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'
  // 세 줄 안에 들도록 글자를 줄여 본다
  let size = S * 0.082
  let lines: string[] = []
  for (let i = 0; i < 6; i++) {
    ctx.font = `400 ${size}px ${FONT_STACKS.hand}`
    lines = wrapGreedy(ctx, note.trim(), width)
    if (lines.length <= 3) break
    size *= 0.9
  }
  lines = lines.slice(0, 3)
  const gap = S * 0.105
  const lastBase = S * 0.765
  // 괘선은 글이 짧아도 두 줄은 긋는다 — 엽서의 받는 사람 칸처럼 보이게
  const ruled = Math.max(2, lines.length)
  ctx.strokeStyle = 'rgba(58, 49, 40, 0.28)'
  ctx.lineWidth = Math.max(1, S * 0.0015)
  for (let i = 0; i < ruled; i++) {
    const y = lastBase - (ruled - 1 - i) * gap + S * 0.02
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()
  }
  ctx.textAlign = 'left'
  lines.forEach((line, i) => {
    ctx.fillText(line, left + S * 0.006, lastBase - (ruled - 1 - i) * gap)
  })
  if (signature) {
    ctx.globalAlpha = 0.75
    ctx.textAlign = 'right'
    ctx.font = `400 ${S * 0.062}px ${FONT_STACKS.hand}`
    ctx.fillText(signature, right, S * 0.875)
  }
  ctx.restore()
}

/** 완성된 카드 캔버스를 받아 정사각 엽서를 target 에 그린다 (target 크기는 여기서 맞춘다) */
export const drawKakaoPostcard = (target: HTMLCanvasElement, card: HTMLCanvasElement, opts: PostcardOptions) => {
  const S = POSTCARD_SIZE
  target.width = S
  target.height = S
  const ctx = target.getContext('2d')
  if (!ctx) return

  // 종이 — 가장자리가 살짝 가라앉은 미색
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, S, S)
  const shade = ctx.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.75)
  shade.addColorStop(0, 'rgba(120, 96, 60, 0)')
  shade.addColorStop(1, 'rgba(120, 96, 60, 0.09)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(58, 49, 40, 0.22)'
  ctx.lineWidth = 1
  ctx.strokeRect(S * 0.04 + 0.5, S * 0.04 + 0.5, S * 0.92 - 1, S * 0.92 - 1)

  // 인화지 — 카드 비율 그대로 왼쪽 칸 안에 맞춘다
  const mat = opts.hasOwnMat ? 0 : S * 0.02
  const caption = opts.hasOwnMat ? 0 : S * 0.085
  const maxW = S * 0.47
  const maxH = S * 0.76
  const scale = Math.min((maxW - mat * 2) / card.width, (maxH - mat - Math.max(mat, caption)) / card.height)
  const cw = card.width * scale
  const ch = card.height * scale
  const pw = cw + mat * 2
  const ph = ch + mat + Math.max(mat, caption)
  ctx.save()
  ctx.translate(S * 0.32, S * 0.5)
  ctx.rotate((-4 * Math.PI) / 180)
  ctx.shadowColor = 'rgba(60, 40, 20, 0.28)'
  ctx.shadowBlur = S * 0.04
  ctx.shadowOffsetY = S * 0.014
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph)
  ctx.shadowColor = 'transparent'
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(card, -pw / 2 + mat, -ph / 2 + mat, cw, ch)
  if (caption) {
    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let size = S * 0.058
    ctx.font = `400 ${size}px ${FONT_STACKS.hand}`
    const w = ctx.measureText(opts.refLabel).width
    if (w > cw * 0.94) {
      size *= (cw * 0.94) / w
      ctx.font = `400 ${size}px ${FONT_STACKS.hand}`
    }
    ctx.fillText(opts.refLabel, 0, -ph / 2 + mat + ch + caption / 2)
  }
  ctx.restore()

  drawSeal(ctx, S, opts.date, opts.lang)
  if (opts.note.trim()) drawNote(ctx, S, opts.note, opts.signature)
}
