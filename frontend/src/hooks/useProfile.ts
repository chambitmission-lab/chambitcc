import { useQuery } from '@tanstack/react-query'
import { getProfileDetail, getMyPrayers, getPrayingFor, getMyReplies } from '../api/profile'
import type { ProfileDetail } from '../types/profile'

const PROFILE_CACHE_KEY = 'profile_detail_cache'
const PROFILE_CACHE_TIMESTAMP_KEY = 'profile_detail_cache_timestamp'
const CACHE_DURATION = 1000 * 60 * 10 // 10분

// 로컬스토리지에서 캐시 가져오기
const getProfileCache = (): ProfileDetail | undefined => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    const timestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY)
    
    if (!cached || !timestamp) return undefined
    
    // 캐시가 10분 이상 오래되었으면 무시
    const age = Date.now() - parseInt(timestamp)
    if (age > CACHE_DURATION) {
      localStorage.removeItem(PROFILE_CACHE_KEY)
      localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY)
      return undefined
    }
    
    return JSON.parse(cached)
  } catch (error) {
    console.error('프로필 캐시 로드 실패:', error)
    return undefined
  }
}

// 로컬스토리지에 캐시 저장
const setProfileCache = (data: ProfileDetail) => {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('프로필 캐시 저장 실패:', error)
  }
}

// 프로필 캐시 삭제 (로그아웃 시 사용)
export const clearProfileCache = () => {
  localStorage.removeItem(PROFILE_CACHE_KEY)
  localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY)
}

// 프로필 전체 정보 조회
export const useProfileDetail = () => {
  return useQuery({
    queryKey: ['profile', 'detail'],
    queryFn: async () => {
      const data = await getProfileDetail({
        prayers_limit: 5,
        praying_limit: 12,
        replies_limit: 8,
      })
      // API 호출 성공 시 로컬스토리지에 저장
      setProfileCache(data)
      return data
    },
    // 로컬스토리지 캐시를 초기 데이터로 사용
    placeholderData: getProfileCache,
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
