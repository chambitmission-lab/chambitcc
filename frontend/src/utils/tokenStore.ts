/**
 * 인증 토큰·세션 사용자 정보 저장소.
 *
 * 토큰이 어디에 있는지(localStorage 인지, 쿠키인지, 메모리인지)를 아는 곳은 여기뿐이다.
 * api/·hooks/·App.tsx 가 localStorage 키 문자열을 직접 들고 다니면 저장 방식을 바꿀 때
 * 100곳을 고쳐야 하므로, 토큰과 세션 사용자 필드는 반드시 이 모듈을 통해 읽고 쓴다.
 */

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key: string, value: string | null | undefined): void => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 사파리 프라이빗 모드 등 저장 불가 환경은 조용히 무시 */
  }
}

export const tokenStore = {
  getAccess: (): string | null => safeGet(ACCESS_KEY),
  getRefresh: (): string | null => safeGet(REFRESH_KEY),
  /** 로그인 여부(만료 판정 없음). 만료까지 보려면 utils/auth 의 isAuthenticated 를 쓴다. */
  hasAccess: (): boolean => !!safeGet(ACCESS_KEY),
  setAccess: (token: string | null | undefined): void => safeSet(ACCESS_KEY, token),
  setRefresh: (token: string | null | undefined): void => safeSet(REFRESH_KEY, token),
  setTokens: (access: string | null | undefined, refresh: string | null | undefined): void => {
    safeSet(ACCESS_KEY, access)
    safeSet(REFRESH_KEY, refresh)
  },
  clear: (): void => {
    safeSet(ACCESS_KEY, null)
    safeSet(REFRESH_KEY, null)
  },
}

/** 로그인 응답에서 미러링해 두는 세션 사용자 정보 — 첫 페인트 전 표시용 */
export const SESSION_USER_KEYS = {
  username: 'user_username',
  fullName: 'user_full_name',
  avatarUrl: 'user_avatar_url',
  fingerprint: 'user_fingerprint',
  user: 'user',
} as const

type SessionField = keyof typeof SESSION_USER_KEYS

export const sessionStore = {
  get: (field: SessionField): string | null => safeGet(SESSION_USER_KEYS[field]),
  set: (field: SessionField, value: string | null | undefined): void =>
    safeSet(SESSION_USER_KEYS[field], value),
  clear: (): void => {
    for (const key of Object.values(SESSION_USER_KEYS)) safeSet(key, null)
  },
}
