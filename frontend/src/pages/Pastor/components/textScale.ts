// 목회자 화면 글씨 크기 — PC(lg+)에서 안경을 벗지 않고도 읽히도록.
// 화면 전체를 CSS zoom 으로 키운다(common.css `.pastor-scale`). 개별 px 크기를 일일이 바꾸지 않아도
// 카드·버튼·여백이 같은 비율로 커진다. 모바일은 이미 눈 가까이 보므로 적용하지 않는다.
// 선택은 이 기기에만 기억한다(개인 편의) — 처음엔 '크게'로 시작한다.
import { useSyncExternalStore } from 'react'

export type PastorTextScale = 'base' | 'large' | 'xlarge'

const KEY = 'pastor-text-scale'
const DEFAULT: PastorTextScale = 'large'
const listeners = new Set<() => void>()

const read = (): PastorTextScale => {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'base' || v === 'large' || v === 'xlarge') return v
  } catch {
    /* 저장소를 못 쓰는 환경 — 기본값 */
  }
  return DEFAULT
}

let current = read()

export const setPastorTextScale = (next: PastorTextScale) => {
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

export const usePastorTextScale = (): PastorTextScale => useSyncExternalStore(subscribe, () => current)

/** zoom 을 걸 뿌리 요소에 펼쳐 넣는다 — `<div {...pastorScaleProps(scale)}>` */
export const pastorScaleProps = (scale: PastorTextScale) => ({
  'data-pastor-scale': scale,
})
