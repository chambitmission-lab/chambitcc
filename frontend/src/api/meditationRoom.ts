// 공동 묵상방 API 클라이언트
import { API_V1 } from '../config/api'
import type {
  RoomCreateRequest,
  RoomDayDetail,
  RoomDetail,
  RoomPost,
  RoomPostListResponse,
  RoomPostType,
  RoomPreview,
  RoomReactionKey,
  RoomReply,
  RoomSummary,
  RoomUpdateRequest,
  SplitPreview,
} from '../types/meditationRoom'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/meditation-rooms`

export const createRoom = async (payload: RoomCreateRequest): Promise<RoomDetail> => {
  return request<RoomDetail>(BASE, {
    method: 'POST',
    json: payload,
    errorMessage: '묵상방 만들기에 실패했습니다',
  })
}

export const listMyRooms = async (): Promise<RoomSummary[]> => {
  return request<RoomSummary[]>(BASE, { errorMessage: '묵상방 목록을 불러오지 못했습니다' })
}

export const previewRoom = async (inviteCode: string): Promise<RoomPreview> => {
  return request<RoomPreview>(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, { errorMessage: '유효하지 않은 초대 링크입니다' })
}

export const joinRoom = async (inviteCode: string): Promise<RoomDetail> => {
  return request<RoomDetail>(`${BASE}/join`, {
    method: 'POST',
    json: { invite_code: inviteCode },
    errorMessage: '묵상방 참여에 실패했습니다',
  })
}

export const getRoom = async (roomId: number): Promise<RoomDetail> => {
  return request<RoomDetail>(`${BASE}/${roomId}`, { errorMessage: '묵상방을 불러오지 못했습니다' })
}

export const addRoomMembers = async (
  roomId: number,
  userIds: number[],
): Promise<{ added_count: number }> => {
  return request<{ added_count: number }>(`${BASE}/${roomId}/members`, {
    method: 'POST',
    json: { user_ids: userIds },
    errorMessage: '멤버 초대에 실패했습니다',
  })
}

export const leaveRoom = async (roomId: number): Promise<void> => {
  await requestRaw(`${BASE}/${roomId}/leave`, { method: 'DELETE', errorMessage: '나가기에 실패했습니다' })
}

export const markRoomDayRead = async (
  roomId: number,
  dayNumber: number,
): Promise<{ day_number: number; read_by_me: boolean; read_count: number }> => {
  return request<{ day_number: number; read_by_me: boolean; read_count: number }>(`${BASE}/${roomId}/days/${dayNumber}/read`, { method: 'POST', errorMessage: '읽음 처리에 실패했습니다' })
}

export const listRoomPosts = async (
  roomId: number,
  dayNumber?: number,
): Promise<RoomPostListResponse> => {
  const qs = dayNumber != null ? `?day_number=${dayNumber}` : ''
  return request<RoomPostListResponse>(`${BASE}/${roomId}/posts${qs}`, { errorMessage: '묵상 피드를 불러오지 못했습니다' })
}

export const createRoomPost = async (
  roomId: number,
  dayNumber: number,
  postType: RoomPostType,
  content: string,
): Promise<RoomPost> => {
  return request<RoomPost>(`${BASE}/${roomId}/posts`, {
    method: 'POST',
    json: { day_number: dayNumber, post_type: postType, content },
    errorMessage: '글 작성에 실패했습니다',
  })
}

export const deleteRoomPost = async (roomId: number, postId: number): Promise<void> => {
  await requestRaw(`${BASE}/${roomId}/posts/${postId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}

export const toggleRoomPostLike = async (
  roomId: number,
  postId: number,
): Promise<{ liked: boolean; like_count: number }> => {
  return request<{ liked: boolean; like_count: number }>(`${BASE}/${roomId}/posts/${postId}/like`, { method: 'POST', errorMessage: '좋아요에 실패했습니다' })
}

export const listRoomReplies = async (
  roomId: number,
  postId: number,
): Promise<RoomReply[]> => {
  return request<RoomReply[]>(`${BASE}/${roomId}/posts/${postId}/replies`, { errorMessage: '댓글을 불러오지 못했습니다' })
}

export const createRoomReply = async (
  roomId: number,
  postId: number,
  content: string,
): Promise<RoomReply> => {
  return request<RoomReply>(`${BASE}/${roomId}/posts/${postId}/replies`, {
    method: 'POST',
    json: { content },
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

export const deleteRoomReply = async (
  roomId: number,
  postId: number,
  replyId: number,
): Promise<void> => {
  await requestRaw(`${BASE}/${roomId}/posts/${postId}/replies/${replyId}`, { method: 'DELETE', errorMessage: '댓글 삭제에 실패했습니다' })
}

// ── 업그레이드: 분량 미리보기 · 설정 · 일차 상세 · 반응 · 머문 절 · 콕 찌르기 ──

export const getSplitPreview = async (params: {
  book_number: number
  chapter_start: number
  chapter_end: number
  total_days: number
}): Promise<SplitPreview> => {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString()
  return request<SplitPreview>(`${BASE}/split-preview?${qs}`, { errorMessage: '분량 미리보기를 불러오지 못했습니다' })
}

export const updateRoom = async (
  roomId: number,
  payload: RoomUpdateRequest,
): Promise<RoomDetail> => {
  return request<RoomDetail>(`${BASE}/${roomId}`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '방 설정을 저장하지 못했습니다',
  })
}

export const getRoomDay = async (roomId: number, dayNumber: number): Promise<RoomDayDetail> => {
  return request<RoomDayDetail>(`${BASE}/${roomId}/days/${dayNumber}`, { errorMessage: '일차 정보를 불러오지 못했습니다' })
}

export const setRoomDayReaction = async (
  roomId: number,
  dayNumber: number,
  reaction: RoomReactionKey | null,
): Promise<RoomDayDetail> => {
  return request<RoomDayDetail>(`${BASE}/${roomId}/days/${dayNumber}/reaction`, {
    method: 'PUT',
    json: { reaction },
    errorMessage: '반응을 남기지 못했습니다',
  })
}

export const toggleRoomVerseMark = async (
  roomId: number,
  dayNumber: number,
  verse: { book_number: number; chapter: number; verse: number },
): Promise<{ marked: boolean; count: number }> => {
  return request<{ marked: boolean; count: number }>(`${BASE}/${roomId}/days/${dayNumber}/verse-marks`, {
    method: 'POST',
    json: verse,
    errorMessage: '표시하지 못했습니다',
  })
}

export const nudgeRoomDay = async (
  roomId: number,
  dayNumber: number,
): Promise<{ sent_count: number }> => {
  return request<{ sent_count: number }>(`${BASE}/${roomId}/days/${dayNumber}/nudge`, { method: 'POST', errorMessage: '콕 찌르기에 실패했습니다' })
}
