// 댓글 API
import { API_V1, apiFetch } from '../../config/api'
import { getAuthHeaders, requireAuth } from '../utils/apiHelpers'
import type { 
  ReplyListResponse,
  CreateReplyRequest,
  ReplyResponse
} from '../../types/prayer'

/**
 * 댓글 목록 조회 (비로그인 가능)
 */
export const fetchReplies = async (
  prayerId: number,
  page: number = 1,
  limit: number = 50
): Promise<ReplyListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/replies?${params}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('댓글을 불러오는데 실패했습니다')
  }

  return response.json()
}

/**
 * 댓글 작성 (로그인 필수)
 */
export const createReply = async (
  prayerId: number,
  data: CreateReplyRequest
): Promise<ReplyResponse> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/replies`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '댓글 작성에 실패했습니다')
  }

  return response.json()
}
