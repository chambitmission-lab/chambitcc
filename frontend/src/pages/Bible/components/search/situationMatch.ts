// 마음으로 찾기 — 검색어에 맞는 상황별 성구 카테고리 고르기.
// AI 를 쓰지 않는다: 카테고리 이름·키워드(기도 매칭에 쓰는 것과 같은 값)로만 고른다.

import type { SituationCategory } from '../../../../types/situation'

const norm = (s: string) => s.replace(/\s/g, '')

export interface SituationMatch {
  category: SituationCategory
  /** 문장처럼 적은 질문 — 답변을 크게, 낱말 하나면 작게 */
  sentence: boolean
}

/** 검색어에 맞는 상황 — 이름이 같으면 그것, 아니면 키워드가 가장 많이 걸린 것(같으면 관리자 정렬 순) */
export const matchSituation = (categories: SituationCategory[], query: string): SituationMatch | null => {
  const raw = query.trim()
  const q = norm(raw)
  if (q.length < 2 || /\d/.test(q)) return null
  const active = categories.filter(c => c.is_active && c.verse_count > 0)
  const sentence = /\s/.test(raw) || (q.length >= 3 && /(요|다|때|까|네|어|죠|음|서)$/.test(q))
  const byName = active.find(c => norm(c.name) === q)
  if (byName) return { category: byName, sentence: true }
  let best: SituationCategory | null = null
  let bestHits = 0
  for (const c of active) {
    const hits = (c.keywords ?? []).filter(kw => kw && q.includes(norm(kw))).length
    if (hits > bestHits || (hits === bestHits && hits > 0 && best && c.order < best.order)) {
      best = c
      bestHits = hits
    }
  }
  return best ? { category: best, sentence } : null
}

