// 기도 액션 API (기도했어요, 취소, 응답 등록)
import type { Prayer } from '../../types/prayer'
import { request } from '../utils/request'

/**
 * 기도했어요 (로그인 필수)
 * @param prayerId 기도 ID
 * @param prayerDurationMinutes 기도 시간 (분 단위, 선택적)
 */
export const addPrayer = async (
  prayerId: number,
  prayerDurationMinutes?: number
): Promise<{ success: boolean; message: string }> => {

  const body: { prayer_duration_minutes?: number } = {}
  if (prayerDurationMinutes !== undefined && prayerDurationMinutes > 0) {
    body.prayer_duration_minutes = prayerDurationMinutes
  }

  return request<{ success: boolean; message: string }>(`/prayers/${prayerId}/pray`, {
    method: 'POST',
    auth: 'required',
    json: body,
    errorMessage: '기도 처리에 실패했습니다',
  })
}

/**
 * 기도 취소 (로그인 필수)
 */
export const removePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayers/${prayerId}/pray`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '기도 취소에 실패했습니다',
  })
}

/**
 * 기도 응답 등록 — 응답의 전당 (로그인 필수, 작성자만)
 *
 * 백엔드: POST /api/v1/prayers/{id}/answer
 * 이미 등록된 응답이 있으면 409가 떨어지므로 updatePrayerAnswer 사용해야 함.
 */
export const answerPrayer = async (
  prayerId: number,
  testimony: string
): Promise<{ success: boolean; message: string; data: Prayer }> => {
  return request<{ success: boolean; message: string; data: Prayer }>(`/prayers/${prayerId}/answer`, {
    method: 'POST',
    auth: 'required',
    json: { testimony },
    errorMessage: '응답 등록에 실패했습니다',
  })
}

/**
 * 기도 응답 간증 수정 — 응답의 전당 (로그인 필수, 작성자만)
 *
 * 백엔드: PUT /api/v1/prayers/{id}/answer
 */
export const updatePrayerAnswer = async (
  prayerId: number,
  testimony: string
): Promise<{ success: boolean; message: string; data: Prayer }> => {
  return request<{ success: boolean; message: string; data: Prayer }>(`/prayers/${prayerId}/answer`, {
    method: 'PUT',
    auth: 'required',
    json: { testimony },
    errorMessage: '응답 수정에 실패했습니다',
  })
}

/**
 * 기도 응답 등록 취소 — 응답의 전당 (로그인 필수, 작성자만)
 *
 * 백엔드: DELETE /api/v1/prayers/{id}/answer
 */
export const cancelPrayerAnswer = async (
  prayerId: number
): Promise<{ success: boolean; message: string; data: Prayer }> => {
  return request<{ success: boolean; message: string; data: Prayer }>(`/prayers/${prayerId}/answer`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '응답 취소에 실패했습니다',
  })
}
