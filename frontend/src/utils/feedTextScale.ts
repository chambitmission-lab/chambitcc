// PC 글씨 크기 — 앱 전역 한 설정. PC(lg+)에서 노안인 성도도 안경 없이 읽히도록. 모바일은 적용하지 않는다.
// 처음엔 기도 피드 전용이었지만 헤더 '가' 버튼(HeaderTextScale)으로 앱 전역에 올렸다. 저장 키는
// 이미 고른 분들의 선택을 잇기 위해 그대로 둔다. 적용 방식은 화면마다 다르다:
// - 기도 피드·상세(홈): zoom 을 쓰지 않는다 — 홈은 3컬럼이라 카드 폭까지 커지면 레이아웃이 깨진다.
//   피드 뿌리·상세 모달에 data-feed-scale 을 달고, 그 안의 lg 글씨가 calc(Npx * var(--fs)) 로 따라간다.
// - 참비 챗봇: 패널 자체 배율.
// - 그 밖의 읽기·참여 화면(utils/textScaleRoutes.ts 목록): <main data-app-scale> 로 페이지 전체를
//   zoom 한다(common.css `[data-app-scale]`). 목회자 화면(.pastor-scale)과 같은 방식.
// 배율 숫자의 출처는 <html data-text-scale> 하나다 — common.css 가 여기서 --pc-zoom(1.15/1.3)·
// --text-mul(1.1/1.2)을 정의하고, 헤더·레일·메가 메뉴·body 포털 시트는 React 구독 없이 그 변수만
// 읽는다(전엔 컴포넌트 7곳이 각자 구독해 data-scale 을 찍고 CSS 상수를 8곳에 복제했다).
// index.html 인라인 스크립트가 React 전에 같은 속성을 먼저 세워 첫 프레임 배율 플래시가 없다.
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

// <html data-text-scale> — CSS 의 유일한 배율 출처(common.css `html[data-text-scale]`). base 면 속성을 뗀다
const applyToDocument = (v: FeedTextScale) => {
  if (typeof document === 'undefined') return
  if (v === DEFAULT) delete document.documentElement.dataset.textScale
  else document.documentElement.dataset.textScale = v
}
applyToDocument(current)

export const setFeedTextScale = (next: FeedTextScale) => {
  current = next
  applyToDocument(next)
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
