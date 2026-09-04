import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import {
  addClassMembers,
  cancelClassPostRsvp,
  createClass,
  createClassPost,
  createClassPostComment,
  deleteClassPost,
  deleteClassPostComment,
  getClass,
  getClassAttendanceMonth,
  getClassPollDetail,
  getClassPostChecks,
  getClassPostRsvps,
  getClassReport,
  getClassStars,
  getMyClassGrowth,
  joinClass,
  leaveClass,
  listClassPostComments,
  listClassPostRecitations,
  listClassPosts,
  listMyClasses,
  previewClass,
  remindClassPost,
  setClassPostRsvp,
  setMemberTeacher,
  toggleClassAttendance,
  toggleClassPostCheck,
  toggleClassPostRecite,
  updateClass,
  updateClassPost,
  updateClassPostComment,
  updateMyChildName,
  voteClassPoll,
} from '../api/classRoom'
import type {
  ClassCreateRequest,
  ClassPost,
  ClassPostCreateRequest,
  ClassPostListResponse,
  ClassPostType,
  RemindTarget,
  RsvpStatus,
} from '../types/classRoom'

const PAGE_SIZE = 20

export const classKeys = {
  all: ['classRoom'] as const,
  list: () => [...classKeys.all, 'list'] as const,
  detail: (id: number) => [...classKeys.all, 'detail', id] as const,
  preview: (code: string) => [...classKeys.all, 'preview', code] as const,
  posts: (id: number, type?: ClassPostType) =>
    [...classKeys.all, 'posts', id, type ?? 'all'] as const,
  postsRoot: (id: number) => [...classKeys.all, 'posts', id] as const,
  comments: (classId: number, postId: number) =>
    [...classKeys.all, 'comments', classId, postId] as const,
  checks: (classId: number, postId: number) =>
    [...classKeys.all, 'checks', classId, postId] as const,
  recitations: (classId: number, postId: number) =>
    [...classKeys.all, 'recitations', classId, postId] as const,
  rsvps: (classId: number, postId: number) =>
    [...classKeys.all, 'rsvps', classId, postId] as const,
  pollDetail: (classId: number, postId: number) =>
    [...classKeys.all, 'pollDetail', classId, postId] as const,
  report: (classId: number, weeks: number) =>
    [...classKeys.all, 'report', classId, weeks] as const,
  stars: (classId: number) => [...classKeys.all, 'stars', classId] as const,
  attendance: (classId: number, month: string) =>
    [...classKeys.all, 'attendance', classId, month] as const,
  growth: (classId: number) => [...classKeys.all, 'growth', classId] as const,
}

// 확인·암송·RSVP 토글 응답을 피드 캐시에 바로 반영한다 —
// 전체 refetch 대신 해당 글만 갱신해 목록이 깜빡이지 않게
const patchPostInCache = (
  qc: QueryClient,
  classId: number,
  postId: number,
  patch: (post: ClassPost) => ClassPost,
) => {
  qc.setQueriesData<InfiniteData<ClassPostListResponse>>(
    { queryKey: classKeys.postsRoot(classId) },
    (data) => {
      if (!data) return data
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((p) => (p.id === postId ? patch(p) : p)),
        })),
      }
    },
  )
}

export const useMyClasses = (enabled = true) =>
  useQuery({
    queryKey: classKeys.list(),
    queryFn: listMyClasses,
    enabled,
    staleTime: 1000 * 60,
    // 여러 명이 쓰는 공유 데이터 — 전역 refetchOnMount:false의 예외 (묵상방과 동일)
    refetchOnMount: true,
  })

export const useClassDetail = (classId: number, enabled = true) =>
  useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: enabled && classId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useClassPreview = (inviteCode: string) =>
  useQuery({
    queryKey: classKeys.preview(inviteCode),
    queryFn: () => previewClass(inviteCode),
    enabled: inviteCode.length >= 4,
    retry: false,
  })

