import type { ReactNode } from 'react'

/* 본문 글에서 줄바꿈되면 안 되는 토큰을 한 덩어리로 묶는다.
 * 계좌번호 "301-0252-3534-41"·전화번호 "010-1234-5678"은 하이픈이 줄바꿈 자리라
 * 줄 끝에서 "301-0252-" / "3534-41"처럼 두 줄로 갈라진다. 이런 숫자 묶음은 nowrap 으로 감싼다. */

// 숫자 묶음이 하이픈으로 두 번 이상 이어진 것 — 계좌·전화·사업자번호
const DIGIT_GROUP_RE = /\d[\d-]*-[\d-]*-\d/g

export const renderKeepTogether = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(DIGIT_GROUP_RE)) {
    const start = m.index ?? 0
    if (start > last) nodes.push(text.slice(last, start))
    nodes.push(
      <span key={start} className="whitespace-nowrap">
        {m[0]}
      </span>,
    )
    last = start + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
