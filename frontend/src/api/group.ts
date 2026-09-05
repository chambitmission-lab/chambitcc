// Prayer Group API
import type {
  PrayerGroup,
  PrayerGroupPreview,
  GroupListResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  JoinGroupRequest,
  GroupMembersResponse,
  GroupDigest,
  GroupJoinRequestItem,
  GroupCareMember,
} from '../types/prayer'
import { request } from './utils/request'

// 내가 속한 그룹 목록 조회
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  return request<GroupListResponse>('/prayer-groups/my', { auth: 'required', errorMessage: '그룹 목록을 불러오는데 실패했습니다' })
}

// 전체 그룹 목록 조회 (검색/탐색용)
export const fetchAllGroups = async (): Promise<GroupListResponse> => {
  return request<GroupListResponse>('/prayer-groups', { errorMessage: '그룹 목록을 불러오는데 실패했습니다' })
}

// 그룹 상세 조회 (비로그인도 가능, 로그인 시 멤버십 정보 포함)
export const fetchGroup = async (
  groupId: number
): Promise<{ success: boolean; data: PrayerGroup }> => {
  return request<{ success: boolean; data: PrayerGroup }>(`/prayer-groups/${groupId}`, { errorMessage: '기도방 정보를 불러오는데 실패했습니다' })
}

// 초대 링크 랜딩용 미리보기 (비로그인 가능)
export const fetchGroupPreview = async (
  inviteCode: string
): Promise<{ success: boolean; data: PrayerGroupPreview }> => {
  return request<{ success: boolean; data: PrayerGroupPreview }>(`/prayer-groups/preview/${encodeURIComponent(inviteCode)}`, { errorMessage: '초대장을 찾을 수 없습니다' })
}

// 그룹 생성
export const createGroup = async (
  data: CreateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  return request<{ success: boolean; data: PrayerGroup }>('/prayer-groups', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '그룹 생성에 실패했습니다',
  })
}

// 그룹 가입 (초대 코드)
export const joinGroup = async (
  data: JoinGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  return request<{ success: boolean; data: PrayerGroup }>('/prayer-groups/join', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '그룹 가입에 실패했습니다',
  })
}

// 앱 사용자를 기도방에 바로 추가 — 관리자 전용, 이미 멤버면 서버가 건너뛴다(멱등)
export const addGroupMembers = async (
  groupId: number,
  userIds: number[],
): Promise<{ success: boolean; data: { added_count: number } }> => {
  return request<{ success: boolean; data: { added_count: number } }>(`/prayer-groups/${groupId}/members`, {
    method: 'POST',
    auth: 'required',
    json: { user_ids: userIds },
    errorMessage: '멤버 추가에 실패했습니다',
  })
}

// 그룹 탈퇴
export const leaveGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayer-groups/${groupId}/leave`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '그룹 탈퇴에 실패했습니다',
  })
}

// 그룹 멤버 목록 조회
export const fetchGroupMembers = async (
  groupId: number
): Promise<GroupMembersResponse> => {
  return request<GroupMembersResponse>(`/prayer-groups/${groupId}/members`, { auth: 'required', errorMessage: '멤버 목록을 불러오는데 실패했습니다' })
}

// 그룹 수정 (관리자만) — 이름/설명/아이콘/테마/공개설정/기도시간
export const updateGroup = async (
  groupId: number,
  data: UpdateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  return request<{ success: boolean; data: PrayerGroup }>(`/prayer-groups/${groupId}`, {
    method: 'PATCH',
    auth: 'required',
    json: data,
    errorMessage: '그룹 수정에 실패했습니다',
  })
}

// 그룹 삭제 (관리자만)
export const deleteGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayer-groups/${groupId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '그룹 삭제에 실패했습니다',
  })
}

// 멤버 내보내기 (관리자만)
export const kickGroupMember = async (
  groupId: number,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayer-groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '멤버 내보내기에 실패했습니다',
  })
}

// 관리자 권한 이양
export const transferGroupAdmin = async (
  groupId: number,
  newAdminUserId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayer-groups/${groupId}/transfer-admin`, {
    method: 'POST',
    auth: 'required',
    json: { new_admin_user_id: newAdminUserId },
    errorMessage: '권한 이양에 실패했습니다',
  })
}

// 오늘의 그룹 체크인 (멱등) — 최신 다이제스트를 돌려준다
export const checkinGroup = async (
  groupId: number
): Promise<{ success: boolean; data: GroupDigest }> => {
  return request<{ success: boolean; data: GroupDigest }>(`/prayer-groups/${groupId}/checkin`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '체크인에 실패했습니다',
  })
}

// 이번 주 다이제스트
export const fetchGroupDigest = async (
  groupId: number
): Promise<{ success: boolean; data: GroupDigest }> => {
  return request<{ success: boolean; data: GroupDigest }>(`/prayer-groups/${groupId}/digest`, { auth: 'required', errorMessage: '다이제스트를 불러오는데 실패했습니다' })
}

// 그룹 둘러보기 — 공개·승인제 그룹 중 내가 안 들어간 방
export const fetchDiscoverGroups = async (): Promise<GroupListResponse> => {
  return request<GroupListResponse>('/prayer-groups/discover', { auth: 'required', errorMessage: '그룹 둘러보기를 불러오는데 실패했습니다' })
}

// 공개 그룹 바로 가입
export const joinOpenGroup = async (
  groupId: number
): Promise<{ success: boolean; data: PrayerGroup }> => {
  return request<{ success: boolean; data: PrayerGroup }>(`/prayer-groups/${groupId}/join-open`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '그룹 가입에 실패했습니다',
  })
}

// 승인제 그룹 가입 신청
export const requestJoinGroup = async (
  groupId: number,
  message?: string
): Promise<{ success: boolean; data: { status: string } }> => {
  return request<{ success: boolean; data: { status: string } }>(`/prayer-groups/${groupId}/join-request`, {
    method: 'POST',
    auth: 'required',
    json: { message: message || null },
    errorMessage: '가입 신청에 실패했습니다',
  })
}

// 가입 신청 목록 (관리자만)
export const fetchJoinRequests = async (
  groupId: number
): Promise<{ success: boolean; data: { items: GroupJoinRequestItem[]; total: number } }> => {
  return request<{ success: boolean; data: { items: GroupJoinRequestItem[]; total: number } }>(`/prayer-groups/${groupId}/join-requests`, { auth: 'required', errorMessage: '가입 신청 목록을 불러오는데 실패했습니다' })
}

// 가입 신청 승인/거절 (관리자만)
export const decideJoinRequest = async (
  groupId: number,
  requestId: number,
  approve: boolean
): Promise<{ success: boolean; data: { status: string } }> => {
  return request<{ success: boolean; data: { status: string } }>(`/prayer-groups/${groupId}/join-requests/${requestId}/${approve ? 'approve' : 'reject'}`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '신청 처리에 실패했습니다',
  })
}

// 리더 케어 신호 — 2주 이상 소식 없는 멤버 (관리자 전용)
export const fetchGroupCare = async (
  groupId: number
): Promise<{ success: boolean; data: { items: GroupCareMember[]; total: number } }> => {
  return request<{ success: boolean; data: { items: GroupCareMember[]; total: number } }>(`/prayer-groups/${groupId}/care`, { auth: 'required', errorMessage: '케어 정보를 불러오는데 실패했습니다' })
}
