// 기도 CRUD API
import { API_V1, apiFetch } from '../../config/api'
import { getAuthHeaders, requireAuth } from '../utils/apiHelpers'
import type { 
  PrayerListResponse, 
  CreatePrayerRequest, 
  PrayerResponse,
  SortType,
  Prayer,
} from '../../types/prayer'

/**
 * 기도 요청 목록 조회 (비로그인 가능)
 */
export const fetchPrayers = async (
  page: number = 1,
  limit: number = 20,
  sort: SortType = 'popular',
  groupId?: number | null,
  filter?: 'all' | 'my_prayers' | 'prayed_by_me' | null
): Promise<PrayerListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  })

  // 그룹 ID가 있으면 쿼리 파라미터에 추가
  if (groupId !== undefined && groupId !== null) {
    params.append('group_id', groupId.toString())
  }

  // 필터가 있으면 쿼리 파라미터에 추가
  if (filter && filter !== 'all') {
    params.append('filter', filter)
  }

  const response = await apiFetch(`${API_V1}/prayers?${params}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('기도 요청을 불러오는데 실패했습니다')
  }

  return response.json()
}

/**
 * 기도 요청 상세 조회 (비로그인 가능)
 */
export const fetchPrayerDetail = async (
  prayerId: number
): Promise<Prayer> => {
  const response = await apiFetch(`${API_V1}/prayers/${prayerId}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('기도 요청을 불러오는데 실패했습니다')
  }

  const result = await response.json()
  return result.data
}

/**
 * 기도 요청 생성 (로그인 필수)
 */
export const createPrayer = async (
  data: CreatePrayerRequest
): Promise<PrayerResponse> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/prayers`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('기도 요청 등록에 실패했습니다')
  }

  return response.json()
}

/**
 * 기도 요청 삭제 (로그인 필수, 작성자만 가능)
 */
export const deletePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  requireAuth()

  const response = await apiFetch(`${API_V1}/prayers/${prayerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '기도 요청 삭제에 실패했습니다')
  }

  return response.json()
}
