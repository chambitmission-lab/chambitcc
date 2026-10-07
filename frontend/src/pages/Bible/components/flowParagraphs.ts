// 절 목록을 단락으로 묶는다 — 장 개요(단락 소제목) 범위대로. 이어읽기·절별 보기가 같이 쓴다.
import type { BibleVerse } from '../../../types/bible'
import type { OutlineSection } from '../data/chapterOutlines'

/** 본문 단락 하나 */
export interface FlowParagraph {
  key: string
  title: string | null
  /** 개요 단락의 절 범위 — 절별 보기 소제목 옆에 '1-2절'로 붙인다 */
  range: [number, number] | null
  verses: BibleVerse[]
}

/** 개요가 없는 장에서 한 문단에 넣을 최대 절 수 — 176절짜리 벽이 되지 않게 */
export const FLOW_FALLBACK_CHUNK = 10

/**
 * - 개요 단락이 있으면 그 범위대로(소제목 포함). 어느 단락에도 안 들어가는 절은 제목 없이 이어 묶는다.
 * - 개요가 없으면 fallbackChunk 절씩 제목 없이 끊는다. 0 이면 끊지 않고 한 덩어리
 *   (절별 보기 — 절 카드가 이미 구분선이다).
 * 페이지네이션으로 절이 뒤늦게 붙어도 번호 기준이라 같은 단락으로 자연히 들어간다.
 */
export const buildFlowParagraphs = (
  verses: BibleVerse[],
  sections: OutlineSection[],
  fallbackChunk = FLOW_FALLBACK_CHUNK,
): FlowParagraph[] => {
  const out: FlowParagraph[] = []
  if (!verses.length) return out
  if (!sections.length) {
    if (!fallbackChunk) return [{ key: 'all', title: null, range: null, verses }]
    for (let i = 0; i < verses.length; i += fallbackChunk) {
      const chunk = verses.slice(i, i + fallbackChunk)
      out.push({ key: `c-${chunk[0].verse}`, title: null, range: null, verses: chunk })
    }
    return out
  }
  let current: FlowParagraph | null = null
  let currentSection: OutlineSection | null | undefined
  for (const v of verses) {
    const sec = sections.find((s) => v.verse >= s.v[0] && v.verse <= s.v[1]) ?? null
    if (!current || sec !== currentSection) {
      current = {
        key: sec ? `s-${sec.v[0]}` : `g-${v.verse}`,
        title: sec?.title ?? null,
        range: sec ? [sec.v[0], sec.v[1]] : null,
        verses: [],
      }
      currentSection = sec
      out.push(current)
    }
    current.verses.push(v)
  }
  return out
}
