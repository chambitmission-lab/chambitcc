import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfileDetail,
  getProfileStats,
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
      // 헤더 아바타(['me'])는 'profile' prefix 밖에 있으므로 따로 무효화
      queryClient.invalidateQueries({ queryKey: ['me'] })
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
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

// 전역 크롬(PC 우상단 계정 아바타)이 쓰는 "나" 정보 — 사진 + 이름.
//
// 프로필 상세(useProfileDetail)는 기도·댓글 목록까지 묶은 무거운 집계 API인데다
// 기도/성경 뮤테이션마다 ['profile'] 이 통째로 무효화된다. 헤더는 모든 페이지에
// 항상 떠 있으므로 그 키를 그대로 쓰면 페이지 이동·좋아요 한 번마다 상세를 다시 부른다.
// 그래서 가벼운 stats 를 ['me'] 라는 별도 네임스페이스에 길게 캐시하고,
// 사진이 실제로 바뀌는 순간(업로드·삭제)에만 명시적으로 무효화한다.
const AVATAR_CACHE_KEY = 'user_avatar_url'

export const useMyIdentity = () => {
  const token = localStorage.getItem('access_token')

  const { data } = useQuery({
    queryKey: ['me', 'identity'],
    queryFn: getProfileStats,
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10분 — 사진/이름은 거의 안 바뀐다
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  // 응답이 오기 전 첫 페인트에도 사진이 보이도록 localStorage 에 미러링한다
  // (없으면 새로고침마다 이니셜 → 사진으로 깜빡인다)
  useEffect(() => {
    if (!data) return
    if (data.avatar_url) localStorage.setItem(AVATAR_CACHE_KEY, data.avatar_url)
    else localStorage.removeItem(AVATAR_CACHE_KEY)
  }, [data])

  const avatarUrl = data?.avatar_url ?? (token ? localStorage.getItem(AVATAR_CACHE_KEY) : null)
  const displayName =
    data?.full_name || data?.username || localStorage.getItem('user_full_name') || localStorage.getItem('user_username') || ''

  return { avatarUrl, displayName }
}
