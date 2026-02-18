// React Query 캐시 영구 저장 설정
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

// localStorage를 사용한 간단한 persister 구현
export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      localStorage.setItem('REACT_QUERY_CACHE', JSON.stringify(client))
    } catch (error) {
      console.error('Failed to persist cache:', error)
    }
  },
  
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    try {
      const cached = localStorage.getItem('REACT_QUERY_CACHE')
      if (!cached) return undefined
      
      const client = JSON.parse(cached) as PersistedClient
      
      // 6시간 이상 지난 캐시는 무시 (PWA 재실행 시 신선한 데이터 보장)
      const now = Date.now()
      if (client.timestamp && now - client.timestamp > 1000 * 60 * 60 * 6) {
        localStorage.removeItem('REACT_QUERY_CACHE')
        return undefined
      }
      
      return client
    } catch (error) {
      console.error('Failed to restore cache:', error)
      return undefined
    }
  },
  
  removeClient: async () => {
    localStorage.removeItem('REACT_QUERY_CACHE')
  },
}

// 캐시 초기화 함수 (필요시 사용)
export const clearPersistedCache = () => {
  localStorage.removeItem('REACT_QUERY_CACHE')
}
