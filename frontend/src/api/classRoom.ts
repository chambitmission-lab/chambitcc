// 우리반 알림장 API 클라이언트
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  CheckStatus,
  ClassComment,
  ClassCreateRequest,
  ClassDetail,
  ClassMember,
  ClassPost,
  ClassPostCreateRequest,
  ClassPostListResponse,
  ClassPostType,
  ClassPreview,
  ClassSummary,
  EventBlock,
  RecitationRow,
  RsvpDetail,
  RsvpStatus,
} from '../types/classRoom'

const BASE = `${API_V1}/school-classes`

const parseError = async (response: Response, fallback: string): Promise<never> => {
  const error = await response.json().catch(() => ({}))
  throw new Error(error.detail || fallback)
}

export const createClass = async (payload: ClassCreateRequest): Promise<ClassDetail> => {
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return parseError(response, '반 만들기에 실패했습니다')
  return response.json()
}

export const listMyClasses = async (): Promise<ClassSummary[]> => {
  const response = await apiFetch(BASE, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '반 목록을 불러오지 못했습니다')
  return response.json()
}

export const previewClass = async (inviteCode: string): Promise<ClassPreview> => {
  const response = await apiFetch(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '유효하지 않은 초대 링크입니다')
  return response.json()
}

export const joinClass = async (
  inviteCode: string,
  childName?: string,
): Promise<ClassDetail> => {
  const response = await apiFetch(`${BASE}/join`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ invite_code: inviteCode, child_name: childName || null }),
  })
  if (!response.ok) return parseError(response, '반 참여에 실패했습니다')
  return response.json()
}

export const getClass = async (classId: number): Promise<ClassDetail> => {
  const response = await apiFetch(`${BASE}/${classId}`, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '반을 불러오지 못했습니다')
  return response.json()
}

export const updateClass = async (
  classId: number,
  payload: Partial<ClassCreateRequest>,
): Promise<ClassDetail> => {
  const response = await apiFetch(`${BASE}/${classId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return parseError(response, '반 정보 수정에 실패했습니다')
  return response.json()
}

export const leaveClass = async (classId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${classId}/leave`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    return parseError(response, '나가기에 실패했습니다')
  }
}

export const updateMyChildName = async (
  classId: number,
  childName: string,
): Promise<ClassMember> => {
  const response = await apiFetch(`${BASE}/${classId}/members/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ child_name: childName }),
  })
  if (!response.ok) return parseError(response, '자녀 이름 수정에 실패했습니다')
  return response.json()
}

export const setMemberTeacher = async (
  classId: number,
  userId: number,
  isTeacher: boolean,
): Promise<ClassMember> => {
  const response = await apiFetch(`${BASE}/${classId}/members/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ is_teacher: isTeacher }),
  })
  if (!response.ok) return parseError(response, '역할 변경에 실패했습니다')
  return response.json()
}

export const listClassPosts = async (
  classId: number,
  postType?: ClassPostType,
  offset = 0,
  limit = 20,
): Promise<ClassPostListResponse> => {
  const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  if (postType) qs.set('post_type', postType)
  const response = await apiFetch(`${BASE}/${classId}/posts?${qs}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '알림장을 불러오지 못했습니다')
  return response.json()
}

export const createClassPost = async (
  classId: number,
  payload: ClassPostCreateRequest,
  files: File[] = [],
): Promise<ClassPost> => {
  const form = new FormData()
  form.append('payload', JSON.stringify(payload))
  files.forEach((f) => form.append('files', f))
  // FormData는 Content-Type을 브라우저가 boundary와 함께 넣도록 지정하지 않는다
  const response = await apiFetch(`${BASE}/${classId}/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  })
  if (!response.ok) return parseError(response, '알림 작성에 실패했습니다')
  return response.json()
}

export const updateClassPost = async (
  classId: number,
  postId: number,
  payload: { title?: string | null; content?: string; is_pinned?: boolean },
): Promise<ClassPost> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return parseError(response, '알림 수정에 실패했습니다')
  return response.json()
}

export const deleteClassPost = async (classId: number, postId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    return parseError(response, '삭제에 실패했습니다')
  }
}

export const toggleClassPostCheck = async (
  classId: number,
  postId: number,
): Promise<{ checked: boolean; check_count: number }> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/check`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '확인 처리에 실패했습니다')
  return response.json()
}

export const getClassPostChecks = async (
  classId: number,
  postId: number,
): Promise<CheckStatus> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/checks`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '확인 현황을 불러오지 못했습니다')
  return response.json()
}

export const toggleClassPostRecite = async (
  classId: number,
  postId: number,
): Promise<{ recited: boolean; recite_count: number }> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/recite`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '암송 체크에 실패했습니다')
  return response.json()
}

export const listClassPostRecitations = async (
  classId: number,
  postId: number,
): Promise<RecitationRow[]> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/recitations`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '암송 현황을 불러오지 못했습니다')
  return response.json()
}

export const setClassPostRsvp = async (
  classId: number,
  postId: number,
  status: RsvpStatus,
): Promise<EventBlock> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/rsvp`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ status }),
  })
  if (!response.ok) return parseError(response, '참석 응답에 실패했습니다')
  return response.json()
}

export const cancelClassPostRsvp = async (
  classId: number,
  postId: number,
): Promise<EventBlock> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/rsvp`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '참석 취소에 실패했습니다')
  return response.json()
}

export const getClassPostRsvps = async (
  classId: number,
  postId: number,
): Promise<RsvpDetail> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/rsvps`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '참석 현황을 불러오지 못했습니다')
  return response.json()
}

export const listClassPostComments = async (
  classId: number,
  postId: number,
): Promise<ClassComment[]> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/comments`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '댓글을 불러오지 못했습니다')
  return response.json()
}

export const createClassPostComment = async (
  classId: number,
  postId: number,
  content: string,
): Promise<ClassComment> => {
  const response = await apiFetch(`${BASE}/${classId}/posts/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ content }),
  })
  if (!response.ok) return parseError(response, '댓글 작성에 실패했습니다')
  return response.json()
}

export const updateClassPostComment = async (
  classId: number,
  postId: number,
  commentId: number,
  content: string,
): Promise<ClassComment> => {
  const response = await apiFetch(
    `${BASE}/${classId}/posts/${postId}/comments/${commentId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ content }),
    },
  )
  if (!response.ok) return parseError(response, '댓글 수정에 실패했습니다')
  return response.json()
}

export const deleteClassPostComment = async (
  classId: number,
  postId: number,
  commentId: number,
): Promise<void> => {
  const response = await apiFetch(
    `${BASE}/${classId}/posts/${postId}/comments/${commentId}`,
    { method: 'DELETE', headers: getAuthHeaders() },
  )
  if (!response.ok && response.status !== 204) {
    return parseError(response, '댓글 삭제에 실패했습니다')
  }
}
