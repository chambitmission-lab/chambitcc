// 새가족 등록 앨범 API
// 열람도 로그인 필수(초상권 보호) — 모든 요청에 Authorization 헤더를 싣는다.
import { API_V1 } from '../config/api'
import type {
  NewFamilyComment,
  NewFamilyCommentListResponse,
  NewFamilyListResponse,
  NewFamilyPost,
  NewFamilyPostUpdatePayload,
  NewFamilyStats,
  WelcomeToggleResponse,
} from '../types/newFamily'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/new-family`

// ── 조회 ─────────────────────────────────────────────
export const fetchNewFamilyPosts = async (
  page = 1,
  limit = 10,
): Promise<NewFamilyListResponse> => {
  return request<NewFamilyListResponse>(`${BASE}?page=${page}&limit=${limit}`, { errorMessage: '새가족 소식을 불러오지 못했습니다' })
}

export const fetchNewFamilyStats = async (): Promise<NewFamilyStats> => {
  const body = await request<UntypedJson>(`${BASE}/stats`, { errorMessage: '통계를 불러오지 못했습니다' })
  return body.data
}

export const fetchNewFamilyPost = async (postId: number): Promise<NewFamilyPost> => {
  const body = await request<UntypedJson>(`${BASE}/${postId}`, { errorMessage: '새가족 소식을 불러오지 못했습니다' })
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
  const body = await request<UntypedJson>(BASE, {
    method: 'POST',
    body: formData,
    errorMessage: '새가족 소식 등록에 실패했습니다',
  })
  return body.data
}

export const updateNewFamilyPost = async (
  postId: number,
  payload: NewFamilyPostUpdatePayload,
): Promise<NewFamilyPost> => {
  const body = await request<UntypedJson>(`${BASE}/${postId}`, {
    method: 'PUT',
    json: payload,
    errorMessage: '수정에 실패했습니다',
  })
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

  const body = await request<UntypedJson>(`${BASE}/${postId}/photos`, {
    method: 'PUT',
    body: formData,
    errorMessage: '사진 수정에 실패했습니다',
  })
  return body.data
}

export const deleteNewFamilyPost = async (postId: number): Promise<void> => {
  await requestRaw(`${BASE}/${postId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}

// ── 환영 리액션 ───────────────────────────────────────
export const toggleWelcome = async (
  postId: number,
  emoji: string,
): Promise<WelcomeToggleResponse> => {
  return request<WelcomeToggleResponse>(`${BASE}/${postId}/welcome`, {
    method: 'POST',
    json: { emoji },
    errorMessage: '환영 표시에 실패했습니다',
  })
}

// ── 댓글 ─────────────────────────────────────────────
export const fetchNewFamilyComments = async (
  postId: number,
  page = 1,
  limit = 50,
): Promise<NewFamilyCommentListResponse> => {
  return request<NewFamilyCommentListResponse>(`${BASE}/${postId}/comments?page=${page}&limit=${limit}`, { errorMessage: '댓글을 불러오지 못했습니다' })
}

export const createNewFamilyComment = async (
  postId: number,
  content: string,
): Promise<{ message: string; data: NewFamilyComment }> => {
  return request<{ message: string; data: NewFamilyComment }>(`${BASE}/${postId}/comments`, {
    method: 'POST',
    json: { content },
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

export const updateNewFamilyComment = async (
  postId: number,
  commentId: number,
  content: string,
): Promise<{ message: string; data: NewFamilyComment }> => {
  return request<{ message: string; data: NewFamilyComment }>(`${BASE}/${postId}/comments/${commentId}`, {
    method: 'PUT',
    json: { content },
    errorMessage: '댓글 수정에 실패했습니다',
  })
}

export const deleteNewFamilyComment = async (
  postId: number,
  commentId: number,
): Promise<{ message: string }> => {
  return request<{ message: string }>(`${BASE}/${postId}/comments/${commentId}`, { method: 'DELETE', errorMessage: '댓글 삭제에 실패했습니다' })
}
