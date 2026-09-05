import { API_V1 } from '../config/api'
import { streamSSE } from './sse'
import type {
  BibleBookIntro,
  BibleBookIntroAIGenerateRequest,
  BibleBookIntroAIGenerateResponse,
  BibleBookIntroUpsertRequest,
} from '../types/bibleBookIntro'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/bible-book-intros`

/** 특정 책의 개관 조회 (공개). 없으면 null 을 반환한다. */
export const getBookIntro = async (
  bookNumber: number,
): Promise<BibleBookIntro | null> => {
  const data = await request<UntypedJson>(`${BASE}/book/${bookNumber}`, { errorMessage: '권 개관을 불러오지 못했습니다' })
  return (data as BibleBookIntro | null) ?? null
}

/** 책 개관 등록/수정 (관리자 전용). 책당 1행이라 PUT 으로 upsert. */
export const upsertBookIntro = async (
  bookNumber: number,
  payload: BibleBookIntroUpsertRequest,
): Promise<BibleBookIntro> => {
  const data = await request<UntypedJson>(`${BASE}/book/${bookNumber}`, {
    method: 'PUT',
    json: payload,
    errorMessage: '권 개관 저장에 실패했습니다',
  })
  return data.intro as BibleBookIntro
}

/** AI 권 개관 초안 생성 (관리자 전용). 저장하지 않고 초안만 반환. */
export const generateBookIntroDraft = async (
  payload: BibleBookIntroAIGenerateRequest,
): Promise<BibleBookIntroAIGenerateResponse> => {
  return request<BibleBookIntroAIGenerateResponse>(`${BASE}/ai-generate`, {
    method: 'POST',
    json: payload,
    errorMessage: 'AI 개관 초안 생성에 실패했습니다',
  })
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
  await requestRaw(`${BASE}/book/${bookNumber}`, { method: 'DELETE', errorMessage: '권 개관 삭제에 실패했습니다' })
}
