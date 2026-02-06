// 설교 데이터 관리 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSermons, createSermon, uploadAudio } from '../api/sermon'
import type { SermonCreateRequest } from '../types/sermon'
import { showToast } from '../utils/toast'

export const useSermons = (skip = 0, limit = 10) => {
  return useQuery({
    queryKey: ['sermons', skip, limit],
    queryFn: () => getSermons(skip, limit),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

export const useUploadAudio = () => {
  return useMutation({
    mutationFn: uploadAudio,
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}

export const useCreateSermon = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SermonCreateRequest) => createSermon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      showToast('설교가 성공적으로 등록되었습니다', 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
