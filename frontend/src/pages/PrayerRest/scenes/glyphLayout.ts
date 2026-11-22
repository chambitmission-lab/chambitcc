// 장면 캔버스 공용 도구
/** 캔버스를 화면 크기·DPR 에 맞춘다 */
export const fitCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, maxDpr = 2) => {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { w, h, dpr }
}

export interface WrappedLine {
  text: string
  /** 이 줄 앞에 두는 문단 간격 (줄 높이 배수) — 빈 줄로 나눈 문단 첫 줄만 0 보다 크다 */
  gap: number
}

/** 빈 줄로 나눈 문단 사이 간격 (줄 높이 배수) */
export const PARAGRAPH_GAP = 0.7

/**
 * 유리에 쓸 기도를 줄로 나눈다.
 * - 엔터 한 번 = 줄바꿈, 빈 줄(여러 개여도 하나로) = 문단 간격
 * - 낱말 단위로 넘긴다 ("버겁습니|다" 처럼 낱말 가운데서 끊지 않는다, CSS keep-all 과 같은 결)
 * - 한 낱말이 폭보다 길 때만 글자 단위로 자른다
 */
export const wrapPrayerText = (text: string, width: (s: string) => number, maxW: number): WrappedLine[] => {
  const out: WrappedLine[] = []
  let pendingGap = 0
  const push = (s: string) => {
    out.push({ text: s, gap: out.length ? pendingGap : 0 })
    pendingGap = 0
  }
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const para = raw.trim()
    if (!para) {
      pendingGap = PARAGRAPH_GAP
      continue
    }
    let cur = ''
    for (const word of para.split(/\s+/)) {
      const cand = cur ? `${cur} ${word}` : word
      if (width(cand) <= maxW) {
        cur = cand
        continue
      }
      if (cur) push(cur)
      cur = ''
      if (width(word) <= maxW) {
        cur = word
        continue
      }
      for (const ch of Array.from(word)) {
        if (cur && width(cur + ch) > maxW) {
          push(cur)
          cur = ch
        } else cur += ch
      }
    }
    if (cur) push(cur)
  }
  return out
}
