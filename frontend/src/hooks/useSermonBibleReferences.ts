// 설교별 성경 구절 목록 조회 훅
import { useQuery } from '@tanstack/react-query'
import { getSermonBibleReferences } from '../api/sermon'
import type { BibleReference } from '../types/sermon'

export const useSermonBibleReferences = (sermonId: number | null) => {
  return useQuery<BibleReference[]>({
    queryKey: ['sermon-bible-references', sermonId],
    queryFn: () => {
      if (!sermonId) {
        throw new Error('설교 ID가 필요합니다')
      }
      return getSermonBibleReferences(sermonId)
    },
    enabled: !!sermonId,
    staleTime: 5 * 60 * 1000, // 5분
  })
}
