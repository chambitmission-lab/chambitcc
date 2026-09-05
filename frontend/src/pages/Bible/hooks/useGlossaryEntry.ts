import { useEffect, useMemo, useState } from 'react'
import { findGlossaryEntry, isGlossaryReady, loadGlossary, type GlossaryEntry } from '../data/bibleGlossary'

/**
 * 검색어와 정확히 일치하는 성경 사전 항목 — 사전 청크는 처음 검색어가 생길 때 한 번만 내려받는다.
 * 검색 탭 정의 카드용. 항목이 없거나 아직 로딩 중이면 null.
 */
export const useGlossaryEntry = (term: string): GlossaryEntry | null => {
  const [ready, setReady] = useState(isGlossaryReady)
  const q = term.trim()
  useEffect(() => {
    if (ready || !q) return
    let alive = true
    loadGlossary()
      .then(() => { if (alive) setReady(true) })
      .catch(() => {})
    return () => { alive = false }
  }, [ready, q])
  return useMemo(() => {
    if (!ready || !q || q.length > 12 || /\d/.test(q)) return null
    return findGlossaryEntry(q)
  }, [ready, q])
}
