// 열쇠말 "본문에서 밝혀 보기" — 지금 밝히고 있는 말 하나를 전역으로 들고 있는 작은 저장소.
// 길잡이 카드(켜기)·절 본문(칠하기)·하단 알약(끄기)이 서로 다른 트리에 있어 컨텍스트 대신 구독으로 잇는다.
// 책·장을 함께 담아, 다른 장에선 자연히 칠하지 않는다. 기기에 저장하지 않는다(세션 한정).
import type { ChapterKeyword } from './chapterKeywords'

export interface ActiveKeyword {
  book: number
  chapter: number
  keyword: ChapterKeyword
}

let active: ActiveKeyword | null = null
const listeners = new Set<() => void>()

export const getActiveKeyword = () => active

export const setActiveKeyword = (next: ActiveKeyword | null) => {
  if (active === next) return
  active = next
  listeners.forEach((fn) => fn())
}

export const subscribeActiveKeyword = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
