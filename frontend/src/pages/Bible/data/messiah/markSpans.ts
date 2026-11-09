/** 본문 안의 [start, end) 글자 구간 */
export interface Span {
  start: number
  end: number
}

/**
 * text 에서 marks 가 나오는 자리 전부 — 구간마다 덧붙일 정보는 make 로 만든다.
 * (데이터 검증 스크립트가 marks 가 본문에 있는지 확인하므로, 여기선 없으면 그냥 지나간다)
 */
export const findMarkSpans = <T extends Span>(
  text: string,
  marks: readonly string[],
  make: (start: number, end: number) => T,
): T[] => {
  const spans: T[] = []
  for (const m of marks) {
    if (!m) continue
    for (let i = text.indexOf(m); i !== -1; i = text.indexOf(m, i + m.length)) spans.push(make(i, i + m.length))
  }
  return spans
}

/** 시작 위치로 정렬하고 겹치거나 맞닿은 구간을 하나로 합친다(앞 구간의 정보가 남는다). 입력은 바꾸지 않는다 */
export const mergeSpans = <T extends Span>(spans: readonly T[]): T[] => {
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const merged: T[] = []
  for (const sp of sorted) {
    const last = merged[merged.length - 1]
    if (last && sp.start <= last.end) last.end = Math.max(last.end, sp.end)
    else merged.push({ ...sp })
  }
  return merged
}
