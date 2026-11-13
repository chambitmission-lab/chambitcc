import { useEffect, useState } from 'react'
import { safeStorage } from '../../../utils/safeStorage'
import { loadBookBriefs, type LoadedBriefs } from '../data/chapterBriefs'
import { loadBookKeywords, type BookKeywords } from '../data/chapterKeywords'

const LAST_READ_KEY = 'bible-last-read-at'
const CATCH_UP_GAP_MS = 3 * 24 * 60 * 60 * 1000 // 3일 이상 쉬면 "지난 이야기"를 보여준다

// 오랜만 여부는 세션당 한 번만 판정한다 — 판정 직후 방문 시각을 갱신하므로,
// 같은 세션에서 장을 옮길 때마다 다시 나타나지 않는다.
let catchUpChecked = false
let catchUpNeeded = false
const checkCatchUp = (): boolean => {
  if (catchUpChecked) return catchUpNeeded
  catchUpChecked = true
  const prev = Number(safeStorage.get(LAST_READ_KEY))
  catchUpNeeded = prev > 0 && Date.now() - prev >= CATCH_UP_GAP_MS
  return catchUpNeeded
}

/**
 * 오늘의 길잡이(장별 3줄) + 열쇠말 + "오랜만이에요" 지난 이야기 — 장 머리말과 길잡이 시트가 같이 쓴다.
 * 데이터는 책별 청크라 비동기. 데이터 없는 책은 brief 가 null.
 */
export const useChapterBrief = (bookNumber: number, chapter: number, enabled: boolean) => {
  const [loadedFor, setLoadedFor] = useState<{ book: number; data: LoadedBriefs | null } | null>(null)
  const [keywordsFor, setKeywordsFor] = useState<{ book: number; data: BookKeywords | null } | null>(null)
  // 오랜만에 돌아온 사람에게만 지난 장 줄거리를 함께 보여준다 (마운트 시 1회 판정)
  const [showCatchUp] = useState(checkCatchUp)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadBookBriefs(bookNumber).then((data) => {
      if (alive) setLoadedFor({ book: bookNumber, data })
    })
    loadBookKeywords(bookNumber).then((data) => {
      if (alive) setKeywordsFor({ book: bookNumber, data })
    })
    return () => {
      alive = false
    }
  }, [bookNumber, enabled])

  // 읽기 화면에 온 것 자체를 방문 도장으로 기록 — 다음 방문의 공백 판정에 쓴다
  useEffect(() => {
    safeStorage.set(LAST_READ_KEY, String(Date.now()))
  }, [bookNumber, chapter])

  const pending = enabled && loadedFor?.book !== bookNumber
  const loaded = enabled && loadedFor?.book === bookNumber ? loadedFor.data : null
  const brief = loaded?.briefs[chapter] ?? null
  const keywords = enabled && keywordsFor?.book === bookNumber ? (keywordsFor.data?.[chapter] ?? []) : []

  // 지난 이야기 — 직전 두 장의 "이 장에서" 줄을 이어붙여 짧은 리캡으로.
  // 시편처럼 장이 독립된 책(비서사)에서는 의미가 없어 건너뛴다.
  const catchUpLines =
    loaded && showCatchUp && loaded.narrative && chapter > 1
      ? [chapter - 2, chapter - 1]
          .filter((c) => c >= 1 && loaded.briefs[c])
          .map((c) => ({ chapter: c, text: loaded.briefs[c].now }))
      : []

  return { pending, brief, labels: loaded?.labels ?? null, keywords, catchUpLines }
}
