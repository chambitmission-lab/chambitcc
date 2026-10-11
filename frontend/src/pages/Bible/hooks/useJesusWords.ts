import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getReadingAids, subscribeReadingAids } from '../data/readingAids'
import {
  getChapterJesusWords,
  hasJesusWords,
  isJesusWordsReady,
  loadJesusWords,
  wordRangesToText,
} from '../data/jesusWords'
import type { TextRange } from '../components/verse/verseTextSegments'

const NONE: TextRange[] = []

/**
 * 장 단위 — (절 번호, 본문) → 예수님 말씀인 글자 구간을 돌려주는 함수.
 * 한 화면에 여러 절을 그리는 집중 읽기처럼 절마다 훅을 부를 수 없는 곳에서 쓴다.
 * - 복음서·사도행전·요한계시록만 데이터가 있다 (그 외 책은 내려받지도 않는다).
 * - 책 데이터는 코드 분할이라 처음 한 번만 받는다 — 그 전엔 빈 배열(색 없음).
 * - 절 전체가 말씀이면 [{0, text.length}] 하나.
 * - 읽기 설정(Aa)의 "예수님 말씀 색"을 끄면 언제나 빈 배열.
 */
export const useChapterJesusWords = (
  bookNumber: number | undefined,
  chapter: number | undefined,
): ((verseNumber: number, text: string | undefined) => TextRange[]) => {
  const enabled = useSyncExternalStore(subscribeReadingAids, getReadingAids).jesusWords
  const applies = !!bookNumber && hasJesusWords(bookNumber)
  const [ready, setReady] = useState(() => !applies || isJesusWordsReady(bookNumber!))

  useEffect(() => {
    if (!applies || !enabled || ready) return
    let alive = true
    loadJesusWords(bookNumber!).then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [applies, enabled, ready, bookNumber])

  return useCallback(
    (verseNumber: number, text: string | undefined) => {
      if (!enabled || !applies || !ready || !chapter || !text) return NONE
      const entry = getChapterJesusWords(bookNumber!, chapter)?.get(verseNumber)
      if (!entry) return NONE
      if (entry === 'all') return [{ start: 0, end: text.length }]
      return wordRangesToText(text, entry)
    },
    [enabled, applies, ready, bookNumber, chapter],
  )
}

/** 이 절에서 예수님 말씀인 글자 구간 (절 하나만 그리는 곳용) */
export const useJesusWords = (
  bookNumber: number | undefined,
  chapter: number | undefined,
  verseNumber: number,
  text: string | undefined,
): TextRange[] => {
  const rangesOf = useChapterJesusWords(bookNumber, chapter)
  return useMemo(() => rangesOf(verseNumber, text), [rangesOf, verseNumber, text])
}
