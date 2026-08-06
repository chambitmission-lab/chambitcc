// Prayer Group API
import { API_V1, apiFetch } from '../config/api'
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

// 로그인 필수 요청 공통 헤더
const authHeaders = (json = false): HeadersInit => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

// 에러 detail을 살려서 던진다
const throwDetail = async (response: Response, fallback: string): Promise<never> => {
  const error = await response.json().catch(() => null)
  throw new Error(error?.detail || fallback)
}

// 내가 속한 그룹 목록 조회
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/my`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 전체 그룹 목록 조회 (검색/탐색용)
export const fetchAllGroups = async (): Promise<GroupListResponse> => {
  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayer-groups`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 그룹 상세 조회 (비로그인도 가능, 로그인 시 멤버십 정보 포함)
export const fetchGroup = async (
  groupId: number
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error('기도방 정보를 불러오는데 실패했습니다')
  }

  return response.json()
}

// 초대 링크 랜딩용 미리보기 (비로그인 가능)
export const fetchGroupPreview = async (
  inviteCode: string
): Promise<{ success: boolean; data: PrayerGroupPreview }> => {
  const headers: HeadersInit = {}
  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await apiFetch(
    `${API_V1}/prayer-groups/preview/${encodeURIComponent(inviteCode)}`,
    { headers },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || '초대장을 찾을 수 없습니다')
  }

  return response.json()
}

// 그룹 생성
export const createGroup = async (
  data: CreateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 생성에 실패했습니다')
  }

  return response.json()
}

// 그룹 가입 (초대 코드)
export const joinGroup = async (
  data: JoinGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 가입에 실패했습니다')
  }

  return response.json()
}

// 앱 사용자를 기도방에 바로 추가 — 관리자 전용, 이미 멤버면 서버가 건너뛴다(멱등)
export const addGroupMembers = async (
  groupId: number,
  userIds: number[],
): Promise<{ success: boolean; data: { added_count: number } }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/members`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_ids: userIds }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail || '멤버 추가에 실패했습니다')
  }

  return response.json()
}

// 그룹 탈퇴
export const leaveGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/leave`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 탈퇴에 실패했습니다')
  }

  return response.json()
}

// 그룹 멤버 목록 조회
export const fetchGroupMembers = async (
  groupId: number
): Promise<GroupMembersResponse> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/members`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error('멤버 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 그룹 수정 (관리자만) — 이름/설명/아이콘/테마/공개설정/기도시간
export const updateGroup = async (
  groupId: number,
  data: UpdateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '그룹 수정에 실패했습니다')
  return response.json()
}

// 그룹 삭제 (관리자만)
export const deleteGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '그룹 삭제에 실패했습니다')
  return response.json()
}

// 멤버 내보내기 (관리자만)
export const kickGroupMember = async (
  groupId: number,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiFetch(
    `${API_V1}/prayer-groups/${groupId}/members/${userId}`,
    { method: 'DELETE', headers: authHeaders() },
  )
  if (!response.ok) return throwDetail(response, '멤버 내보내기에 실패했습니다')
  return response.json()
}

// 관리자 권한 이양
export const transferGroupAdmin = async (
  groupId: number,
  newAdminUserId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await apiFetch(
    `${API_V1}/prayer-groups/${groupId}/transfer-admin`,
    {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ new_admin_user_id: newAdminUserId }),
    },
  )
  if (!response.ok) return throwDetail(response, '권한 이양에 실패했습니다')
  return response.json()
}

// 오늘의 그룹 체크인 (멱등) — 최신 다이제스트를 돌려준다
export const checkinGroup = async (
  groupId: number
): Promise<{ success: boolean; data: GroupDigest }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/checkin`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '체크인에 실패했습니다')
  return response.json()
}

// 이번 주 다이제스트
export const fetchGroupDigest = async (
  groupId: number
): Promise<{ success: boolean; data: GroupDigest }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/digest`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '다이제스트를 불러오는데 실패했습니다')
  return response.json()
}

// 그룹 둘러보기 — 공개·승인제 그룹 중 내가 안 들어간 방
export const fetchDiscoverGroups = async (): Promise<GroupListResponse> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/discover`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '그룹 둘러보기를 불러오는데 실패했습니다')
  return response.json()
}

// 공개 그룹 바로 가입
export const joinOpenGroup = async (
  groupId: number
): Promise<{ success: boolean; data: PrayerGroup }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/join-open`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '그룹 가입에 실패했습니다')
  return response.json()
}

// 승인제 그룹 가입 신청
export const requestJoinGroup = async (
  groupId: number,
  message?: string
): Promise<{ success: boolean; data: { status: string } }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/join-request`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ message: message || null }),
  })
  if (!response.ok) return throwDetail(response, '가입 신청에 실패했습니다')
  return response.json()
}

// 가입 신청 목록 (관리자만)
export const fetchJoinRequests = async (
  groupId: number
): Promise<{ success: boolean; data: { items: GroupJoinRequestItem[]; total: number } }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/join-requests`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '가입 신청 목록을 불러오는데 실패했습니다')
  return response.json()
}

// 가입 신청 승인/거절 (관리자만)
export const decideJoinRequest = async (
  groupId: number,
  requestId: number,
  approve: boolean
): Promise<{ success: boolean; data: { status: string } }> => {
  const response = await apiFetch(
    `${API_V1}/prayer-groups/${groupId}/join-requests/${requestId}/${approve ? 'approve' : 'reject'}`,
    { method: 'POST', headers: authHeaders() },
  )
  if (!response.ok) return throwDetail(response, '신청 처리에 실패했습니다')
  return response.json()
}

// 리더 케어 신호 — 2주 이상 소식 없는 멤버 (관리자 전용)
export const fetchGroupCare = async (
  groupId: number
): Promise<{ success: boolean; data: { items: GroupCareMember[]; total: number } }> => {
  const response = await apiFetch(`${API_V1}/prayer-groups/${groupId}/care`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '케어 정보를 불러오는데 실패했습니다')
  return response.json()
}
