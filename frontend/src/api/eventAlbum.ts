// 행사 앨범 API (새가족 앨범 API 미러링)
// 열람도 로그인 필수(초상권 보호) — 모든 요청에 Authorization 헤더를 싣는다.
import { API_V1 } from '../config/api'
import type {
  EventAlbumComment,
  EventAlbumCommentListResponse,
  EventAlbumListResponse,
  EventAlbumPost,
  EventAlbumPostUpdatePayload,
  EventAlbumStats,
  ReactionToggleResponse,
} from '../types/eventAlbum'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/event-albums`

/** data가 배열이든 {items}이든 포스트 배열로 정규화 */
const toPostArray = (data: unknown): EventAlbumPost[] => {
  if (Array.isArray(data)) return data as EventAlbumPost[]
  const items = (data as { items?: EventAlbumPost[] } | null)?.items
  return Array.isArray(items) ? items : []
}

// ── 조회 ─────────────────────────────────────────────
export interface EventAlbumListFilter {
  year?: number
  tag?: string
}

export const fetchEventAlbumPosts = async (
  page = 1,
  limit = 10,
  filter: EventAlbumListFilter = {},
): Promise<EventAlbumListResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filter.year) params.append('year', String(filter.year))
  if (filter.tag) params.append('tag', filter.tag)

  return request<EventAlbumListResponse>(`${BASE}?${params}`, { errorMessage: '행사 앨범을 불러오지 못했습니다' })
}

export const fetchEventAlbumStats = async (): Promise<EventAlbumStats> => {
  const body = await request<UntypedJson>(`${BASE}/stats`, { errorMessage: '통계를 불러오지 못했습니다' })
  return body.data
}

/** 과거 연도 같은 날짜(±7일) 회상 포스트 — 결과 없으면 빈 배열 */
export const fetchEventAlbumOnThisDay = async (): Promise<EventAlbumPost[]> => {
  const body = await request<UntypedJson>(`${BASE}/on-this-day`, { errorMessage: '회상 소식을 불러오지 못했습니다' })
  return toPostArray(body.data)
}

/** 일정에 연결된 포스트 목록 (/events/:id 상세 연동) */
export const fetchEventAlbumsByEvent = async (
  eventId: number,
): Promise<EventAlbumPost[]> => {
  const body = await request<UntypedJson>(`${BASE}/by-event/${eventId}`, { errorMessage: '행사 사진을 불러오지 못했습니다' })
  return toPostArray(body.data)
}

export const fetchEventAlbumPost = async (postId: number): Promise<EventAlbumPost> => {
  const body = await request<UntypedJson>(`${BASE}/${postId}`, { errorMessage: '행사 앨범을 불러오지 못했습니다' })
  return body.data
}

// ── 관리자 ────────────────────────────────────────────
export const createEventAlbumPost = async (payload: {
  title: string
  caption?: string
  eventDate: string
  tag: string
  eventId?: number
  files: Blob[]
}): Promise<EventAlbumPost> => {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.caption) formData.append('caption', payload.caption)
  formData.append('event_date', payload.eventDate)
  formData.append('tag', payload.tag)
  if (payload.eventId != null) formData.append('event_id', String(payload.eventId))
  payload.files.forEach((file, idx) => {
    formData.append('files', file, `event-album-${idx + 1}.jpg`)
  })

  // Content-Type은 브라우저가 boundary와 함께 자동 설정
  const body = await request<UntypedJson>(BASE, {
    method: 'POST',
    body: formData,
    errorMessage: '행사 앨범 등록에 실패했습니다',
  })
  return body.data
}

export const updateEventAlbumPost = async (
  postId: number,
  payload: EventAlbumPostUpdatePayload,
): Promise<EventAlbumPost> => {
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
 * 배열 첫 번째가 대표 사진이 된다. (새가족 앨범과 동일 패턴)
 */
export const syncEventAlbumPhotos = async (
  postId: number,
  order: string[],
  files: Blob[],
): Promise<EventAlbumPost> => {
  const formData = new FormData()
  formData.append('order', JSON.stringify(order))
  files.forEach((file, idx) => {
    formData.append('files', file, `event-album-${idx + 1}.jpg`)
  })

  const body = await request<UntypedJson>(`${BASE}/${postId}/photos`, {
    method: 'PUT',
    body: formData,
    errorMessage: '사진 수정에 실패했습니다',
  })
  return body.data
}

export const deleteEventAlbumPost = async (postId: number): Promise<void> => {
  await requestRaw(`${BASE}/${postId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}

// ── 리액션 ───────────────────────────────────────────
export const toggleEventAlbumReaction = async (
  postId: number,
  emoji: string,
): Promise<ReactionToggleResponse> => {
  return request<ReactionToggleResponse>(`${BASE}/${postId}/reaction`, {
    method: 'POST',
    json: { emoji },
    errorMessage: '반응 남기기에 실패했습니다',
  })
}

// ── 댓글 ─────────────────────────────────────────────
export const fetchEventAlbumComments = async (
  postId: number,
  page = 1,
  limit = 50,
): Promise<EventAlbumCommentListResponse> => {
  return request<EventAlbumCommentListResponse>(`${BASE}/${postId}/comments?page=${page}&limit=${limit}`, { errorMessage: '댓글을 불러오지 못했습니다' })
}

export const createEventAlbumComment = async (
  postId: number,
  content: string,
): Promise<{ message: string; data: EventAlbumComment }> => {
  return request<{ message: string; data: EventAlbumComment }>(`${BASE}/${postId}/comments`, {
    method: 'POST',
    json: { content },
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

export const updateEventAlbumComment = async (
  postId: number,
  commentId: number,
  content: string,
): Promise<{ message: string; data: EventAlbumComment }> => {
  return request<{ message: string; data: EventAlbumComment }>(`${BASE}/${postId}/comments/${commentId}`, {
    method: 'PUT',
    json: { content },
    errorMessage: '댓글 수정에 실패했습니다',
  })
}

export const deleteEventAlbumComment = async (
  postId: number,
  commentId: number,
): Promise<{ message: string }> => {
  return request<{ message: string }>(`${BASE}/${postId}/comments/${commentId}`, { method: 'DELETE', errorMessage: '댓글 삭제에 실패했습니다' })
}
