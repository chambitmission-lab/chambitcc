// React Query 캐시 영구 저장 — IndexedDB 기반 persister
//
// 예전엔 localStorage 에 전체 캐시를 JSON 문자열로 넣었다. 그 방식은
//   1) 캐시가 바뀔 때마다(1초 스로틀) 전체를 JSON.stringify + setItem — 둘 다 동기라
//      캐시가 수 MB 로 자라면 스크롤·SSE 갱신 중에 메인 스레드가 수십 ms 씩 멈췄고,
//   2) 부팅 때도 통째로 JSON.parse 하느라 첫 렌더가 늦어졌으며,
//   3) 5MB 한도를 넘는 순간 setItem 이 throw → catch 에서 삼켜져 persist 전체가 조용히 죽었다.
// IndexedDB 는 구조화 복제(문자열화 없음)·비동기 쓰기·수백 MB 한도라 세 문제가 모두 사라진다.
// 사용자별 키는 그대로 유지한다 (같은 기기에서 계정을 바꿔도 남의 캐시가 보이지 않게).
// 만료(maxAge) 판정은 main.tsx 의 persistOptions.maxAge 한 곳에서만 한다.
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

const DB_NAME = 'chambit-query-cache'
const STORE = 'clients'
const LEGACY_PREFIX = 'REACT_QUERY_CACHE'

// 쓰기 스로틀 — 캐시가 바뀔 때마다(SSE 카운트·스크롤 페이지 추가 등) 전체를 다시 쓰지 않고
// 마지막 변경 뒤 3초에 한 번만 쓴다 (persist-client 는 스로틀을 persister 에 맡긴다).
// 잃어봐야 "마지막 3초치 캐시" 라 다음 실행에서 서버가 다시 채운다.
const PERSIST_THROTTLE_MS = 3000

// 현재 사용자의 캐시 키 생성
const getCacheKey = () => {
  const username = localStorage.getItem('user_username')
  return username ? `${LEGACY_PREFIX}_${username}` : `${LEGACY_PREFIX}_ANONYMOUS`
}

let dbPromise: Promise<IDBDatabase | null> | null = null

const openDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null)
        return
      }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => {
        const db = req.result
        // 다른 탭이 버전을 올리거나 브라우저가 저장소를 정리하면 연결을 놓고 다음에 다시 연다
        db.onversionchange = () => {
          db.close()
          dbPromise = null
        }
        resolve(db)
      }
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

// 실패는 전부 undefined 로 삼킨다 — 캐시는 있으면 좋은 것이지 앱을 멈출 이유가 아니다
const withStore = <T,>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> =>
  openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) {
          resolve(undefined)
          return
        }
        try {
          const tx = db.transaction(STORE, mode)
          const req = run(tx.objectStore(STORE))
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(undefined)
          tx.onabort = () => resolve(undefined)
        } catch {
          resolve(undefined)
        }
      }),
  )

// 예전 localStorage 캐시 정리 — 최대 5MB 짜리 죽은 문자열이 남아 있으면
// 같은 오리진의 다른 localStorage 접근까지 느려진다. 첫 실행 때 한 번 지운다.
const removeLegacyLocalStorageCache = () => {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(LEGACY_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) — 무시
  }
}

const writeClient = async (client: PersistedClient) => {
  const key = getCacheKey()
  const ok = await withStore('readwrite', (store) => store.put(client, key))
  // 구조화 복제가 불가능한 값(함수 등)이 섞이면 put 이 실패한다 —
  // 그런 경우에만 JSON 왕복으로 정제해 한 번 더 시도한다
  if (ok === undefined) {
    try {
      const plain = JSON.parse(JSON.stringify(client)) as PersistedClient
      await withStore('readwrite', (store) => store.put(plain, key))
    } catch (error) {
      console.error('Failed to persist cache:', error)
    }
  }
}

let pendingClient: PersistedClient | null = null
let throttleTimer: ReturnType<typeof setTimeout> | null = null

const flushPending = () => {
  throttleTimer = null
  const client = pendingClient
  pendingClient = null
  if (client) void writeClient(client)
}

// 탭이 숨겨지거나 닫힐 때는 기다리지 않고 바로 쓴다 (IDB 쓰기는 페이지가 내려가도 마무리된다)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && throttleTimer) {
      clearTimeout(throttleTimer)
      flushPending()
    }
  })
}

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    pendingClient = client
    if (!throttleTimer) throttleTimer = setTimeout(flushPending, PERSIST_THROTTLE_MS)
  },

  restoreClient: async (): Promise<PersistedClient | undefined> => {
    removeLegacyLocalStorageCache()
    const client = await withStore<PersistedClient>('readonly', (store) => store.get(getCacheKey()))
    return client ?? undefined
  },

  removeClient: async () => {
    pendingClient = null
    await withStore('readwrite', (store) => store.delete(getCacheKey()))
  },
}

// 모든 사용자의 캐시 초기화 (로그아웃 시 사용)
export const clearAllPersistedCache = () => {
  pendingClient = null
  removeLegacyLocalStorageCache()
  void withStore('readwrite', (store) => store.clear())
}

// 현재 사용자의 캐시만 초기화
export const clearPersistedCache = () => {
  pendingClient = null
  void withStore('readwrite', (store) => store.delete(getCacheKey()))
}
