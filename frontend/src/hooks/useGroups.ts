// Prayer Group 관리 Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyGroups,
  fetchAllGroups,
  fetchGroup,
  fetchGroupPreview,
  createGroup,
  joinGroup,
  leaveGroup,
  addGroupMembers,
  fetchGroupMembers,
  updateGroup,
  deleteGroup,
  kickGroupMember,
  transferGroupAdmin,
  checkinGroup,
  fetchGroupDigest,
  fetchDiscoverGroups,
  joinOpenGroup,
  requestJoinGroup,
  fetchJoinRequests,
  decideJoinRequest,
  fetchGroupCare,
} from '../api/group'
import { showToast } from '../utils/toast'
import type { CreateGroupRequest, UpdateGroupRequest, JoinGroupRequest } from '../types/prayer'

// Query Keys
export const groupKeys = {
  all: ['groups'] as const,
  myGroups: () => [...groupKeys.all, 'my'] as const,
  allGroups: () => [...groupKeys.all, 'all'] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
  preview: (code: string) => [...groupKeys.all, 'preview', code] as const,
  members: (id: number) => [...groupKeys.all, 'members', id] as const,
  digest: (id: number) => [...groupKeys.all, 'digest', id] as const,
  discover: () => [...groupKeys.all, 'discover'] as const,
  joinRequests: (id: number) => [...groupKeys.all, 'join-requests', id] as const,
  care: (id: number) => [...groupKeys.all, 'care', id] as const,
}

// 내 그룹 목록 조회
export const useMyGroups = () => {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: fetchMyGroups,
    staleTime: 1000 * 60 * 5, // 5분
    // 가입·탈퇴 시점엔 이 쿼리가 비활성이라 stale 마크만 되는데,
    // 전역 refetchOnMount:false와 겹치면 목록 재진입 시에도 옛 캐시가 보인다
    // (캐시는 즉시 보여주고 뒤에서 갱신)
    refetchOnMount: true,
  })
}

// 전체 그룹 목록 조회
export const useAllGroups = () => {
  return useQuery({
    queryKey: groupKeys.allGroups(),
    queryFn: fetchAllGroups,
    staleTime: 1000 * 60 * 5,
    // 내 그룹 목록과 같은 이유 — 가입 여부·인원수가 담겨 있다
    refetchOnMount: true,
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
      // 비활성 쿼리는 stale 마크만 — 전역 refetchOnMount:true 라 화면에 돌아오면 그때 재조회한다.
      // (예전 refetchType:'all' 은 persist 로 복원된 지난 방문 방들까지 전부 즉시 재요청했다)
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

// 앱 사용자 바로 초대 (관리자 전용)
export const useAddGroupMembers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: number; userIds: number[] }) =>
      addGroupMembers(groupId, userIds),
    onSuccess: () => {
      // 성공 토스트는 호출부에서 처리 (추가/건너뜀을 구분해 안내)
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '멤버 추가에 실패했습니다', 'error')
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

// 그룹 멤버 목록 (멤버만)
export const useGroupMembers = (groupId: number, enabled = true) => {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
    enabled: enabled && groupId > 0,
    staleTime: 1000 * 60,
    refetchOnMount: true,
  })
}

// 그룹 정보 수정 (관리자만)
export const useUpdateGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: UpdateGroupRequest }) =>
      updateGroup(groupId, data),
    onSuccess: () => {
      showToast('그룹 정보를 수정했어요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '그룹 수정에 실패했습니다', 'error')
    },
  })
}

// 그룹 삭제 (관리자만)
export const useDeleteGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      showToast('그룹을 삭제했어요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '그룹 삭제에 실패했습니다', 'error')
    },
  })
}

// 멤버 내보내기 (관리자만)
export const useKickMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      kickGroupMember(groupId, userId),
    onSuccess: () => {
      showToast('멤버를 내보냈어요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '멤버 내보내기에 실패했습니다', 'error')
    },
  })
}

// 관리자 권한 이양
export const useTransferAdmin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, newAdminUserId }: { groupId: number; newAdminUserId: number }) =>
      transferGroupAdmin(groupId, newAdminUserId),
    onSuccess: () => {
      showToast('관리자 권한을 이양했어요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '권한 이양에 실패했습니다', 'error')
    },
  })
}

// 이번 주 다이제스트 (멤버만)
export const useGroupDigest = (groupId: number, enabled = true) => {
  return useQuery({
    queryKey: groupKeys.digest(groupId),
    queryFn: () => fetchGroupDigest(groupId),
    enabled: enabled && groupId > 0,
    staleTime: 1000 * 60,
    refetchOnMount: true,
  })
}

// 오늘의 체크인 — 응답(최신 다이제스트)으로 캐시를 바로 채운다
export const useGroupCheckin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => checkinGroup(groupId),
    onSuccess: (res, groupId) => {
      queryClient.setQueryData(groupKeys.digest(groupId), res)
    },
    onError: (error: Error) => {
      showToast(error.message || '체크인에 실패했습니다', 'error')
    },
  })
}

// 그룹 둘러보기 — 공개·승인제 그룹
export const useDiscoverGroups = (enabled = true) => {
  return useQuery({
    queryKey: groupKeys.discover(),
    queryFn: fetchDiscoverGroups,
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  })
}

// 공개 그룹 바로 가입
export const useJoinOpenGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => joinOpenGroup(groupId),
    onSuccess: () => {
      showToast('그룹에 가입했어요 🙌', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '그룹 가입에 실패했습니다', 'error')
    },
  })
}

// 승인제 그룹 가입 신청
export const useRequestJoinGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, message }: { groupId: number; message?: string }) =>
      requestJoinGroup(groupId, message),
    onSuccess: () => {
      showToast('가입을 신청했어요. 승인되면 알려드릴게요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.discover() })
    },
    onError: (error: Error) => {
      showToast(error.message || '가입 신청에 실패했습니다', 'error')
    },
  })
}

// 가입 신청 목록 (관리자만)
export const useJoinRequests = (groupId: number, enabled = true) => {
  return useQuery({
    queryKey: groupKeys.joinRequests(groupId),
    queryFn: () => fetchJoinRequests(groupId),
    enabled: enabled && groupId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })
}

// 가입 신청 승인/거절 (관리자만)
export const useDecideJoinRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupId,
      requestId,
      approve,
    }: {
      groupId: number
      requestId: number
      approve: boolean
    }) => decideJoinRequest(groupId, requestId, approve),
    onSuccess: (_res, { approve }) => {
      showToast(approve ? '가입을 승인했어요 🎉' : '가입 신청을 거절했어요', 'success')
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
    onError: (error: Error) => {
      showToast(error.message || '신청 처리에 실패했습니다', 'error')
    },
  })
}

// 리더 케어 신호 (관리자 전용)
export const useGroupCare = (groupId: number, enabled = true) => {
  return useQuery({
    queryKey: groupKeys.care(groupId),
    queryFn: () => fetchGroupCare(groupId),
    enabled: enabled && groupId > 0,
    staleTime: 1000 * 60 * 5,
  })
}
