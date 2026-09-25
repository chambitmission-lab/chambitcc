import { API_V1 } from '../config/api'
import type {
  ChatbotAnswer,
  ChatbotIntent,
  ChatbotIntentCreate,
  ChatbotUnanswered,
} from '../types/chatbot'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/chatbot`

const fetchGreeting = () =>
  request<ChatbotAnswer>(`${BASE}/menu`, { errorMessage: '챗봇 연결에 실패했습니다' })

// 버튼을 누르기 시작(모바일)·올리는(PC) 순간 미리 받아 둔 인사 — 패널이 열릴 때 왕복 없이 쓴다.
// 인사는 시간대 문구라 오래 두지 않고, 한 번 쓰면 버린다("새로 시작"은 새로 받는다).
const GREETING_PREFETCH_TTL_MS = 60_000
let prefetched: { at: number; promise: Promise<ChatbotAnswer> } | null = null

export const prefetchChatbotGreeting = (): void => {
  if (prefetched && Date.now() - prefetched.at < GREETING_PREFETCH_TTL_MS) return
  const promise = fetchGreeting()
  promise.catch(() => {
    if (prefetched?.promise === promise) prefetched = null
  })
  prefetched = { at: Date.now(), promise }
}

/** 위젯을 열었을 때의 첫 인사 + 메뉴 칩 */
export const getChatbotGreeting = async (): Promise<ChatbotAnswer> => {
  const hit = prefetched && Date.now() - prefetched.at < GREETING_PREFETCH_TTL_MS ? prefetched.promise : null
  prefetched = null
  return hit ?? fetchGreeting()
}

/** 메시지 전송 — 로그인 상태면 토큰을 실어 미답변 로그에 질문자가 남는다 */
export const sendChatbotMessage = async (message: string): Promise<ChatbotAnswer> => {
  return request<ChatbotAnswer>(`${BASE}/message`, {
    method: 'POST',
    json: { message },
    errorMessage: '메시지 전송에 실패했습니다',
  })
}

// ── Admin: 미답변 질문함 ─────────────────────────────────────────────

export const getChatbotUnanswered = async (): Promise<ChatbotUnanswered[]> => {
  return request<ChatbotUnanswered[]>(`${BASE}/unanswered`, { errorMessage: '미답변 질문을 불러오는데 실패했습니다' })
}

export const updateChatbotUnanswered = async (
  id: number,
  data: { status?: 'open' | 'resolved'; answer?: string },
): Promise<ChatbotUnanswered> => {
  return request<ChatbotUnanswered>(`${BASE}/unanswered/${id}`, {
    method: 'PATCH',
    json: data,
    errorMessage: '질문 처리에 실패했습니다',
  })
}

export const deleteChatbotUnanswered = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/unanswered/${id}`, { method: 'DELETE', errorMessage: '질문 삭제에 실패했습니다' })
}

// ── Admin: 인텐트 사전 ───────────────────────────────────────────────

export const getChatbotIntents = async (): Promise<ChatbotIntent[]> => {
  return request<ChatbotIntent[]>(`${BASE}/intents`, { errorMessage: '인텐트 목록을 불러오는데 실패했습니다' })
}

export const createChatbotIntent = async (data: ChatbotIntentCreate): Promise<ChatbotIntent> => {
  return request<ChatbotIntent>(`${BASE}/intents`, {
    method: 'POST',
    json: data,
    errorMessage: '인텐트 생성에 실패했습니다',
  })
}

export const updateChatbotIntent = async (
  id: number,
  data: Partial<ChatbotIntentCreate>,
): Promise<ChatbotIntent> => {
  return request<ChatbotIntent>(`${BASE}/intents/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '인텐트 수정에 실패했습니다',
  })
}

export const deleteChatbotIntent = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/intents/${id}`, { method: 'DELETE', errorMessage: '인텐트 삭제에 실패했습니다' })
}
