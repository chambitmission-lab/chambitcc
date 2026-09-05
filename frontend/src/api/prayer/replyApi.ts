// 댓글 API
import type {
  ReplyListResponse,
  CreateReplyRequest,
  UpdateReplyRequest,
  ReplyResponse
} from '../../types/prayer'
import { request } from '../utils/request'

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

  return request<ReplyListResponse>(`/prayers/${prayerId}/replies?${params}`, { errorMessage: '댓글을 불러오는데 실패했습니다' })
}

/**
 * 댓글 작성 (로그인 필수)
 */
export const createReply = async (
  prayerId: number,
  data: CreateReplyRequest
): Promise<ReplyResponse> => {
  return request<ReplyResponse>(`/prayers/${prayerId}/replies`, {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

/**
 * 댓글 수정 (본인 댓글만, 로그인 필수)
 */
export const updateReply = async (
  prayerId: number,
  replyId: number,
  data: UpdateReplyRequest
): Promise<ReplyResponse> => {
  return request<ReplyResponse>(`/prayers/${prayerId}/replies/${replyId}`, {
    method: 'PUT',
    auth: 'required',
    json: data,
    errorMessage: '댓글 수정에 실패했습니다',
  })
}

/**
 * 댓글 삭제 (본인 댓글만, 로그인 필수)
 */
export const deleteReply = async (
  prayerId: number,
  replyId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayers/${prayerId}/replies/${replyId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '댓글 삭제에 실패했습니다',
  })
}
