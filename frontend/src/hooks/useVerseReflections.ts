// 함께 읽기 — 절 묵상 나눔 훅 (목록·작성·수정·삭제·공감·댓글)
//
// 내 행동은 서버 응답으로 캐시를 바로 고친다(내겐 SSE 가 오지 않는다 — 서버가 행위자를
// 제외한다). 다른 사람의 행동은 useReadingTogether 의 SSE 핸들러가 같은 키를 갱신한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addReflectionReply,
  createVerseReflection,
  deleteReflectionReply,
  deleteVerseReflection,
  likeReflection,
  listReflectionReplies,
  listVerseReflections,
  unlikeReflection,
  updateVerseReflection,
  type ChapterReflectionSummary,
  type ReflectionListResponse,
  type ReflectionReply,
  type VerseReflection,
} from '../api/bibleReflection'
import { readingTogetherKeys } from './queryKeys'

const PAGE_SIZE = 50

export const useVerseReflections = (verseId: number, enabled: boolean) =>
  useQuery({
    queryKey: readingTogetherKeys.reflections(verseId),
    queryFn: () => listVerseReflections(verseId, 1, PAGE_SIZE),
    enabled: enabled && verseId > 0,
    staleTime: 30_000,
    refetchOnMount: 'always',
  })

/** 장 요약의 절 카운트를 delta 만큼 옮긴다 (내 작성/삭제 즉시 반영) */
const bumpSummary = (
  qc: ReturnType<typeof useQueryClient>,
  r: Pick<VerseReflection, 'book_number' | 'chapter' | 'verse'>,
  delta: number,
) => {
  qc.setQueryData<ChapterReflectionSummary>(
    readingTogetherKeys.summary(r.book_number, r.chapter),
    (old) => {
      const verse_counts = { ...(old?.verse_counts ?? {}) }
      const key = String(r.verse)
      const next = (verse_counts[key] ?? 0) + delta
      if (next > 0) verse_counts[key] = next
      else delete verse_counts[key]
      const total = Object.values(verse_counts).reduce((a, b) => a + b, 0)
      return { book_number: r.book_number, chapter: r.chapter, verse_counts, total }
    },
  )
}

const patchItem = (
  qc: ReturnType<typeof useQueryClient>,
  verseId: number,
  reflectionId: number,
  patch: Partial<VerseReflection>,
) => {
  qc.setQueryData<ReflectionListResponse>(readingTogetherKeys.reflections(verseId), (old) =>
    old
      ? { ...old, items: old.items.map((r) => (r.id === reflectionId ? { ...r, ...patch } : r)) }
      : old,
  )
}

export const useCreateReflection = (verseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => createVerseReflection(verseId, content),
    onSuccess: (created) => {
      qc.setQueryData<ReflectionListResponse>(readingTogetherKeys.reflections(verseId), (old) =>
        old
          ? { ...old, items: [created, ...old.items], total: old.total + 1 }
          : { items: [created], total: 1, page: 1, page_size: PAGE_SIZE },
      )
      bumpSummary(qc, created, +1)
    },
  })
}

export const useUpdateReflection = (verseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateVerseReflection(id, content),
    onSuccess: (updated) => patchItem(qc, verseId, updated.id, updated),
  })
}

export const useDeleteReflection = (verseId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reflection: VerseReflection) => deleteVerseReflection(reflection.id),
    onSuccess: (_, reflection) => {
      qc.setQueryData<ReflectionListResponse>(readingTogetherKeys.reflections(verseId), (old) =>
        old
          ? { ...old, items: old.items.filter((r) => r.id !== reflection.id), total: Math.max(0, old.total - 1) }
          : old,
      )
      bumpSummary(qc, reflection, -1)
    },
  })
}

/** 공감 토글 — 낙관적 갱신, 실패 시 되돌림 */
export const useToggleReflectionLike = (verseId: number) => {
  const qc = useQueryClient()
  const key = readingTogetherKeys.reflections(verseId)
  return useMutation({
    mutationFn: (r: VerseReflection) => (r.is_liked ? unlikeReflection(r.id) : likeReflection(r.id)),
    onMutate: async (r) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ReflectionListResponse>(key)
      patchItem(qc, verseId, r.id, {
        is_liked: !r.is_liked,
        like_count: Math.max(0, r.like_count + (r.is_liked ? -1 : 1)),
      })
      return { prev }
    },
    onError: (_e, _r, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSuccess: (res) => patchItem(qc, verseId, res.reflection_id, { is_liked: res.is_liked, like_count: res.like_count }),
  })
}

export const useReflectionReplies = (reflectionId: number, enabled: boolean) =>
  useQuery({
    queryKey: readingTogetherKeys.replies(reflectionId),
    queryFn: () => listReflectionReplies(reflectionId),
    enabled: enabled && reflectionId > 0,
    staleTime: 30_000,
    refetchOnMount: 'always',
  })

export const useAddReflectionReply = (verseId: number, reflectionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => addReflectionReply(reflectionId, content),
    onSuccess: (reply) => {
      qc.setQueryData<ReflectionReply[]>(readingTogetherKeys.replies(reflectionId), (old) => [...(old ?? []), reply])
      const cur = qc
        .getQueryData<ReflectionListResponse>(readingTogetherKeys.reflections(verseId))
        ?.items.find((r) => r.id === reflectionId)
      patchItem(qc, verseId, reflectionId, { reply_count: (cur?.reply_count ?? 0) + 1 })
    },
  })
}

export const useDeleteReflectionReply = (verseId: number, reflectionId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (replyId: number) => deleteReflectionReply(reflectionId, replyId),
    onSuccess: (_, replyId) => {
      qc.setQueryData<ReflectionReply[]>(readingTogetherKeys.replies(reflectionId), (old) =>
        (old ?? []).filter((r) => r.id !== replyId),
      )
      const cur = qc
        .getQueryData<ReflectionListResponse>(readingTogetherKeys.reflections(verseId))
        ?.items.find((r) => r.id === reflectionId)
      patchItem(qc, verseId, reflectionId, { reply_count: Math.max(0, (cur?.reply_count ?? 1) - 1) })
    },
  })
}
