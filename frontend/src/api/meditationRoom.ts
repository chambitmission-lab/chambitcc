// 공동 묵상방 API 클라이언트
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  RoomCreateRequest,
  RoomDetail,
  RoomPost,
  RoomPostListResponse,
  RoomPostType,
  RoomPreview,
  RoomReply,
  RoomSummary,
} from '../types/meditationRoom'

const BASE = `${API_V1}/meditation-rooms`

const parseError = async (response: Response, fallback: string): Promise<never> => {
  const error = await response.json().catch(() => ({}))
  throw new Error(error.detail || fallback)
}

export const createRoom = async (payload: RoomCreateRequest): Promise<RoomDetail> => {
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) return parseError(response, '묵상방 만들기에 실패했습니다')
  return response.json()
}

export const listMyRooms = async (): Promise<RoomSummary[]> => {
  const response = await apiFetch(BASE, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '묵상방 목록을 불러오지 못했습니다')
  return response.json()
}

export const previewRoom = async (inviteCode: string): Promise<RoomPreview> => {
  const response = await apiFetch(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '유효하지 않은 초대 링크입니다')
  return response.json()
}

export const joinRoom = async (inviteCode: string): Promise<RoomDetail> => {
  const response = await apiFetch(`${BASE}/join`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ invite_code: inviteCode }),
  })
  if (!response.ok) return parseError(response, '묵상방 참여에 실패했습니다')
  return response.json()
}

export const getRoom = async (roomId: number): Promise<RoomDetail> => {
  const response = await apiFetch(`${BASE}/${roomId}`, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '묵상방을 불러오지 못했습니다')
  return response.json()
}

export const leaveRoom = async (roomId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${roomId}/leave`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    return parseError(response, '나가기에 실패했습니다')
  }
}

export const listRoomPosts = async (
  roomId: number,
  dayNumber?: number,
): Promise<RoomPostListResponse> => {
  const qs = dayNumber != null ? `?day_number=${dayNumber}` : ''
  const response = await apiFetch(`${BASE}/${roomId}/posts${qs}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '묵상 피드를 불러오지 못했습니다')
  return response.json()
}

export const createRoomPost = async (
  roomId: number,
  dayNumber: number,
  postType: RoomPostType,
  content: string,
): Promise<RoomPost> => {
  const response = await apiFetch(`${BASE}/${roomId}/posts`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ day_number: dayNumber, post_type: postType, content }),
  })
  if (!response.ok) return parseError(response, '글 작성에 실패했습니다')
  return response.json()
}

export const deleteRoomPost = async (roomId: number, postId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${roomId}/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    return parseError(response, '삭제에 실패했습니다')
  }
}

export const toggleRoomPostLike = async (
  roomId: number,
  postId: number,
): Promise<{ liked: boolean; like_count: number }> => {
  const response = await apiFetch(`${BASE}/${roomId}/posts/${postId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '좋아요에 실패했습니다')
  return response.json()
}

export const listRoomReplies = async (
  roomId: number,
  postId: number,
): Promise<RoomReply[]> => {
  const response = await apiFetch(`${BASE}/${roomId}/posts/${postId}/replies`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '댓글을 불러오지 못했습니다')
  return response.json()
}

export const createRoomReply = async (
  roomId: number,
  postId: number,
  content: string,
): Promise<RoomReply> => {
  const response = await apiFetch(`${BASE}/${roomId}/posts/${postId}/replies`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ content }),
  })
  if (!response.ok) return parseError(response, '댓글 작성에 실패했습니다')
  return response.json()
}

export const deleteRoomReply = async (
  roomId: number,
  postId: number,
  replyId: number,
): Promise<void> => {
  const response = await apiFetch(
    `${BASE}/${roomId}/posts/${postId}/replies/${replyId}`,
    { method: 'DELETE', headers: getAuthHeaders() },
  )
  if (!response.ok && response.status !== 204) {
    return parseError(response, '댓글 삭제에 실패했습니다')
  }
}
