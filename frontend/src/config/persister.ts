// React Query 캐시 영구 저장 설정
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

// 현재 사용자의 캐시 키 생성
const getCacheKey = () => {
  const username = localStorage.getItem('user_username')
  return username ? `REACT_QUERY_CACHE_${username}` : 'REACT_QUERY_CACHE_ANONYMOUS'
}

// localStorage를 사용한 사용자별 persister 구현
export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      const cacheKey = getCacheKey()
      localStorage.setItem(cacheKey, JSON.stringify(client))
    } catch (error) {
      console.error('Failed to persist cache:', error)
    }
  },
  
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    try {
      const cacheKey = getCacheKey()
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return undefined
      
      const client = JSON.parse(cached) as PersistedClient
      
      // 캐시 타임스탬프 확인
      const now = Date.now()
      const cacheAge = client.timestamp ? now - client.timestamp : Infinity
      
      // 30분 이상 지난 캐시는 무시 (장시간 후 재접속 시 최신 데이터 보장)
      const THIRTY_MINUTES = 1000 * 60 * 30
      if (cacheAge > THIRTY_MINUTES) {
        console.log('Cache is older than 30 minutes, ignoring')
        localStorage.removeItem(cacheKey)
        return undefined
      }
      
      return client
    } catch (error) {
      console.error('Failed to restore cache:', error)
      return undefined
    }
  },
  
  removeClient: async () => {
    const cacheKey = getCacheKey()
    localStorage.removeItem(cacheKey)
  },
}

// 모든 사용자의 캐시 초기화 함수 (로그아웃 시 사용)
export const clearAllPersistedCache = () => {
  // 모든 REACT_QUERY_CACHE 관련 키 삭제
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('REACT_QUERY_CACHE')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

// 현재 사용자의 캐시만 초기화
export const clearPersistedCache = () => {
  const cacheKey = getCacheKey()
  localStorage.removeItem(cacheKey)
}

