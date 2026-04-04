import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBibleVerse } from '../api/bible'
import type { UpdateBibleVerseRequest, BibleChapterPaginatedResponse } from '../types/bible'
import type { InfiniteData } from '@tanstack/react-query'

/**
 * 성경 구절 수정 Mutation (관리자 전용)
 */
export const useUpdateBibleVerse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ verseId, data }: { verseId: number; data: UpdateBibleVerseRequest }) =>
      updateBibleVerse(verseId, data),
    onSuccess: (_, variables) => {
      const { verseId, data } = variables
      
      // 모든 성경 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['bible'] })
      
      // 특별히 무한 스크롤 캐시 강제 새로고침
      queryClient.refetchQueries({ 
        queryKey: ['bible', 'chapter', 'infinite'],
        type: 'active'
      })
      
      console.log('✅ Bible verse updated and cache invalidated:', { verseId, newText: data.text })
    },
    onError: (error) => {
      console.error('❌ Failed to update bible verse:', error)
    }
  })
}

/**
 * 성경 구절 수정 (낙관적 업데이트 포함)
 */
export const useOptimisticUpdateVerse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ verseId, newText, bookNumber, chapter }: {
      verseId: number
      newText: string
      bookNumber: number
      chapter: number
    }) => {
      // 낙관적 업데이트 먼저 적용
      const queryKey = ['bible', 'chapter', 'infinite', bookNumber, chapter]
      
      // 이전 데이터 백업
      const previousData = queryClient.getQueryData<InfiniteData<BibleChapterPaginatedResponse>>(queryKey)
      
      // 낙관적 업데이트
      queryClient.setQueryData(queryKey, (oldData: InfiniteData<BibleChapterPaginatedResponse> | undefined) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            verses: page.verses.map(v => 
              v.id === verseId ? { ...v, text: newText } : v
            )
          }))
        }
      })
      
      try {
        // 실제 API 호출
        const result = await updateBibleVerse(verseId, { text: newText })
        return { result, previousData, queryKey }
      } catch (error) {
        // 실패 시 이전 데이터로 롤백
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData)
        }
        throw error
      }
    },
    onSuccess: ({ queryKey }) => {
      // 성공 시 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['bible', 'search'] })
      queryClient.invalidateQueries({ queryKey })
    }
  })
}
