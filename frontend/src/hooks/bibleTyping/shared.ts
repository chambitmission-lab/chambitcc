// 필사 훅들이 같이 쓰는 내부 조각 — 로그인 여부·JSON 파싱·공통 staleTime·하트비트 간격
import { tokenStore } from '../../utils/tokenStore'

export const loggedIn = () => !!tokenStore.getAccess()

export const parseJson = <T,>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const TYPING_HOME_STALE = 1000 * 30

// 하트비트 간격 — 서버는 70초 끊기면 떠난 것으로 본다
export const PRESENCE_BEAT_MS = 25_000
