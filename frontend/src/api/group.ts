// Prayer Group API (Mock - 백엔드 준비 중)
import type { 
  PrayerGroup, 
  GroupListResponse,
  CreateGroupRequest,
  JoinGroupRequest,
  GroupMembersResponse
} from '../types/prayer'

// Mock 데이터
const mockGroups: PrayerGroup[] = [
  {
    id: 1,
    name: '청년부',
    description: '청년부 기도 나눔방',
    icon: '🙏',
    member_count: 24,
    prayer_count: 156,
    is_member: true,
    is_admin: false,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    name: '찬양팀',
    description: '찬양 사역을 위한 기도',
    icon: '🎵',
    member_count: 12,
    prayer_count: 89,
    is_member: true,
    is_admin: true,
    created_at: '2024-02-01T00:00:00Z',
    invite_code: 'PRAISE2024',
  },
  {
    id: 3,
    name: '셀 모임 A',
    description: '매주 수요일 셀 모임',
    icon: '⛪',
    member_count: 8,
    prayer_count: 45,
    is_member: false,
    is_admin: false,
    created_at: '2024-01-20T00:00:00Z',
  },
]

// 내가 속한 그룹 목록 조회
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const myGroups = mockGroups.filter(g => g.is_member)
  
  return {
    success: true,
    data: {
      items: myGroups,
      total: myGroups.length,
    },
  }
}

// 전체 그룹 목록 조회 (검색/탐색용)
export const fetchAllGroups = async (): Promise<GroupListResponse> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return {
    success: true,
    data: {
      items: mockGroups,
      total: mockGroups.length,
    },
  }
}

// 그룹 생성
export const createGroup = async (
  data: CreateGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const newGroup: PrayerGroup = {
    id: Date.now(),
    name: data.name,
    description: data.description,
    icon: data.icon || '👥',
    member_count: 1,
    prayer_count: 0,
    is_member: true,
    is_admin: true,
    created_at: new Date().toISOString(),
    invite_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
  }
  
  mockGroups.push(newGroup)
  
  return {
    success: true,
    data: newGroup,
  }
}

// 그룹 가입 (초대 코드)
export const joinGroup = async (
  data: JoinGroupRequest
): Promise<{ success: boolean; data: PrayerGroup }> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const group = mockGroups.find(g => g.invite_code === data.invite_code)
  
  if (!group) {
    throw new Error('유효하지 않은 초대 코드입니다')
  }
  
  if (group.is_member) {
    throw new Error('이미 가입된 그룹입니다')
  }
  
  // 가입 처리
  group.is_member = true
  group.member_count += 1
  
  return {
    success: true,
    data: group,
  }
}

// 그룹 탈퇴
export const leaveGroup = async (
  groupId: number
): Promise<{ success: boolean; message: string }> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const group = mockGroups.find(g => g.id === groupId)
  
  if (!group) {
    throw new Error('그룹을 찾을 수 없습니다')
  }
  
  if (group.is_admin) {
    throw new Error('관리자는 그룹을 탈퇴할 수 없습니다')
  }
  
  group.is_member = false
  group.member_count -= 1
  
  return {
    success: true,
    message: '그룹에서 탈퇴했습니다',
  }
}

// 그룹 멤버 목록 조회
export const fetchGroupMembers = async (
  _groupId: number
): Promise<GroupMembersResponse> => {
  // TODO: 백엔드 API 연결
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock 데이터
  return {
    success: true,
    data: {
      items: [
        {
          id: 1,
          username: 'user1',
          display_name: '김성도',
          is_admin: true,
          joined_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          username: 'user2',
          display_name: '이믿음',
          is_admin: false,
          joined_at: '2024-01-16T00:00:00Z',
        },
      ],
      total: 2,
    },
  }
}