export const useClassPosts = (classId: number, postType?: ClassPostType) =>
  useInfiniteQuery({
    queryKey: classKeys.posts(classId, postType),
    queryFn: ({ pageParam }) => listClassPosts(classId, postType, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
    enabled: classId > 0,
    staleTime: 1000 * 15,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

export const useCreateClass = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClassCreateRequest) => createClass(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export const useAddClassMembers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, userIds }: { classId: number; userIds: number[] }) =>
      addClassMembers(classId, userIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export const useJoinClass = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ inviteCode, childName }: { inviteCode: string; childName?: string }) =>
      joinClass(inviteCode, childName),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export const useLeaveClass = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: number) => leaveClass(classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  })
}

export const useUpdateClass = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ClassCreateRequest>) => updateClass(classId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.detail(classId) })
      qc.invalidateQueries({ queryKey: classKeys.list() })
    },
  })
}

export const useUpdateMyChildName = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (childName: string) => updateMyChildName(classId, childName),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.detail(classId) }),
  })
}

export const useSetMemberTeacher = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isTeacher }: { userId: number; isTeacher: boolean }) =>
      setMemberTeacher(classId, userId, isTeacher),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.detail(classId) })
      qc.invalidateQueries({ queryKey: classKeys.list() })
    },
  })
}

export const useCreateClassPost = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      files,
    }: {
      payload: ClassPostCreateRequest
      files?: File[]
    }) => createClassPost(classId, payload, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.postsRoot(classId) })
      qc.invalidateQueries({ queryKey: classKeys.list() })
    },
  })
}

export const useUpdateClassPost = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      postId,
      payload,
    }: {
      postId: number
      payload: { title?: string | null; content?: string; is_pinned?: boolean }
    }) => updateClassPost(classId, postId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: classKeys.postsRoot(classId) }),
  })
}

export const useDeleteClassPost = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => deleteClassPost(classId, postId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: classKeys.postsRoot(classId) }),
  })
}

export const useToggleClassPostCheck = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => toggleClassPostCheck(classId, postId),
    onSuccess: (res, postId) => {
      patchPostInCache(qc, classId, postId, (p) => ({
        ...p,
        checked_by_me: res.checked,
        check_count: res.check_count,
      }))
      qc.invalidateQueries({ queryKey: classKeys.checks(classId, postId) })
    },
  })
}

export const useToggleClassPostRecite = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => toggleClassPostRecite(classId, postId),
    onSuccess: (res, postId) => {
      patchPostInCache(qc, classId, postId, (p) => ({
        ...p,
        recited_by_me: res.recited,
        recite_count: res.recite_count,
      }))
      qc.invalidateQueries({ queryKey: classKeys.recitations(classId, postId) })
    },
  })
}

export const useSetClassPostRsvp = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, status }: { postId: number; status: RsvpStatus }) =>
      setClassPostRsvp(classId, postId, status),
    onSuccess: (event, { postId }) => {
      patchPostInCache(qc, classId, postId, (p) => ({ ...p, event }))
      qc.invalidateQueries({ queryKey: classKeys.rsvps(classId, postId) })
    },
  })
}

export const useCancelClassPostRsvp = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => cancelClassPostRsvp(classId, postId),
    onSuccess: (event, postId) => {
      patchPostInCache(qc, classId, postId, (p) => ({ ...p, event }))
      qc.invalidateQueries({ queryKey: classKeys.rsvps(classId, postId) })
    },
  })
}

// ── 투표 ──
export const useVoteClassPoll = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, optionIds }: { postId: number; optionIds: number[] }) =>
      voteClassPoll(classId, postId, optionIds),
    onSuccess: (poll, { postId }) => {
      patchPostInCache(qc, classId, postId, (p) => ({ ...p, poll }))
      qc.invalidateQueries({ queryKey: classKeys.pollDetail(classId, postId) })
    },
  })
}

