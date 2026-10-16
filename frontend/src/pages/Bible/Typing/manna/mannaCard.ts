// 만나 내리기 결과 카드 — 광야의 새벽 하늘에 오늘 간 노정·점수·새긴 말씀. 4:5(인스타 스토리·카톡)
// 그리는 글자로 fonts.load 를 먼저 기다린다(canvas 한글 웹폰트는 조각이 늦게 와 폴백이 섞인다)

const W = 1080
const H = 1350
const SERIF = '"Noto Serif KR", "Apple SD Gothic Neo", serif'
const SANS = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", sans-serif'

export interface MannaCardInput {
  eyebrow: string
  place: string
  score: number
  statLine: string
  refs: string[]
  rankLine: string | null
}

export const renderMannaCard = async (input: MannaCardInput): Promise<Blob | null> => {
  const sample = `${input.eyebrow}${input.place}${input.statLine}${input.refs.join('')}${input.rankLine ?? ''}만나내리기점0123456789,까지왔어요광야`
  try {
    await Promise.all([
      document.fonts.load(`700 120px ${SERIF}`, sample),
      document.fonts.load(`600 34px ${SANS}`, sample),
    ])
  } catch {
    /* 시스템 폰트 폴백 */
  }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // 새벽 하늘 → 모래 언덕
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#26305e')
  sky.addColorStop(0.55, '#8a6a92')
  sky.addColorStop(0.82, '#f0b98a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  // 떨어지는 만나 몇 알
  const flakes: [number, number, number][] = [[150, 210, 18], [880, 160, 14], [760, 420, 10], [260, 520, 12], [940, 640, 16]]
  for (const [x, y, r] of flakes) {
    const g = ctx.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, 'rgba(255,249,234,0.55)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#b07f4c'
  ctx.beginPath()
  ctx.moveTo(0, 1110)
  ctx.bezierCurveTo(250, 1040, 470, 1150, 720, 1090)
  ctx.bezierCurveTo(880, 1050, 1000, 1080, W, 1100)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()
  ctx.fillStyle = '#d9ae74'
  ctx.beginPath()
  ctx.moveTo(0, 1180)
  ctx.bezierCurveTo(300, 1120, 560, 1220, 820, 1160)
  ctx.bezierCurveTo(940, 1135, 1020, 1150, W, 1165)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#f3c96b'
  ctx.font = `600 34px ${SANS}`
  ctx.fillText(input.eyebrow, 100, 170)

  ctx.fillStyle = '#f7efe3'
  ctx.font = `700 120px ${SERIF}`
  ctx.fillText(input.place, 100, 330)
  ctx.font = `600 44px ${SANS}`
  ctx.fillStyle = 'rgba(247,239,227,0.85)'
  ctx.fillText('까지 왔어요', 104, 400)

  const scoreText = input.score.toLocaleString('ko-KR')
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 150px ${SANS}`
  ctx.fillText(scoreText, 96, 600)
  const scoreW = ctx.measureText(scoreText).width
  ctx.font = `600 40px ${SANS}`
  ctx.fillStyle = '#f3c96b'
  ctx.fillText('점', 96 + scoreW + 14, 600)

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `600 34px ${SANS}`
  ctx.fillText(input.statLine, 100, 680)
  if (input.rankLine) {
    ctx.fillStyle = '#f3c96b'
    ctx.fillText(input.rankLine, 100, 732)
  }

  // 새긴 말씀 칩
  ctx.font = `600 30px ${SANS}`
  let x = 100
  let y = 830
  for (const ref of input.refs.slice(0, 8)) {
    const w = ctx.measureText(ref).width + 40
    if (x + w > W - 100) {
      x = 100
      y += 62
    }
    ctx.fillStyle = 'rgba(255,249,234,0.9)'
    ctx.beginPath()
    ctx.roundRect(x, y - 38, w, 52, 26)
    ctx.fill()
    ctx.fillStyle = '#3a2a1c'
    ctx.fillText(ref, x + 20, y - 2)
    x += w + 12
  }

  ctx.fillStyle = '#4a3220'
  ctx.font = `600 30px ${SANS}`
  ctx.fillText('만나 내리기 · 하늘에서 내린 말씀을 거두다', 100, 1280)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
