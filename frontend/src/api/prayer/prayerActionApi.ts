// 기도 액션 API (기도했어요, 취소)
import { API_V1, apiFetch } from '../../config/api'
import { getAuthHeaders, requireAuth } from '../utils/apiHelpers'

/**
 * 기도했어요 (로그인 필수)
 */
export const addPrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 처리에 실패했습니다')
  }

  return response.json()
}

/**
 * 기도 취소 (로그인 필수)
 */
export const removePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 취소에 실패했습니다')
  }

  return response.json()
}
