import type { ReactNode } from 'react'
import { canonicalBookName } from '../../../Sermon/utils/sermonMeta'
import { parseRef, type PassageRef } from '../../data/crossRefs'

/** "이사야 7장 14절" · "시편 22편 1절" · "마태복음 1장 22-23절" — 초보자에겐 콜론(7:14)보다 읽기 쉽다 */
export const formatPromiseRef = (ref: string | PassageRef): string => {
  const r = typeof ref === 'string' ? parseRef(ref) : ref
  const unit = r.b === 19 ? '편' : '장'
  return `${canonicalBookName(r.b)} ${r.c}${unit} ${r.v}${r.to > r.v ? `-${r.to}` : ''}절`
}

/**
 * 본문에서 marks 가 나오는 자리를 모두 <mark> 로 감싼다. 겹치는 구간은 하나로 합친다.
 * (데이터 검증 스크립트가 marks 가 본문에 있는지 확인하므로, 여기선 없으면 그냥 지나간다)
 */
export const paintMarks = (text: string, marks: readonly string[], className: string): ReactNode[] => {
  const spans: [number, number][] = []
  for (const m of marks) {
    if (!m) continue
    for (let i = text.indexOf(m); i !== -1; i = text.indexOf(m, i + m.length)) spans.push([i, i + m.length])
  }
  if (!spans.length) return [text]
  spans.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const s of spans) {
    const last = merged[merged.length - 1]
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1])
    else merged.push([...s])
  }
  const out: ReactNode[] = []
  let at = 0
  merged.forEach(([s, e], i) => {
    if (s > at) out.push(text.slice(at, s))
    out.push(
      <mark key={i} className={className}>
        {text.slice(s, e)}
      </mark>,
    )
    at = e
  })
  if (at < text.length) out.push(text.slice(at))
  return out
}
