import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getReadingAids, subscribeReadingAids } from '../data/readingAids'
import { getCrossLinks, isCrossRefsReady, loadCrossRefs, type CrossLink } from '../data/crossRefs'

/**
 * 이 절에 달린 연결 구절(구약 인용·신약의 인용·평행 본문).
 * 병합 절(신 6:18-19)은 묶음 안 모든 절의 연결을 합친다.
 * 데이터는 처음 한 번만 받는다 — 그 전엔 빈 배열(칩 없음).
 */
export const useCrossLinks = (
  bookNumber: number | undefined,
  chapter: number | undefined,
  verses: readonly number[],
): CrossLink[] => {
  const enabled = useSyncExternalStore(subscribeReadingAids, getReadingAids).crossRefs
  const [ready, setReady] = useState(isCrossRefsReady)

  useEffect(() => {
    if (ready || !enabled) return
    let alive = true
    loadCrossRefs().then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [ready, enabled])

  const verseKey = verses.join(',')
  return useMemo(() => {
    if (!enabled || !ready || !bookNumber || !chapter) return []
    return verseKey.split(',').flatMap((v) => getCrossLinks(bookNumber, chapter, Number(v)))
  }, [enabled, ready, bookNumber, chapter, verseKey])
}
