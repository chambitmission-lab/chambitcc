// 본문 앞 안내 — 절 목록 위에 쌓이는 세 줄(오디오북 바 / 권 개관 바 / 오늘의 길잡이)을
// 각각 보일지 말지. 읽기 설정(Aa)에서 고르고 기기별로 저장한다.
//
// 처음 오는 성도에겐 길잡이지만, 매일 같은 책을 읽는 사람에겐 본문이 그만큼 아래로 밀린다.
// 저장·전파 방식은 readerLayout / sectionHeadings 와 같다 — 바꾸는 즉시 열린 본문에 반영.
//
// 주의: 오디오북을 꺼도 플레이어는 마운트된 채로 숨긴다. 절 메뉴의 '여기부터 듣기'와
// 장 끝 연속 재생이 같은 <audio> 요소를 쓰기 때문 (BibleStudy 가 그때 다시 드러낸다).

export interface ReaderIntroCards {
  /** 오디오북 재생 바 */
  audio: boolean
  /** 권 개관 진입 바 ("창세기는 어떤 책인가요?") */
  bookIntro: boolean
  /** 오늘의 길잡이 (장별 3줄) */
  brief: boolean
}

const STORAGE_KEY = 'bible-reader-intro-cards'
const DEFAULTS: ReaderIntroCards = { audio: true, bookIntro: true, brief: true }

let cache: ReaderIntroCards | null = null
const listeners = new Set<() => void>()

export const getReaderIntroCards = (): ReaderIntroCards => {
  if (cache === null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const p = raw ? JSON.parse(raw) : {}
      cache = {
        audio: p.audio !== false,
        bookIntro: p.bookIntro !== false,
        brief: p.brief !== false,
      }
    } catch {
      cache = DEFAULTS
    }
  }
  return cache
}

export const setReaderIntroCard = (key: keyof ReaderIntroCards, value: boolean) => {
  cache = { ...getReaderIntroCards(), [key]: value }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
  listeners.forEach((fn) => fn())
}

/** useSyncExternalStore 용 구독 */
export const subscribeReaderIntroCards = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
