import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getReadingAids, subscribeReadingAids } from '../data/readingAids'
import { getMessiahHits, isMessiahReady, loadMessiah, type MessiahHit } from '../data/messiah'

/**
 * 이 절에 달린 약속과 성취(구약 약속·신약 성취). 읽기 도움 '약속과 성취'를 켰을 때만.
 * 병합 절(신 6:18-19)은 묶음 안 모든 절을 합친다. 데이터는 처음 한 번만 받는다 — 그 전엔 빈 배열.
 */
export const useMessiahHits = (
  bookNumber: number | undefined,
  chapter: number | undefined,
  verses: readonly number[],
): MessiahHit[] => {
  const enabled = useSyncExternalStore(subscribeReadingAids, getReadingAids).messiah
  const [ready, setReady] = useState(isMessiahReady)

  useEffect(() => {
    if (ready || !enabled) return
    let alive = true
    loadMessiah().then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [ready, enabled])

  const verseKey = verses.join(',')
  return useMemo(() => {
    if (!enabled || !ready || !bookNumber || !chapter) return []
    const seen = new Set<string>()
    return verseKey
      .split(',')
      .flatMap((v) => getMessiahHits(bookNumber, chapter, Number(v)))
      .filter((h) => (seen.has(h.promise.id) ? false : (seen.add(h.promise.id), true)))
  }, [enabled, ready, bookNumber, chapter, verseKey])
}
