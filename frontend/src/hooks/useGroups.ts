// Prayer Group 관리 Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyGroups,
  fetchAllGroups,
  fetchGroup,
  fetchGroupPreview,
  createGroup,
  joinGroup,
  leaveGroup
} from '../api/group'
import { showToast } from '../utils/toast'
import type { CreateGroupRequest, JoinGroupRequest } from '../types/prayer'

// Query Keys
export const groupKeys = {
  all: ['groups'] as const,
  myGroups: () => [...groupKeys.all, 'my'] as const,
  allGroups: () => [...groupKeys.all, 'all'] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
  preview: (code: string) => [...groupKeys.all, 'preview', code] as const,
}

// 내 그룹 목록 조회
export const useMyGroups = () => {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: fetchMyGroups,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 전체 그룹 목록 조회
export const useAllGroups = () => {
  return useQuery({
    queryKey: groupKeys.allGroups(),
    queryFn: fetchAllGroups,
    staleTime: 1000 * 60 * 5,
  })
}

// 기도방 상세 조회 (통계·테마·오늘의 성구 포함)
export const useGroup = (groupId: number) => {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => fetchGroup(groupId),
    enabled: groupId > 0,
    staleTime: 1000 * 60, // 응답률이 실시간에 가깝게 보이도록 1분
  })
}

// 초대 링크 랜딩용 미리보기
export const useGroupPreview = (inviteCode: string) => {
  return useQuery({
    queryKey: groupKeys.preview(inviteCode),
    queryFn: () => fetchGroupPreview(inviteCode),
    enabled: inviteCode.length >= 6,
    retry: false,
  })
}

// 그룹 생성
export const useCreateGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => createGroup(data),
    onSuccess: () => {
      // 토스트는 모달에서 처리하므로 제거 — 상세 포함 전체 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: () => {
      // 에러는 모달에서 처리하므로 토스트 제거
    },
  })
}

// 그룹 가입
export const useJoinGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JoinGroupRequest) => joinGroup(data),
    onSuccess: () => {
      showToast('그룹에 가입했습니다', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '그룹 가입에 실패했습니다', 'error')
    },
  })
}

// 그룹 탈퇴
export const useLeaveGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupId: number) => leaveGroup(groupId),
    onSuccess: () => {
      showToast('그룹에서 탈퇴했습니다', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '그룹 탈퇴에 실패했습니다', 'error')
    },
  })
}
