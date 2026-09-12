// 캔버스 줄바꿈과 둥근 사각형 — 타이포 레이아웃이 공유하는 기본 조판/도형 도구.

// ── 줄바꿈 ─────────────────────────────────────────────────────
// Canvas는 자동 줄바꿈이 없어 직접 계산한다.
// 공백 단위로 채우다가 넘치면 줄을 나누고, 한 단어가 한 줄보다 길면 글자 단위로 자른다.
const wrapGreedy = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const tryLine = line ? `${line} ${word}` : word
    if (ctx.measureText(tryLine).width <= maxWidth) {
      line = tryLine
      continue
    }
    if (line) {
      lines.push(line)
      line = ''
    }
    if (ctx.measureText(word).width <= maxWidth) {
      line = word
      continue
    }
    let chunk = ''
    for (const ch of word) {
      if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
        lines.push(chunk)
        chunk = ch
      } else {
        chunk += ch
      }
    }
    line = chunk
  }
  if (line) lines.push(line)
  return lines
}

/**
 * 균형 줄바꿈 — 줄 수는 그대로 두고 각 줄의 길이를 고르게 만든다.
 * "…하리라 / 참으로" 같은 마지막 줄 고아 단어가 사라져 시(詩)처럼 읽힌다.
 */
const wrapVerseText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const greedy = wrapGreedy(ctx, text, maxWidth)
  if (greedy.length < 2) return greedy
  const target = greedy.length
  let lo = maxWidth * 0.45
  let hi = maxWidth
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2
    if (wrapGreedy(ctx, text, mid).length <= target) hi = mid
    else lo = mid
  }
  const balanced = wrapGreedy(ctx, text, hi)
  return balanced.length === target ? balanced : greedy
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}


// ── photoVerseCanvas 내부 공유 ──
export { wrapGreedy, wrapVerseText, roundRect }
