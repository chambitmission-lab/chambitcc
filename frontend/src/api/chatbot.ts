import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type { ChatbotAnswer } from '../types/chatbot'

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
