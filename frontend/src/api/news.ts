// 교회소식 게시판 API
// 열람은 누구나 가능하지만, 토큰이 있으면 함께 보낸다 — 관리자는 비공개 글까지 받아
// 미리보기를 할 수 있어야 하기 때문(백엔드 optional-auth).
import { API_V1 } from '../config/api'
import type { NewsDetail, NewsFormPayload, NewsListResponse } from '../types/news'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/news`

// ── 조회 ─────────────────────────────────────────────
export const fetchNewsList = async (
  page = 1,
  limit = 10,
  options: { category?: string; search?: string } = {},
): Promise<NewsListResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (options.category) params.set('category', options.category)
  if (options.search) params.set('search', options.search)

  return request<NewsListResponse>(`${BASE}?${params.toString()}`, { errorMessage: '교회소식을 불러오지 못했습니다' })
}

export const fetchNewsCategories = async (): Promise<string[]> => {
  const body = await request<UntypedJson>(`${BASE}/categories`, { errorMessage: '분류를 불러오지 못했습니다' })
  return body.data ?? []
}

export const fetchNewsDetail = async (newsId: number): Promise<NewsDetail> => {
  const body = await request<UntypedJson>(`${BASE}/${newsId}`, { errorMessage: '소식을 불러오지 못했습니다' })
  return body.data
}

// ── 관리자 ────────────────────────────────────────────
const buildFormData = (payload: NewsFormPayload): FormData => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('content', payload.content)
  if (payload.category) formData.append('category', payload.category)
  if (payload.author) formData.append('author', payload.author)
  formData.append('is_published', String(payload.isPublished))
  formData.append('is_pinned', String(payload.isPinned))
  if (payload.publishedAt) formData.append('published_at', payload.publishedAt)
  if (payload.keepAttachmentIds) {
    formData.append('keep_attachment_ids', JSON.stringify(payload.keepAttachmentIds))
  }
  payload.images.forEach((image, idx) => {
    formData.append('images', image, `news-image-${idx + 1}.jpg`)
  })
  payload.files.forEach((file) => {
    // 파일명은 다운로드 표시·확장자 검증에 쓰이므로 원본 그대로 보낸다
    formData.append('files', file, file.name)
  })
  return formData
}

export const createNews = async (payload: NewsFormPayload): Promise<NewsDetail> => {
  // Content-Type은 브라우저가 boundary와 함께 자동 설정
  const body = await request<UntypedJson>(BASE, {
    method: 'POST',
    body: buildFormData(payload),
    errorMessage: '소식 등록에 실패했습니다',
  })
  return body.data
}

export const updateNews = async (
  newsId: number,
  payload: NewsFormPayload,
): Promise<NewsDetail> => {
  const body = await request<UntypedJson>(`${BASE}/${newsId}`, {
    method: 'PUT',
    body: buildFormData(payload),
    errorMessage: '수정에 실패했습니다',
  })
  return body.data
}

/** 공개·고정 토글처럼 첨부를 건드리지 않는 가벼운 수정 */
export const patchNews = async (
  newsId: number,
  patch: { is_published?: boolean; is_pinned?: boolean; category?: string | null },
): Promise<NewsDetail> => {
  const body = await request<UntypedJson>(`${BASE}/${newsId}`, {
    method: 'PATCH',
    json: patch,
    errorMessage: '수정에 실패했습니다',
  })
  return body.data
}

export const deleteNews = async (newsId: number): Promise<void> => {
  await requestRaw(`${BASE}/${newsId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}
