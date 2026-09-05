import { API_V1 } from '../config/api'
import { streamSSE } from './sse'
import type {
  BibleCommentary,
  BibleCommentaryAIGenerateRequest,
  BibleCommentaryAIGenerateResponse,
  BibleCommentaryBatchOneResponse,
  BibleCommentaryCreateRequest,
  BibleCommentaryListResponse,
  BibleCommentaryUpdateRequest,
} from '../types/bibleCommentary'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/bible-commentaries`

export const listChapterCommentaries = async (
  bookNumber: number,
  chapter: number,
): Promise<BibleCommentaryListResponse> => {
  return request<BibleCommentaryListResponse>(`${BASE}/chapter/${bookNumber}/${chapter}`, { errorMessage: '해석을 불러오지 못했습니다' })
}

export const listVerseCommentaries = async (
  bookNumber: number,
  chapter: number,
  verse: number,
): Promise<BibleCommentaryListResponse> => {
  return request<BibleCommentaryListResponse>(`${BASE}/verse/${bookNumber}/${chapter}/${verse}`, { errorMessage: '해석을 불러오지 못했습니다' })
}

export const createCommentary = async (
  payload: BibleCommentaryCreateRequest,
): Promise<BibleCommentary> => {
  const data = await request<UntypedJson>(BASE, {
    method: 'POST',
    json: payload,
    errorMessage: '해석 추가에 실패했습니다',
  })
  return data.commentary as BibleCommentary
}

export const updateCommentary = async (
  commentaryId: number,
  payload: BibleCommentaryUpdateRequest,
): Promise<BibleCommentary> => {
  const data = await request<UntypedJson>(`${BASE}/${commentaryId}`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '해석 수정에 실패했습니다',
  })
  return data.commentary as BibleCommentary
}

export const generateCommentaryDraft = async (
  payload: BibleCommentaryAIGenerateRequest,
): Promise<BibleCommentaryAIGenerateResponse> => {
  return request<BibleCommentaryAIGenerateResponse>(`${BASE}/ai-generate`, {
    method: 'POST',
    json: payload,
    errorMessage: 'AI 해석 초안 생성에 실패했습니다',
  })
}

/**
 * AI 해석 초안 SSE 스트리밍 생성 (관리자 전용).
 * 본문 마크다운 조각이 onDelta로 실시간 전달되고, 완료 시 onDone에
 * 블로킹 API와 동일한 스키마(title/content/category/reference)가 온다.
 */
export const streamCommentaryDraft = async (
  payload: BibleCommentaryAIGenerateRequest,
  handlers: {
    onDelta: (text: string) => void
    onDone: (data: BibleCommentaryAIGenerateResponse) => void
  },
  signal?: AbortSignal,
): Promise<void> => {
  await streamSSE(
    `${BASE}/ai-generate/stream`,
    { method: 'POST', body: payload, signal },
    (event, data) => {
      if (event === 'delta') {
        handlers.onDelta(JSON.parse(data).text as string)
      } else if (event === 'done') {
        handlers.onDone(JSON.parse(data) as BibleCommentaryAIGenerateResponse)
      } else if (event === 'error') {
        throw new Error(
          (JSON.parse(data).detail as string) || 'AI 해석 초안 생성에 실패했습니다',
        )
      }
    },
  )
}

/**
 * 해석 없는 절 1건을 AI로 생성해 바로 저장 (관리자 전용).
 * 프론트에서 원하는 횟수만큼 순차 호출하며 진행률을 표시한다.
 * 1건씩 처리하므로 Gemini 1회 호출이라 타임아웃에 안전하다.
 */
export const batchGenerateOneCommentary = async (
  bookNumber?: number,
  chapter?: number,
): Promise<BibleCommentaryBatchOneResponse> => {
  const params = new URLSearchParams()
  if (bookNumber != null) params.set('book_number', String(bookNumber))
  if (chapter != null) params.set('chapter', String(chapter))
  const query = params.toString()
  return request<BibleCommentaryBatchOneResponse>(`${BASE}/ai-batch-generate-one${query ? `?${query}` : ''}`, { method: 'POST', errorMessage: 'AI 해석 생성에 실패했습니다' })
}

export const deleteCommentary = async (commentaryId: number): Promise<void> => {
  await requestRaw(`${BASE}/${commentaryId}`, { method: 'DELETE', errorMessage: '해석 삭제에 실패했습니다' })
}
