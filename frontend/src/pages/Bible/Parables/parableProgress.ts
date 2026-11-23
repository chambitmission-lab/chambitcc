import { useSyncExternalStore } from 'react'
import { safeStorage } from '../../../utils/safeStorage'
import { sessionStore } from '../../../utils/tokenStore'

// 비유 도감 읽음 기록 — 기기 로컬(사용자별 키). 백엔드 저장은 아직 없다.
// 화면·시트가 같은 값을 보도록 모듈 스토어 + useSyncExternalStore.
const BASE_KEY = 'bible-parables-read-v1'

const storageKey = (): string => {
  const username = sessionStore.get('username')
  return username ? `${BASE_KEY}:${username}` : BASE_KEY
}

const EMPTY: ReadonlySet<string> = new Set()
let cacheKey: string | null = null
let cache: ReadonlySet<string> = EMPTY
const listeners = new Set<() => void>()

const load = (key: string): ReadonlySet<string> => {
  const raw = safeStorage.getJson(key)
  return Array.isArray(raw) ? new Set(raw.filter((x): x is string => typeof x === 'string')) : EMPTY
}

/** 지금 계정의 읽은 비유 id — 계정이 바뀌면(로그인·로그아웃) 다시 읽는다 */
const getRead = (): ReadonlySet<string> => {
  const key = storageKey()
  if (key !== cacheKey) {
    cacheKey = key
    cache = load(key)
  }
  return cache
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export const markParableRead = (id: string) => {
  const cur = getRead()
  if (cur.has(id)) return
  const next = new Set(cur)
  next.add(id)
  cache = next
  safeStorage.setJson(storageKey(), [...next])
  listeners.forEach((fn) => fn())
}

export const useParableRead = (): ReadonlySet<string> => useSyncExternalStore(subscribe, getRead, getRead)
