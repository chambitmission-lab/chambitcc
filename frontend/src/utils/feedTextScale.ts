// 기도 피드·상세 글씨 크기 — PC(lg+)에서 노안인 성도도 안경 없이 읽히도록.
// 목회자 화면(pages/Pastor/components/textScale.ts)과 달리 zoom 을 쓰지 않는다 — 홈은 3컬럼이라
// 카드 폭까지 커지면 레이아웃이 깨진다. 대신 피드 뿌리·상세 모달에 data-feed-scale 을 달고, 그 안의 lg 글씨가
// calc(Npx * var(--fs)) 로 이 배율을 따라간다(common.css `[data-feed-scale]`). 모바일은 적용하지 않는다.
// 선택은 이 기기에만 기억한다(개인 편의).
import { useSyncExternalStore } from 'react'

export type FeedTextScale = 'base' | 'large' | 'xlarge'

export const FEED_TEXT_SCALES: FeedTextScale[] = ['base', 'large', 'xlarge']

const KEY = 'feed-text-scale'
const DEFAULT: FeedTextScale = 'base'
const listeners = new Set<() => void>()

const read = (): FeedTextScale => {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'base' || v === 'large' || v === 'xlarge') return v
  } catch {
    /* 저장소를 못 쓰는 환경 — 기본값 */
  }
  return DEFAULT
}

let current = read()

export const setFeedTextScale = (next: FeedTextScale) => {
  current = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* 기억만 못 할 뿐 화면은 바뀐다 */
  }
  listeners.forEach(l => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export const useFeedTextScale = (): FeedTextScale => useSyncExternalStore(subscribe, () => current)
