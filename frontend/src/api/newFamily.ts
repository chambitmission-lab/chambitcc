// 새가족 등록 앨범 API
// 열람도 로그인 필수(초상권 보호) — 모든 요청에 Authorization 헤더를 싣는다.
import { API_V1, apiFetch } from '../config/api'
import type {
  NewFamilyComment,
  NewFamilyCommentListResponse,
  NewFamilyListResponse,
  NewFamilyPost,
  NewFamilyPostUpdatePayload,
  NewFamilyStats,
  WelcomeToggleResponse,
} from '../types/newFamily'

const BASE = `${API_V1}/new-family`

const authHeaders = (json = true): Record<string, string> => {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

const unwrap = async (response: Response, fallback: string) => {
  if (!response.ok) {
    let detail = fallback
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : fallback
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 */
    }
    throw new Error(detail)
  }
  return response.json()
}

// ── 조회 ─────────────────────────────────────────────
export const fetchNewFamilyPosts = async (
  page = 1,
  limit = 10,
): Promise<NewFamilyListResponse> => {
  const response = await apiFetch(`${BASE}?page=${page}&limit=${limit}`, {
    headers: authHeaders(false),
  })
  return unwrap(response, '새가족 소식을 불러오지 못했습니다')
}

export const fetchNewFamilyStats = async (): Promise<NewFamilyStats> => {
  const response = await apiFetch(`${BASE}/stats`, { headers: authHeaders(false) })
  const body = await unwrap(response, '통계를 불러오지 못했습니다')
  return body.data
}

export const fetchNewFamilyPost = async (postId: number): Promise<NewFamilyPost> => {
  const response = await apiFetch(`${BASE}/${postId}`, { headers: authHeaders(false) })
  const body = await unwrap(response, '새가족 소식을 불러오지 못했습니다')
  return body.data
}

// ── 관리자 ────────────────────────────────────────────
export const createNewFamilyPost = async (payload: {
  memberName: string
  registeredAt: string
  groupName?: string
  greeting?: string
  isPublished: boolean
  consentConfirmed: boolean
  files: Blob[]
}): Promise<NewFamilyPost> => {
  const formData = new FormData()
  formData.append('member_name', payload.memberName)
  formData.append('registered_at', payload.registeredAt)
  if (payload.groupName) formData.append('group_name', payload.groupName)
  if (payload.greeting) formData.append('greeting', payload.greeting)
  formData.append('is_published', String(payload.isPublished))
  formData.append('consent_confirmed', String(payload.consentConfirmed))
  payload.files.forEach((file, idx) => {
    formData.append('files', file, `new-family-${idx + 1}.jpg`)
  })

  // Content-Type은 브라우저가 boundary와 함께 자동 설정
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: authHeaders(false),
    body: formData,
  })
  const body = await unwrap(response, '새가족 소식 등록에 실패했습니다')
  return body.data
}

export const updateNewFamilyPost = async (
  postId: number,
  payload: NewFamilyPostUpdatePayload,
): Promise<NewFamilyPost> => {
  const response = await apiFetch(`${BASE}/${postId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const body = await unwrap(response, '수정에 실패했습니다')
  return body.data
}

/**
 * 사진 추가·삭제·순서를 한 번에 반영.
 * order 배열의 원소는 유지할 기존 사진 id 또는 files 인덱스를 가리키는 'new:N'.
 * 배열 첫 번째가 대표 사진이 된다.
 */
export const syncNewFamilyPhotos = async (
  postId: number,
  order: string[],
  files: Blob[],
): Promise<NewFamilyPost> => {
  const formData = new FormData()
  formData.append('order', JSON.stringify(order))
  files.forEach((file, idx) => {
    formData.append('files', file, `new-family-${idx + 1}.jpg`)
  })

  const response = await apiFetch(`${BASE}/${postId}/photos`, {
    method: 'PUT',
    headers: authHeaders(false),
    body: formData,
  })
  const body = await unwrap(response, '사진 수정에 실패했습니다')
  return body.data
}

export const deleteNewFamilyPost = async (postId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  })
  await unwrap(response, '삭제에 실패했습니다')
}

// ── 환영 리액션 ───────────────────────────────────────
export const toggleWelcome = async (
  postId: number,
  emoji: string,
): Promise<WelcomeToggleResponse> => {
  const response = await apiFetch(`${BASE}/${postId}/welcome`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ emoji }),
  })
  return unwrap(response, '환영 표시에 실패했습니다')
}

// ── 댓글 ─────────────────────────────────────────────
export const fetchNewFamilyComments = async (
  postId: number,
  page = 1,
  limit = 50,
): Promise<NewFamilyCommentListResponse> => {
  const response = await apiFetch(
    `${BASE}/${postId}/comments?page=${page}&limit=${limit}`,
    { headers: authHeaders(false) },
  )
  return unwrap(response, '댓글을 불러오지 못했습니다')
}

export const createNewFamilyComment = async (
  postId: number,
  content: string,
): Promise<{ message: string; data: NewFamilyComment }> => {
  const response = await apiFetch(`${BASE}/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  })
  return unwrap(response, '댓글 작성에 실패했습니다')
}

export const updateNewFamilyComment = async (
  postId: number,
  commentId: number,
  content: string,
): Promise<{ message: string; data: NewFamilyComment }> => {
  const response = await apiFetch(`${BASE}/${postId}/comments/${commentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  })
  return unwrap(response, '댓글 수정에 실패했습니다')
}

export const deleteNewFamilyComment = async (
  postId: number,
  commentId: number,
): Promise<{ message: string }> => {
  const response = await apiFetch(`${BASE}/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  })
  return unwrap(response, '댓글 삭제에 실패했습니다')
}
