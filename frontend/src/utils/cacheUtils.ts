import type { QueryClient } from '@tanstack/react-query'

/**
 * 성경 관련 캐시 완전 새로고침
 */
export const refreshBibleCache = async (queryClient: QueryClient, bookNumber?: number, chapter?: number) => {
  console.log('🔄 Refreshing bible cache...', { bookNumber, chapter })
  
  try {
    if (bookNumber && chapter) {
      // 특정 장만 새로고침
      await queryClient.refetchQueries({
        queryKey: ['bible', 'chapter', 'infinite', bookNumber, chapter],
        type: 'active'
      })
      
      await queryClient.refetchQueries({
        queryKey: ['bible', 'chapter', bookNumber, chapter],
        type: 'active'
      })
    } else {
      // 모든 성경 캐시 새로고침
      await queryClient.refetchQueries({
        queryKey: ['bible'],
        type: 'active'
      })
    }
    
    console.log('✅ Bible cache refreshed successfully')
  } catch (error) {
    console.error('❌ Failed to refresh bible cache:', error)
  }
}

/**
 * 성경 캐시 무효화 (다음 접근 시 새로 로드)
 */
export const invalidateBibleCache = (queryClient: QueryClient, bookNumber?: number, chapter?: number) => {
  console.log('🗑️ Invalidating bible cache...', { bookNumber, chapter })
  
  if (bookNumber && chapter) {
    // 특정 장 캐시만 무효화
    queryClient.invalidateQueries({
      queryKey: ['bible', 'chapter', 'infinite', bookNumber, chapter]
    })
    
    queryClient.invalidateQueries({
      queryKey: ['bible', 'chapter', bookNumber, chapter]
    })
  } else {
    // 모든 성경 캐시 무효화
    queryClient.invalidateQueries({
      queryKey: ['bible']
    })
  }
  
  console.log('✅ Bible cache invalidated')
}

/**
 * 성경 캐시 완전 제거 (메모리에서 삭제)
 */
export const removeBibleCache = (queryClient: QueryClient, bookNumber?: number, chapter?: number) => {
  console.log('🗑️ Removing bible cache...', { bookNumber, chapter })
  
  if (bookNumber && chapter) {
    // 특정 장 캐시만 제거
    queryClient.removeQueries({
      queryKey: ['bible', 'chapter', 'infinite', bookNumber, chapter]
    })
    
    queryClient.removeQueries({
      queryKey: ['bible', 'chapter', bookNumber, chapter]
    })
  } else {
    // 모든 성경 캐시 제거
    queryClient.removeQueries({
      queryKey: ['bible']
    })
  }
  
  console.log('✅ Bible cache removed')
}