// 본문 보기 방식 — 읽기 설정(Aa)에서 고르고 기기별로 저장한다.
//  - list: 절마다 한 줄씩(번호 거터 + 본문). 묵상·기록 작업에 편하다.
//  - flow: 절을 문단으로 이어 붙이고 번호는 작게 위첨자로. 종이 성경처럼 쭉 읽는다.
// 저장·전파 방식은 인물·지명 사전 토글(bibleGlossary)과 같다 — 열린 본문에 즉시 반영.

export type ReaderLayout = 'list' | 'flow'

const STORAGE_KEY = 'bible-reader-layout'
let cache: ReaderLayout | null = null
const listeners = new Set<() => void>()

export const getReaderLayout = (): ReaderLayout => {
  if (cache === null) {
    try {
      cache = localStorage.getItem(STORAGE_KEY) === 'flow' ? 'flow' : 'list'
    } catch {
      cache = 'list'
    }
  }
  return cache
}

export const setReaderLayout = (value: ReaderLayout) => {
  cache = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
  listeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 */
export const subscribeReaderLayout = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
