// 읽기 도움 — 본문을 "이해"하도록 돕는 세 가지 장치를 각각 켤지 말지. 읽기 설정(Aa)에서 고르고 기기별로 저장한다.
//  - paraphrase: 단락마다 접혀 있는 "쉽게 풀면" (data/paraphrase)
//  - jesusWords: 복음서 등에서 예수님이 하신 말씀을 다른 색으로 (data/jesusWords)
//  - crossRefs: 신약의 구약 인용·복음서 평행 본문 칩 (data/crossRefs)
// 저장·전파 방식은 readerIntroCards 와 같다 — 바꾸는 즉시 열린 본문에 반영.

export interface ReadingAids {
  paraphrase: boolean
  jesusWords: boolean
  crossRefs: boolean
}

const STORAGE_KEY = 'bible-reading-aids'
const DEFAULTS: ReadingAids = { paraphrase: true, jesusWords: true, crossRefs: true }

let cache: ReadingAids | null = null
const listeners = new Set<() => void>()

export const getReadingAids = (): ReadingAids => {
  if (cache === null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const p = raw ? JSON.parse(raw) : {}
      cache = {
        paraphrase: p.paraphrase !== false,
        jesusWords: p.jesusWords !== false,
        crossRefs: p.crossRefs !== false,
      }
    } catch {
      cache = DEFAULTS
    }
  }
  return cache
}

export const setReadingAid = (key: keyof ReadingAids, value: boolean) => {
  cache = { ...getReadingAids(), [key]: value }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
  listeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 */
export const subscribeReadingAids = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
