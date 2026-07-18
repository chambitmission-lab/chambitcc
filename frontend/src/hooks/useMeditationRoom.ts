import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRoom,
  createRoomPost,
  createRoomReply,
  deleteRoomPost,
  deleteRoomReply,
  getRoom,
  joinRoom,
  leaveRoom,
  listMyRooms,
  listRoomPosts,
  listRoomReplies,
  markRoomDayRead,
  previewRoom,
  toggleRoomPostLike,
} from '../api/meditationRoom'
import type { RoomCreateRequest, RoomPostType } from '../types/meditationRoom'

export const roomKeys = {
  all: ['meditationRoom'] as const,
  list: () => [...roomKeys.all, 'list'] as const,
  detail: (id: number) => [...roomKeys.all, 'detail', id] as const,
  preview: (code: string) => [...roomKeys.all, 'preview', code] as const,
  posts: (id: number, day?: number) => [...roomKeys.all, 'posts', id, day ?? 'all'] as const,
  replies: (roomId: number, postId: number) =>
    [...roomKeys.all, 'replies', roomId, postId] as const,
}

export const useMyRooms = (enabled = true) =>
  useQuery({
    queryKey: roomKeys.list(),
    queryFn: listMyRooms,
    enabled,
    staleTime: 1000 * 60,
  })

export const useRoom = (roomId: number, enabled = true) =>
  useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => getRoom(roomId),
    enabled: enabled && roomId > 0,
    staleTime: 1000 * 30,
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
    // 같은 방을 여러 명이 보는 실시간성 — 포커스 복귀 시 재조회
    refetchOnWindowFocus: true,
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
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) })
      qc.invalidateQueries({ queryKey: roomKeys.list() })
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
