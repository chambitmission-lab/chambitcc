// 성경 함께 읽기 — 절 묵상 나눔 API
//
// 개인 묵상 노트(verse_bookmarks.note, 비공개)와 별개의 공개 묵상이다.
// 장 요약(절별 개수)은 비로그인도 조회 가능, 본문·작성·공감·댓글은 로그인 필요.
import { request, requestRaw } from './utils/request'

export interface ReflectionAuthor {
  id: number
  display_name: string
  avatar_url?: string | null
}

export interface VerseReflection {
  id: number
  verse_id: number
  book_number: number
  chapter: number
  verse: number
  content: string
  like_count: number
  reply_count: number
  is_liked: boolean
  is_mine: boolean
  is_edited: boolean
  author: ReflectionAuthor
  created_at: string
  time_ago: string
}

export interface ReflectionListResponse {
  items: VerseReflection[]
  total: number
  page: number
  page_size: number
}

export interface ReflectionReply {
  id: number
  reflection_id: number
  content: string
  author: ReflectionAuthor
  is_mine: boolean
  is_edited: boolean
  created_at: string
  time_ago: string
}

export interface ChapterReflectionSummary {
  book_number: number
  chapter: number
  /** 절 번호(문자열) → 활성 묵상 수 */
  verse_counts: Record<string, number>
  total: number
}

export interface ReflectionLikeResponse {
  reflection_id: number
  like_count: number
  is_liked: boolean
}

/** SSE `verse_reflection` 이벤트 페이로드 — 백엔드 verse_reflection_service._emit 과 계약 */
export interface ReflectionStreamEvent {
  kind: 'created' | 'updated' | 'deleted' | 'liked' | 'replied'
  reflection_id: number
  verse_id: number
  book_number: number
  chapter: number
  verse: number
  reflection_count: number
  like_count: number
  reply_count: number
  actor_user_id: number
  actor_name: string
  preview: string
}

export const getChapterReflectionSummary = (bookNumber: number, chapter: number) =>
  request<ChapterReflectionSummary>(`/bible/chapters/${bookNumber}/${chapter}/reflections/summary`, {
    errorMessage: '묵상 요약을 불러오지 못했습니다',
  })

export const listVerseReflections = (verseId: number, page = 1, limit = 20) =>
  request<ReflectionListResponse>(`/bible/verses/${verseId}/reflections`, {
    query: { page, limit },
    auth: 'required',
    errorMessage: '묵상을 불러오지 못했습니다',
  })

export const createVerseReflection = (verseId: number, content: string) =>
  request<VerseReflection>(`/bible/verses/${verseId}/reflections`, {
    method: 'POST',
    json: { content },
    auth: 'required',
    errorMessage: '묵상을 남기지 못했습니다',
  })

export const updateVerseReflection = (reflectionId: number, content: string) =>
  request<VerseReflection>(`/bible/reflections/${reflectionId}`, {
    method: 'PUT',
    json: { content },
    auth: 'required',
    errorMessage: '묵상을 수정하지 못했습니다',
  })

export const deleteVerseReflection = (reflectionId: number): Promise<void> =>
  requestRaw(`/bible/reflections/${reflectionId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '묵상을 삭제하지 못했습니다',
  }).then(() => undefined)

export const likeReflection = (reflectionId: number) =>
  request<ReflectionLikeResponse>(`/bible/reflections/${reflectionId}/like`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '공감하지 못했습니다',
  })

export const unlikeReflection = (reflectionId: number) =>
  request<ReflectionLikeResponse>(`/bible/reflections/${reflectionId}/like`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '공감을 취소하지 못했습니다',
  })

export const listReflectionReplies = (reflectionId: number) =>
  request<ReflectionReply[]>(`/bible/reflections/${reflectionId}/replies`, {
    auth: 'required',
    errorMessage: '댓글을 불러오지 못했습니다',
  })

export const addReflectionReply = (reflectionId: number, content: string) =>
  request<ReflectionReply>(`/bible/reflections/${reflectionId}/replies`, {
    method: 'POST',
    json: { content },
    auth: 'required',
    errorMessage: '댓글을 남기지 못했습니다',
  })

export const deleteReflectionReply = (reflectionId: number, replyId: number): Promise<void> =>
  requestRaw(`/bible/reflections/${reflectionId}/replies/${replyId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '댓글을 삭제하지 못했습니다',
  }).then(() => undefined)
