import { API_V1 } from '../config/api'
import { setHistoryEvents } from '../pages/History/data/events'
import type { HistoryEvent } from '../pages/History/data/types'
import { request } from './utils/request'

interface ChurchHistoryPayload {
  version: string
  events: HistoryEvent[]
}

// 재방문은 지난번 받은 기록으로 바로 연다 — 기록은 해마다 몇 줄 붙는 정도라, 새 판은 백그라운드로
// 받아 두었다가 다음 방문에 쓴다(서버 ETag 로 바뀌지 않았으면 본문 없이 끝난다).
const STORAGE_KEY = 'chambit:church-history:v1'

const readCache = (): ChurchHistoryPayload | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChurchHistoryPayload
    return Array.isArray(parsed?.events) && parsed.events.length > 0 ? parsed : null
  } catch {
    return null
  }
}

const writeCache = (payload: ChurchHistoryPayload): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 저장소가 막혀 있으면 다음 방문도 네트워크로 받으면 된다
  }
}

const fetchHistory = () =>
  request<ChurchHistoryPayload>(`${API_V1}/church-history`, {
    auth: false,
    errorMessage: '발자취 기록을 불러오지 못했습니다',
  })

let ready = false
let inflight: Promise<void> | null = null

/** 발자취 기록을 채운다 — 화면 청크를 열기 전에 끝나야 한다. 실패하면 다음 호출에서 다시 받는다 */
export const loadChurchHistory = (): Promise<void> => {
  if (ready) return Promise.resolve()
  if (inflight) return inflight

  const cached = readCache()
  const fresh = fetchHistory().then((payload) => {
    if (payload.version !== cached?.version) writeCache(payload)
    return payload
  })
  if (cached) {
    setHistoryEvents(cached.events)
    ready = true
    void fresh.catch(() => undefined)
    return Promise.resolve()
  }
  inflight = fresh
    .then((payload) => {
      setHistoryEvents(payload.events)
      ready = true
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** 발자취 화면 청크 로더를 감싼다 — 기록을 먼저 채우고 청크를 연다 (/history · /history/new 공용) */
export const withChurchHistory =
  <T,>(load: () => Promise<T>) =>
  (): Promise<T> =>
    loadChurchHistory().then(load)
