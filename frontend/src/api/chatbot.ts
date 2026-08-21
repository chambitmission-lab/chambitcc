import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  ChatbotAnswer,
  ChatbotIntent,
  ChatbotIntentCreate,
  ChatbotUnanswered,
} from '../types/chatbot'

const BASE = `${API_V1}/chatbot`

/** 위젯을 열었을 때의 첫 인사 + 메뉴 칩 */
export const getChatbotGreeting = async (): Promise<ChatbotAnswer> => {
  const res = await apiFetch(`${BASE}/menu`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('챗봇 연결에 실패했습니다')
  return res.json()
}

/** 메시지 전송 — 로그인 상태면 토큰을 실어 미답변 로그에 질문자가 남는다 */
export const sendChatbotMessage = async (message: string): Promise<ChatbotAnswer> => {
  const res = await apiFetch(`${BASE}/message`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('메시지 전송에 실패했습니다')
  return res.json()
}

// ── Admin: 미답변 질문함 ─────────────────────────────────────────────

export const getChatbotUnanswered = async (): Promise<ChatbotUnanswered[]> => {
  const res = await apiFetch(`${BASE}/unanswered`, { headers: getAuthHeaders(true) })
  if (!res.ok) throw new Error('미답변 질문을 불러오는데 실패했습니다')
  return res.json()
}

export const updateChatbotUnanswered = async (
  id: number,
  data: { status?: 'open' | 'resolved'; answer?: string },
): Promise<ChatbotUnanswered> => {
  const res = await apiFetch(`${BASE}/unanswered/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('질문 처리에 실패했습니다')
  return res.json()
}

export const deleteChatbotUnanswered = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/unanswered/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('질문 삭제에 실패했습니다')
}

// ── Admin: 인텐트 사전 ───────────────────────────────────────────────

export const getChatbotIntents = async (): Promise<ChatbotIntent[]> => {
  const res = await apiFetch(`${BASE}/intents`, { headers: getAuthHeaders(true) })
  if (!res.ok) throw new Error('인텐트 목록을 불러오는데 실패했습니다')
  return res.json()
}

export const createChatbotIntent = async (data: ChatbotIntentCreate): Promise<ChatbotIntent> => {
  const res = await apiFetch(`${BASE}/intents`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('인텐트 생성에 실패했습니다')
  return res.json()
}

export const updateChatbotIntent = async (
  id: number,
  data: Partial<ChatbotIntentCreate>,
): Promise<ChatbotIntent> => {
  const res = await apiFetch(`${BASE}/intents/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('인텐트 수정에 실패했습니다')
  return res.json()
}

export const deleteChatbotIntent = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/intents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('인텐트 삭제에 실패했습니다')
}
