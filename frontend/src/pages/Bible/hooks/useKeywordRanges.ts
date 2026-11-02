import { useMemo, useSyncExternalStore } from 'react'
import { getActiveKeyword, subscribeActiveKeyword } from '../data/keywordHighlight'
import type { TextRange } from '../components/verse/verseTextSegments'

const NONE: TextRange[] = []

/** text 안에서 needles 가 나오는 글자 구간 — 위치순, 겹치면 앞의 것만 */
export const findKeywordRanges = (text: string, needles: readonly string[]): TextRange[] => {
  const found: TextRange[] = []
  for (const n of needles) {
    if (!n) continue
    let i = text.indexOf(n)
    while (i !== -1) {
      found.push({ start: i, end: i + n.length })
      i = text.indexOf(n, i + n.length)
    }
  }
  if (found.length < 2) return found
  found.sort((a, b) => a.start - b.start)
  const out: TextRange[] = []
  for (const r of found) {
    const last = out[out.length - 1]
    if (last && r.start < last.end) continue
    out.push(r)
  }
  return out
}

/** 이 절에서 지금 밝히는 열쇠말 구간 — 다른 장이거나 꺼져 있으면 빈 배열 */
export const useKeywordRanges = (
  bookNumber: number | undefined,
  chapter: number | undefined,
  text: string | undefined,
): TextRange[] => {
  const active = useSyncExternalStore(subscribeActiveKeyword, getActiveKeyword)
  const applies = !!active && !!text && active.book === bookNumber && active.chapter === chapter
  const match = applies ? active.keyword.match : null
  return useMemo(() => (match && text ? findKeywordRanges(text, match) : NONE), [match, text])
}
