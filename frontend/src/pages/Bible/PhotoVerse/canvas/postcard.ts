// 카카오톡 말씀 카드 — 사용자가 만든 카드가 주인공이다. 꾸밈 없이 카드를 반듯하게 크게 놓고,
// 남는 자리는 카드 자기 색을 흐리게 번져 채운다(인스타 스토리 공유 방식). 보낸 사람의 한마디는
// 그림이 아니라 카톡 카드 제목(굵은 글씨)으로 간다 — KakaoPostcardSheet.
// 카톡 피드 카드의 그림 자리는 정사각이 가장 안전해서(긴 그림은 위아래가 잘린다) 어떤 비율의 카드든
// 이 판 안에 온전히 넣는다. 시안: /#/dev/kakao-postcard?v=p1

import { FONT_STACKS, setTracking } from './cardStyle'

export const POSTCARD_SIZE = 800

/** 판에서 카드가 차지하는 최대 비율(가로·세로 모두) */
const CARD_FILL = 0.9
const CARD_RADIUS = 18

export interface PostcardOptions {
  /** 카드 옆 작은 세로 꼬리표 — "From. 김집사 · 11.19". 없으면 날짜만 */
  sender?: string
  date: Date
  lang: 'ko' | 'en'
}

/** 카드 가운데 정사각을 아주 작게 줄였다가 판 전체로 키운다 — ctx.filter 가 없는 사파리에서도 같은 번짐 */
const drawBackdrop = (ctx: CanvasRenderingContext2D, S: number, card: HTMLCanvasElement) => {
  const side = Math.min(card.width, card.height)
  const tiny = document.createElement('canvas')
  tiny.width = 18
  tiny.height = 18
  const t = tiny.getContext('2d')
  if (t) {
    t.drawImage(card, (card.width - side) / 2, (card.height - side) / 2, side, side, 0, 0, 18, 18)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // 가장자리 번짐이 판 밖으로 나가게 조금 더 크게
    ctx.drawImage(tiny, -S * 0.05, -S * 0.05, S * 1.1, S * 1.1)
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.fillRect(0, 0, S, S)
}

const tagText = (opts: PostcardOptions) => {
  const d = `${opts.date.getMonth() + 1}.${opts.date.getDate()}`
  if (opts.sender) return `From. ${opts.sender} · ${d}`
  return `${opts.lang === 'ko' ? '참빛교회' : 'CHAMBIT'} · ${d}`
}

/** 완성된 카드 캔버스를 받아 정사각 카톡 그림을 target 에 그린다 (target 크기는 여기서 맞춘다) */
export const drawKakaoPostcard = (target: HTMLCanvasElement, card: HTMLCanvasElement, opts: PostcardOptions) => {
  const S = POSTCARD_SIZE
  target.width = S
  target.height = S
  const ctx = target.getContext('2d')
  if (!ctx) return

  drawBackdrop(ctx, S, card)

  const scale = Math.min((S * CARD_FILL) / card.width, (S * CARD_FILL) / card.height)
  const cw = card.width * scale
  const ch = card.height * scale
  const x = (S - cw) / 2
  const y = (S - ch) / 2

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = S * 0.05
  ctx.shadowOffsetY = S * 0.018
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(x, y, cw, ch, CARD_RADIUS)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, cw, ch, CARD_RADIUS)
  ctx.clip()
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(card, x, y, cw, ch)
  ctx.restore()

  // 꼬리표 — 카드 오른쪽 여백에 세로로. 정사각·가로 카드처럼 여백이 없으면 생략한다
  const gap = S - (x + cw)
  if (gap >= S * 0.06) {
    ctx.save()
    ctx.translate(x + cw + gap / 2 + S * 0.01, y + ch - S * 0.005)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 6
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${S * 0.025}px ${FONT_STACKS.sans}`
    setTracking(ctx, S * 0.001)
    ctx.fillText(tagText(opts), 0, 0)
    setTracking(ctx, 0)
    ctx.restore()
  }
}
