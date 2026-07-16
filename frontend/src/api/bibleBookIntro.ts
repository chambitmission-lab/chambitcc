import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import { streamSSE } from './sse'
import type {
  BibleBookIntro,
  BibleBookIntroAIGenerateRequest,
  BibleBookIntroAIGenerateResponse,
  BibleBookIntroUpsertRequest,
} from '../types/bibleBookIntro'

const BASE = `${API_V1}/bible-book-intros`

/** 특정 책의 개관 조회 (공개). 없으면 null 을 반환한다. */
export const getBookIntro = async (
  bookNumber: number,
): Promise<BibleBookIntro | null> => {
  const response = await apiFetch(`${BASE}/book/${bookNumber}`)
  if (!response.ok) {
    throw new Error('권 개관을 불러오지 못했습니다')
  }
  // 백엔드가 개관이 없으면 200 + null 을 반환한다
  const data = await response.json()
  return (data as BibleBookIntro | null) ?? null
}

/** 책 개관 등록/수정 (관리자 전용). 책당 1행이라 PUT 으로 upsert. */
export const upsertBookIntro = async (
  bookNumber: number,
  payload: BibleBookIntroUpsertRequest,
): Promise<BibleBookIntro> => {
  const response = await apiFetch(`${BASE}/book/${bookNumber}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '권 개관 저장에 실패했습니다')
  }
  const data = await response.json()
  return data.intro as BibleBookIntro
}

/** AI 권 개관 초안 생성 (관리자 전용). 저장하지 않고 초안만 반환. */
export const generateBookIntroDraft = async (
  payload: BibleBookIntroAIGenerateRequest,
): Promise<BibleBookIntroAIGenerateResponse> => {
  const response = await apiFetch(`${BASE}/ai-generate`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'AI 개관 초안 생성에 실패했습니다')
  }
  return response.json()
}

/**
 * AI 권 개관 초안 SSE 스트리밍 생성 (관리자 전용).
 * 개관(overview) 마크다운 조각이 onDelta로 실시간 전달되고, 완료 시 onDone에
 * 블로킹 API와 동일한 스키마가 온다.
 */
export const streamBookIntroDraft = async (
  payload: BibleBookIntroAIGenerateRequest,
  handlers: {
    onDelta: (text: string) => void
    onDone: (data: BibleBookIntroAIGenerateResponse) => void
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
        handlers.onDone(JSON.parse(data) as BibleBookIntroAIGenerateResponse)
      } else if (event === 'error') {
        throw new Error(
          (JSON.parse(data).detail as string) || 'AI 개관 초안 생성에 실패했습니다',
        )
      }
    },
  )
}

/** 책 개관 삭제 (관리자 전용) */
export const deleteBookIntro = async (bookNumber: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/book/${bookNumber}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '권 개관 삭제에 실패했습니다')
  }
}
