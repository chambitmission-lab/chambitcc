import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getReadingAids, subscribeReadingAids } from '../data/readingAids'
import { getMessiahHits, isMessiahReady, loadMessiah, subscribeMessiah, type MessiahHit } from '../data/messiah'

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
  // 준비 여부는 모듈 스토어 하나를 함께 본다 — 절마다 상태를 복제하지 않고, 받아지면 한 번에 깨어난다
  const ready = useSyncExternalStore(subscribeMessiah, isMessiahReady)

  useEffect(() => {
    if (enabled && !ready) void loadMessiah()
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
