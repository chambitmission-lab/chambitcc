import { useEffect, useState } from 'react'
import type { SearchIndex } from './searchIndex'

// 색인은 앱 전체에서 한 번만 짓는다 — 검색 탭을 나갔다 와도 다시 받지 않는다
let cached: SearchIndex | null = null
let pending: Promise<SearchIndex> | null = null

const load = (): Promise<SearchIndex> => {
  if (cached) return Promise.resolve(cached)
  if (!pending) {
    pending = import('./searchIndex')
      .then((m) => m.buildSearchIndex())
      .then((idx) => (cached = idx))
      .catch((err) => {
        pending = null // 네트워크 실패면 다음 검색에서 다시 시도
        throw err
      })
  }
  return pending
}

/** 사건·지명 로컬 색인 — enabled 가 처음 true 가 될 때 내려받는다. 준비 전엔 null */
export const useSearchIndex = (enabled: boolean): SearchIndex | null => {
  const [index, setIndex] = useState<SearchIndex | null>(cached)
  useEffect(() => {
    if (index || !enabled) return
    let alive = true
    load()
      .then((idx) => { if (alive) setIndex(idx) })
      .catch(() => {})
    return () => { alive = false }
  }, [enabled, index])
  return index
}
