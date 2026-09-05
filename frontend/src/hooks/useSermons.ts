// 설교 데이터 관리 훅
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSermons, createSermon, updateSermon, uploadAudio, deleteSermon, deleteAudioOnly } from '../api/sermon'
import type { SermonCreateRequest } from '../types/sermon'
import type { MutationFeedback } from './mutationFeedback'
import { sermonKeys } from './queryKeys'

// includeContent=false 는 전문 없는 경량 목록 (랜딩·홈 카드). 키를 분리해
// 설교 페이지의 전문 포함 캐시와 섞이지 않게 한다.
export const useSermons = (skip = 0, limit = 10, includeContent = true) => {
  return useQuery({
    queryKey: sermonKeys.list(skip, limit, includeContent),
    queryFn: () => getSermons(skip, limit, includeContent),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

const SERMON_PAGE_SIZE = 10

// 설교 목록 무한 스크롤 — skip/limit 기반, 마지막 페이지가 꽉 차지 않으면 종료
export const useInfiniteSermons = () => {
  return useInfiniteQuery({
    queryKey: sermonKeys.infinite(),
    queryFn: ({ pageParam }) => getSermons(pageParam as number, SERMON_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === SERMON_PAGE_SIZE ? allPages.length * SERMON_PAGE_SIZE : undefined,
    staleTime: 1000 * 60 * 5,
  })
}

export const useUploadAudio = (feedback?: MutationFeedback) => {
  return useMutation({
    mutationFn: uploadAudio,
    onError: (error: Error, variables) => {
      feedback?.onError?.(error, variables)
    },
    onSuccess: (data, variables) => feedback?.onSuccess?.(data, variables),
})
}

export const useCreateSermon = (feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SermonCreateRequest) => createSermon(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sermonKeys.all })
      feedback?.onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      feedback?.onError?.(error, variables)
    },
  })
}

export const useUpdateSermon = (feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SermonCreateRequest }) => updateSermon(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sermonKeys.all })
      feedback?.onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      feedback?.onError?.(error, variables)
    },
  })
}

export const useDeleteSermon = (feedback?: MutationFeedback) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => deleteSermon(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sermonKeys.all })
      feedback?.onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      feedback?.onError?.(error, variables)
    },
  })
}

export const useDeleteAudioOnly = (feedback?: MutationFeedback) => {
  return useMutation({
    mutationFn: (audioUrl: string) => deleteAudioOnly(audioUrl),
    onSuccess: (data, variables) => {
      feedback?.onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      feedback?.onError?.(error, variables)
    },
  })
}
