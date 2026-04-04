import { useQuery } from '@tanstack/react-query'
import { getProfileDetail, getMyPrayers, getPrayingFor, getMyReplies } from '../api/profile'

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
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분간 메모리 유지
  })
}

// 내가 작성한 기도 목록 (페이지네이션)
export const useMyPrayers = (skip: number = 0, limit: number = 20) => {
  return useQuery({
    queryKey: ['profile', 'my-prayers', skip, limit],
    queryFn: () => getMyPrayers({ skip, limit }),
    staleTime: 1000 * 60 * 3,
  })
}

// 내가 기도중인 목록 (페이지네이션)
export const usePrayingFor = (skip: number = 0, limit: number = 20) => {
  return useQuery({
    queryKey: ['profile', 'praying-for', skip, limit],
    queryFn: () => getPrayingFor({ skip, limit }),
    staleTime: 1000 * 60 * 3,
  })
}

// 내 댓글 목록 (페이지네이션)
export const useMyReplies = (skip: number = 0, limit: number = 20) => {
  return useQuery({
    queryKey: ['profile', 'my-replies', skip, limit],
    queryFn: () => getMyReplies({ skip, limit }),
    staleTime: 1000 * 60 * 3,
  })
}
