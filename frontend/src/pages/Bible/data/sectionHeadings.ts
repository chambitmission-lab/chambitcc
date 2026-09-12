// 단락 소제목 — 본문 중간에 끼어드는 "태초의 창조 1-2절" 같은 개요 제목을 보일지 말지.
//
// 흐름을 잡아 주는 이정표지만, 성경 원문에는 없는 편집자의 말이라 방해로 느끼는 성도도 있다.
// 끄면 본문 안의 소제목만 사라지고 단락 나누기(이어읽기 문단)와 PC 레일의 "이 장의 흐름"은 그대로다.
// 저장·전파 방식은 readerLayout / presenceSharing 과 같다 — 끄는 즉시 열린 본문에 반영.

const STORAGE_KEY = 'bible-section-headings'
let cache: boolean | null = null
const listeners = new Set<() => void>()

export const isSectionHeadingsEnabled = (): boolean => {
  if (cache === null) {
    try {
      cache = localStorage.getItem(STORAGE_KEY) !== 'off'
    } catch {
      cache = true
    }
  }
  return cache
}

export const setSectionHeadingsEnabled = (value: boolean) => {
  cache = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
  listeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 */
export const subscribeSectionHeadings = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
