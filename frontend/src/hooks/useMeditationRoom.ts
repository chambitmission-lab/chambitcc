import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addRoomMembers,
  createRoom,
  createRoomPost,
  createRoomReply,
  deleteRoomPost,
  deleteRoomReply,
  getRoom,
  getRoomDay,
  getSplitPreview,
  joinRoom,
  leaveRoom,
  listMyRooms,
  listRoomPosts,
  listRoomReplies,
  markRoomDayRead,
  nudgeRoomDay,
  previewRoom,
  setRoomDayReaction,
  toggleRoomPostLike,
  toggleRoomVerseMark,
  updateRoom,
} from '../api/meditationRoom'
import type {
  RoomCreateRequest,
  RoomPostType,
  RoomReactionKey,
  RoomUpdateRequest,
} from '../types/meditationRoom'

export const roomKeys = {
  all: ['meditationRoom'] as const,
  list: () => [...roomKeys.all, 'list'] as const,
  detail: (id: number) => [...roomKeys.all, 'detail', id] as const,
  preview: (code: string) => [...roomKeys.all, 'preview', code] as const,
  posts: (id: number, day?: number) => [...roomKeys.all, 'posts', id, day ?? 'all'] as const,
  replies: (roomId: number, postId: number) =>
    [...roomKeys.all, 'replies', roomId, postId] as const,
  day: (roomId: number, day: number) => [...roomKeys.all, 'day', roomId, day] as const,
  split: (p: { book_number: number; chapter_start: number; chapter_end: number; total_days: number }) =>
    [...roomKeys.all, 'split', p.book_number, p.chapter_start, p.chapter_end, p.total_days] as const,
}

export const useMyRooms = (enabled = true) =>
  useQuery({
    queryKey: roomKeys.list(),
    queryFn: listMyRooms,
    enabled,
    staleTime: 1000 * 60,
    // 읽음·완주 등 사용자별 상태가 담긴 목록 — 전역 refetchOnMount:false의 예외.
    // persist 복원 쿼리는 refetchType:'all' 무효화로도 재요청되지 않으므로 마운트 시 갱신
    // (캐시는 즉시 보여주고 뒤에서 갱신).
    refetchOnMount: true,
  })

export const useRoom = (roomId: number, enabled = true) =>
  useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => getRoom(roomId),
    enabled: enabled && roomId > 0,
    staleTime: 1000 * 30,
    // 목록과 같은 이유 — 여러 명이 같은 방을 보므로 재진입 시 읽음 수/글 수를 갱신
    refetchOnMount: true,
  })

export const useRoomPreview = (inviteCode: string) =>
  useQuery({
    queryKey: roomKeys.preview(inviteCode),
    queryFn: () => previewRoom(inviteCode),
    enabled: inviteCode.length >= 4,
    retry: false,
  })

export const useRoomPosts = (roomId: number, dayNumber?: number, enabled = true) =>
  useQuery({
    queryKey: roomKeys.posts(roomId, dayNumber),
    queryFn: () => listRoomPosts(roomId, dayNumber),
    enabled: enabled && roomId > 0,
    // 같은 방을 여러 명이 보는 실시간성 — 포커스 복귀·재진입 시 재조회
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 15,
  })

export const useRoomReplies = (roomId: number, postId: number, enabled = true) =>
  useQuery({
    queryKey: roomKeys.replies(roomId, postId),
    queryFn: () => listRoomReplies(roomId, postId),
    enabled: enabled && postId > 0,
  })

export const useCreateRoom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RoomCreateRequest) => createRoom(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all, refetchType: 'all' }),
  })
}

export const useJoinRoom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => joinRoom(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all, refetchType: 'all' }),
  })
}

export const useAddRoomMembers = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userIds: number[]) => addRoomMembers(roomId, userIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: roomKeys.list(), refetchType: 'all' })
    },
  })
}

export const useLeaveRoom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roomId: number) => leaveRoom(roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all, refetchType: 'all' }),
  })
}

export const useMarkRoomDayRead = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dayNumber: number) => markRoomDayRead(roomId, dayNumber),
    onSuccess: () => {
      // '본문 읽기'는 누르자마자 성경 화면으로 이동해 응답 시점엔 detail/list가 비활성 —
      // 기본 'active'로는 stale 마크만 되고 전역 refetchOnMount:false와 겹치면
      // /rooms 재진입 시에도 옛 캐시(읽기 전 상태)가 그대로 보인다
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: roomKeys.list(), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: [...roomKeys.all, 'day', roomId] })
    },
  })
}

export const useCreateRoomPost = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      dayNumber,
      postType,
      content,
    }: {
      dayNumber: number
      postType: RoomPostType
      content: string
    }) => createRoomPost(roomId, dayNumber, postType, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...roomKeys.all, 'posts', roomId] })
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) })
    },
  })
}

export const useDeleteRoomPost = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => deleteRoomPost(roomId, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...roomKeys.all, 'posts', roomId] })
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) })
    },
  })
}

export const useToggleRoomPostLike = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => toggleRoomPostLike(roomId, postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...roomKeys.all, 'posts', roomId] }),
  })
}

export const useCreateRoomReply = (roomId: number, postId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createRoomReply(roomId, postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.replies(roomId, postId) })
      qc.invalidateQueries({ queryKey: [...roomKeys.all, 'posts', roomId] })
    },
  })
}

export const useDeleteRoomReply = (roomId: number, postId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (replyId: number) => deleteRoomReply(roomId, postId, replyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.replies(roomId, postId) })
      qc.invalidateQueries({ queryKey: [...roomKeys.all, 'posts', roomId] })
    },
  })
}

// ── 업그레이드 훅 ──

/** 만들기 위저드의 "하루 약 N절 · M분" 미리보기 — 구버전 백엔드(404)면 조용히 비워 둔다 */
export const useSplitPreview = (
  params: { book_number: number; chapter_start: number; chapter_end: number; total_days: number },
  enabled = true,
) =>
  useQuery({
    queryKey: roomKeys.split(params),
    queryFn: () => getSplitPreview(params),
    enabled: enabled && params.book_number > 0 && params.chapter_end >= params.chapter_start,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

export const useUpdateRoom = (roomId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RoomUpdateRequest) => updateRoom(roomId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: roomKeys.list(), refetchType: 'all' })
    },
  })
}

/** 일차 상세(읽은 사람·반응·머문 절) — 방 상세와 별도로 가볍게 */
export const useRoomDay = (roomId: number, day: number, enabled = true) =>
  useQuery({
    queryKey: roomKeys.day(roomId, day),
    queryFn: () => getRoomDay(roomId, day),
    enabled: enabled && roomId > 0 && day > 0,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: false,
  })

export const useSetDayReaction = (roomId: number, day: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reaction: RoomReactionKey | null) => setRoomDayReaction(roomId, day, reaction),
    onSuccess: (data) => qc.setQueryData(roomKeys.day(roomId, day), data),
  })
}

export const useToggleVerseMark = (roomId: number, day: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { book_number: number; chapter: number; verse: number }) =>
      toggleRoomVerseMark(roomId, day, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.day(roomId, day) }),
  })
}

export const useNudgeDay = (roomId: number, day: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => nudgeRoomDay(roomId, day),
    onSettled: () => qc.invalidateQueries({ queryKey: roomKeys.day(roomId, day) }),
  })
}
