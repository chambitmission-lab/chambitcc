// 기도 액션 API (기도했어요, 취소)
import { API_V1, apiFetch } from '../../config/api'
import { getAuthHeaders, requireAuth } from '../utils/apiHelpers'

/**
 * 기도했어요 (로그인 필수)
 * @param prayerId 기도 ID
 * @param prayerDurationMinutes 기도 시간 (분 단위, 선택적)
 */
export const addPrayer = async (
  prayerId: number,
  prayerDurationMinutes?: number
): Promise<{ success: boolean; message: string }> => {
  requireAuth()

  const body: { prayer_duration_minutes?: number } = {}
  if (prayerDurationMinutes !== undefined && prayerDurationMinutes > 0) {
    body.prayer_duration_minutes = prayerDurationMinutes
  }

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}/pray`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(body),
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
