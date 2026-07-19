import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfileDetail,
  getMyPrayers,
  getPrayingFor,
  getMyReplies,
  uploadProfileAvatar,
  deleteProfileAvatar,
} from '../api/profile'

// 프로필 전체 정보 조회 (React Query persist-client가 localStorage 영속화 담당)
export const useProfileDetail = () => {
  const token = localStorage.getItem('access_token')

  return useQuery({
    queryKey: ['profile', 'detail'],
    queryFn: () => getProfileDetail({
      prayers_limit: 5,
      praying_limit: 12,
      replies_limit: 8,
    }),
    // 로그인 안되어 있으면 쿼리 비활성화
    enabled: !!token,
    staleTime: 1000 * 15, // 15초 (포인트 실시간 반영 위해 짧게)
    gcTime: 1000 * 60 * 30, // 30분간 메모리 유지
    refetchOnWindowFocus: true, // 탭 복귀 시 자동 갱신
    refetchOnMount: true, // 페이지 진입 시 최신화
  })
}

// 프로필 탭 목록 무한 스크롤 페이지 크기
const LIST_PAGE_SIZE = 20

// skip/limit 기반 무한 스크롤: 마지막 페이지가 꽉 찼으면 지금까지 받은
// 총 개수를 다음 skip으로 사용, 덜 찼으면 끝
const nextSkip = <T,>(lastPage: T[], allPages: T[][]) =>
  lastPage.length < LIST_PAGE_SIZE
    ? undefined
    : allPages.reduce((n, p) => n + p.length, 0)

// 내가 작성한 기도 목록 (무한 스크롤)
export const useMyPrayers = (enabled: boolean = true) => {
  return useInfiniteQuery({
    queryKey: ['profile', 'my-prayers', 'infinite'],
    queryFn: ({ pageParam }) => getMyPrayers({ skip: pageParam, limit: LIST_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
    enabled,
    staleTime: 1000 * 60 * 3,
  })
}

// 내가 기도중인 목록 (무한 스크롤)
export const usePrayingFor = (enabled: boolean = true) => {
  return useInfiniteQuery({
    queryKey: ['profile', 'praying-for', 'infinite'],
    queryFn: ({ pageParam }) => getPrayingFor({ skip: pageParam, limit: LIST_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
    enabled,
    staleTime: 1000 * 60 * 3,
  })
}

// 내 댓글 목록 (무한 스크롤)
export const useMyReplies = (enabled: boolean = true) => {
  return useInfiniteQuery({
    queryKey: ['profile', 'my-replies', 'infinite'],
    queryFn: ({ pageParam }) => getMyReplies({ skip: pageParam, limit: LIST_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
    enabled,
    staleTime: 1000 * 60 * 3,
  })
}

// 프로필 사진 업로드/교체
export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: Blob) => uploadProfileAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// 프로필 사진 삭제
export const useDeleteAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteProfileAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
