import type { ReactNode } from 'react'
import { canonicalBookName } from '../../../Sermon/utils/sermonMeta'
import { parseRef, type PassageRef } from '../../data/crossRefs'
import { findMarkSpans, mergeSpans } from '../../data/messiah/markSpans'

/** "이사야 7장 14절" · "시편 22편 1절" · "마태복음 1장 22-23절" — 초보자에겐 콜론(7:14)보다 읽기 쉽다 */
export const formatPromiseRef = (ref: string | PassageRef): string => {
  const r = typeof ref === 'string' ? parseRef(ref) : ref
  const unit = r.b === 19 ? '편' : '장'
  return `${canonicalBookName(r.b)} ${r.c}${unit} ${r.v}${r.to > r.v ? `-${r.to}` : ''}절`
}

/** 이 글자 수 이하 문구는 줄바꿈 없이 한 덩어리 (모바일 시트 폭에서도 한 줄에 넉넉히 들어가는 길이) */
const WHOLE_MAX = 12

/** 본문에서 marks 가 나오는 자리를 모두 <mark> 로 감싼다. 겹치는 구간은 하나로 합친다 (findMarkSpans·mergeSpans) */
export const paintMarks = (text: string, marks: readonly string[], className: string): ReactNode[] => {
  const merged = mergeSpans(findMarkSpans(text, marks, (start, end) => ({ start, end })))
  if (!merged.length) return [text]
  const out: ReactNode[] = []
  let at = 0
  merged.forEach(({ start: s, end: e }, i) => {
    if (s > at) out.push(text.slice(at, s))
    // 짧은 문구('곧 그리스도라')는 줄 끝에서 둘로 쪼개지지 않게 한 덩어리로 — 밑줄도 한 줄로 이어진다.
    // 긴 문구는 그대로 두어야 좁은 화면에서 넘치지 않는다.
    const whole = e - s <= WHOLE_MAX
    out.push(
      <mark key={i} className={whole ? `${className} promise-mark--whole` : className}>
        {text.slice(s, e)}
      </mark>,
    )
    at = e
  })
  if (at < text.length) out.push(text.slice(at))
  return out
}
