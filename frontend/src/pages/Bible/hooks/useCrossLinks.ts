import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getReadingAids, subscribeReadingAids } from '../data/readingAids'
import { getCrossLinks, isCrossRefsReady, loadCrossRefs, subscribeCrossRefs, type CrossLink } from '../data/crossRefs'

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
  // 준비 여부는 모듈 스토어 하나를 함께 본다 — 절마다 상태를 복제하지 않고, 받아지면 한 번에 깨어난다
  const ready = useSyncExternalStore(subscribeCrossRefs, isCrossRefsReady)

  useEffect(() => {
    if (enabled && !ready) void loadCrossRefs()
  }, [ready, enabled])

  const verseKey = verses.join(',')
  return useMemo(() => {
    if (!enabled || !ready || !bookNumber || !chapter) return []
    return verseKey.split(',').flatMap((v) => getCrossLinks(bookNumber, chapter, Number(v)))
  }, [enabled, ready, bookNumber, chapter, verseKey])
}