export const useClassPollDetail = (classId: number, postId: number, enabled: boolean) =>
  useQuery({
    queryKey: classKeys.pollDetail(classId, postId),
    queryFn: () => getClassPollDetail(classId, postId),
    enabled: enabled && postId > 0,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

// ── 콕 찌르기 ──
export const useRemindClassPost = (classId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, target }: { postId: number; target: RemindTarget }) =>
      remindClassPost(classId, postId, target),
    onSuccess: (res, { postId }) => {
      patchPostInCache(qc, classId, postId, (p) => ({
        ...p,
        reminded_at: res.reminded_at,
      }))
    },
  })
}

// ── 우리반 리포트 / 별 랭킹 / 성장 카드 ──
export const useClassReport = (classId: number, weeks: number, enabled = true) =>
  useQuery({
    queryKey: classKeys.report(classId, weeks),
    queryFn: () => getClassReport(classId, weeks),
    enabled: enabled && classId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useClassStars = (classId: number, enabled = true) =>
  useQuery({
    queryKey: classKeys.stars(classId),
    queryFn: () => getClassStars(classId),
    enabled: enabled && classId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useMyClassGrowth = (classId: number, enabled = true) =>
  useQuery({
    queryKey: classKeys.growth(classId),
    queryFn: () => getMyClassGrowth(classId),
    enabled: enabled && classId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

// ── 출석부 ──
export const useClassAttendanceMonth = (
  classId: number,
  month: string,
  enabled = true,
) =>
  useQuery({
    queryKey: classKeys.attendance(classId, month),
    queryFn: () => getClassAttendanceMonth(classId, month),
    enabled: enabled && classId > 0 && month.length === 7,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

export const useToggleClassAttendance = (classId: number, month: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ attDate, userId }: { attDate: string; userId: number }) =>
      toggleClassAttendance(classId, attDate, userId),
    onSuccess: (res) => {
      // 응답을 월간 캐시에 바로 반영 — 탭탭 체크가 깜빡이지 않게
      qc.setQueryData(
        classKeys.attendance(classId, month),
        (data: { month: string; records: Record<string, number[]> } | undefined) => {
          if (!data) return data
          const prev = data.records[res.att_date] ?? []
          const next = res.present
            ? [...prev, res.user_id]
            : prev.filter((id) => id !== res.user_id)
          return { ...data, records: { ...data.records, [res.att_date]: next } }
        },
      )
    },
  })
}

// 시트가 열릴 때만 조회하는 상세 현황들
export const useClassPostChecks = (classId: number, postId: number, enabled: boolean) =>
  useQuery({
    queryKey: classKeys.checks(classId, postId),
    queryFn: () => getClassPostChecks(classId, postId),
    enabled: enabled && postId > 0,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

export const useClassPostRecitations = (
  classId: number,
  postId: number,
  enabled: boolean,
) =>
  useQuery({
    queryKey: classKeys.recitations(classId, postId),
    queryFn: () => listClassPostRecitations(classId, postId),
    enabled: enabled && postId > 0,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

export const useClassPostRsvps = (classId: number, postId: number, enabled: boolean) =>
  useQuery({
    queryKey: classKeys.rsvps(classId, postId),
    queryFn: () => getClassPostRsvps(classId, postId),
    enabled: enabled && postId > 0,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

export const useClassPostComments = (classId: number, postId: number, enabled: boolean) =>
  useQuery({
    queryKey: classKeys.comments(classId, postId),
    queryFn: () => listClassPostComments(classId, postId),
    enabled: enabled && postId > 0,
    refetchOnMount: true,
  })

export const useCreateClassPostComment = (classId: number, postId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createClassPostComment(classId, postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.comments(classId, postId) })
      patchPostInCache(qc, classId, postId, (p) => ({
        ...p,
        comment_count: p.comment_count + 1,
      }))
    },
  })
}

export const useUpdateClassPostComment = (classId: number, postId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateClassPostComment(classId, postId, commentId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.comments(classId, postId) }),
  })
}

export const useDeleteClassPostComment = (classId: number, postId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) =>
      deleteClassPostComment(classId, postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.comments(classId, postId) })
      patchPostInCache(qc, classId, postId, (p) => ({
        ...p,
        comment_count: Math.max(0, p.comment_count - 1),
      }))
    },
  })
}
