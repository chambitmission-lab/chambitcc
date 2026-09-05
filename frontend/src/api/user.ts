import { request, requestRaw } from './utils/request'

/** 가입 승인 상태 — is_active(운영 중 정지)와는 별개의 축 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  username: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
  approval_status: ApprovalStatus
  approved_at?: string | null
  created_at: string
  last_login?: string
}

/** 관리자만 볼 수 있는 전역 운영 설정 */
export interface AdminSettings {
  require_signup_approval: boolean
  /** 기도 묵상 구절 추천 모드 — ai: AI 우선(실패 시 관리자 구절 폴백) / admin: 항상 관리자 구절 */
  verse_recommendation_mode: 'ai' | 'admin'
}

export interface UsersResponse {
  users: User[]
}

export interface UpdateUserRoleRequest {
  is_admin: boolean
}

export interface UpdateUserStatusRequest {
  is_active: boolean
}

// 회원 목록 조회
export const getUserList = async (): Promise<UsersResponse> => {
  return request<UsersResponse>('/admin/users', { auth: 'required', errorMessage: '회원 목록을 불러오는데 실패했습니다' })
}

// 회원 권한 변경
export const updateUserRole = async (
  userId: number,
  isAdmin: boolean
): Promise<void> => {
  await requestRaw(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    auth: 'required',
    json: { is_admin: isAdmin },
    errorMessage: '권한 변경에 실패했습니다',
  })
}

// 회원 상태 변경
export const updateUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<void> => {
  await requestRaw(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    auth: 'required',
    json: { is_active: isActive },
    errorMessage: '상태 변경에 실패했습니다',
  })
}

// 회원 가입 승인 / 거절
// 거절해도 계정은 rejected로 남는다 (재승인 가능, 같은 아이디 재가입 차단)
export const updateUserApproval = async (
  userId: number,
  approve: boolean
): Promise<void> => {
  await requestRaw(`/admin/users/${userId}/approval`, {
    method: 'PATCH',
    auth: 'required',
    json: { approve },
    errorMessage: '승인 처리에 실패했습니다',
  })
}

// 회원 비밀번호 초기화 (임시 비밀번호로 재설정)
// 반환된 temp_password를 회원에게 알려주면, 회원이 로그인 후 직접 변경한다
export const resetUserPassword = async (
  userId: number
): Promise<{ message: string; temp_password: string }> => {
  return request<{ message: string; temp_password: string }>(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '비밀번호 초기화에 실패했습니다',
  })
}

// 전역 운영 설정 조회
export const getAdminSettings = async (): Promise<AdminSettings> => {
  return request<AdminSettings>('/admin/settings', { auth: 'required', errorMessage: '설정을 불러오는데 실패했습니다' })
}

// 전역 운영 설정 변경 (보낸 항목만 반영)
export const updateAdminSettings = async (
  patch: Partial<AdminSettings>
): Promise<AdminSettings> => {
  return request<AdminSettings>('/admin/settings', {
    method: 'PATCH',
    auth: 'required',
    json: patch,
    errorMessage: '설정 변경에 실패했습니다',
  })
}
