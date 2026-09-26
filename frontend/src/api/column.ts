// 목양컬럼 API
import type {
  Column,
  ColumnEngagement,
  ColumnProofreadIssue,
  ColumnProofreadParagraph,
  CreateColumnRequest,
  UpdateColumnRequest,
} from '../types/column'
import { request, requestRaw, type UntypedJson } from './utils/request'

// 목양컬럼 목록 조회 (인증 불필요, 선택적 키워드 검색)
export const getColumns = async (q?: string): Promise<Column[]> => {
  const params = new URLSearchParams()
  if (q && q.trim()) params.set('q', q.trim())
  const qs = params.toString()
  return request<Column[]>(`/columns${qs ? `?${qs}` : ''}`, { errorMessage: 'Failed to fetch columns' })
}

// 목양컬럼 상세 조회 (인증 불필요)
export const getColumn = async (id: number): Promise<Column> => {
  return request<Column>(`/columns/${id}`, { errorMessage: 'Failed to fetch column' })
}

// 편지에 아멘 토글 (로그인 필수)
export const toggleColumnAmen = async (id: number): Promise<ColumnEngagement> => {
  return request<ColumnEngagement>(`/columns/${id}/amen`, { method: 'POST', errorMessage: 'Failed to toggle amen' })
}

// 편지를 끝까지 읽었음을 기록 (로그인 필수, 1인 1회 — 멱등)
export const markColumnRead = async (id: number): Promise<ColumnEngagement> => {
  return request<ColumnEngagement>(`/columns/${id}/read`, { method: 'POST', errorMessage: 'Failed to mark column as read' })
}

// 목양컬럼 생성 (관리자)
export const createColumn = async (data: CreateColumnRequest): Promise<Column> => {
  return request<Column>('/columns', {
    method: 'POST',
    json: data,
    errorMessage: 'Failed to create column',
  })
}

// 목양컬럼 수정 (관리자)
export const updateColumn = async (id: number, data: UpdateColumnRequest): Promise<Column> => {
  return request<Column>(`/columns/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update column',
  })
}

// 목양컬럼 삭제 (관리자)
export const deleteColumn = async (id: number): Promise<void> => {
  await requestRaw(`/columns/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete column' })
}

/** 편지 사진 업로드 (R2) — 표지·본문 사진 공용. URL 저장은 등록/수정 요청이 담당한다 */
export const uploadColumnImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<UntypedJson>('/columns/upload-image', {
    method: 'POST',
    body: formData,
    errorMessage: '사진 업로드에 실패했습니다',
  })
  return body.url as string
}

/**
 * 맞춤법·띄어쓰기 점검 (관리자, Gemini) — 고칠 곳 제안만 받고 적용은 편집기가 한다.
 * signal: 편집기를 닫으면 기다리던 요청도 함께 끊는다(응답이 와도 쓸 곳이 없다)
 */
export const proofreadColumn = async (paragraphs: ColumnProofreadParagraph[], signal?: AbortSignal): Promise<ColumnProofreadIssue[]> => {
  // AI 응답이 한없이 늦어지면 '점검 중…' 에 갇힌다 — 끊고 목사님께 알린다
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), PROOFREAD_TIMEOUT_MS)
  const abortFromOuter = () => controller.abort(signal?.reason)
  if (signal?.aborted) abortFromOuter()
  else signal?.addEventListener('abort', abortFromOuter, { once: true })
  try {
    const body = await request<{ issues: ColumnProofreadIssue[] }>('/columns/proofread', {
      method: 'POST',
      json: { paragraphs },
      signal: controller.signal,
      errorMessage: '맞춤법 점검에 실패했습니다',
    })
    return body.issues
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromOuter)
  }
}
const PROOFREAD_TIMEOUT_MS = 60_000
