// 기도 CRUD API
import type { 
  PrayerListResponse, 
  CreatePrayerRequest, 
  PrayerResponse,
  SortType,
  Prayer,
} from '../../types/prayer'
import { request, type UntypedJson } from '../utils/request'

/**
 * 기도 요청 목록 조회 (비로그인 가능)
 *
 * @param isAnswered true면 응답된 기도만(응답의 전당), false면 미응답만, undefined면 전체
 */
export const fetchPrayers = async (
  page: number = 1,
  limit: number = 20,
  sort: SortType = 'popular',
  groupId?: number | null,
  filter?: 'all' | 'my_prayers' | 'prayed_by_me' | null,
  isAnswered?: boolean
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

  // 응답의 전당 필터
  if (isAnswered !== undefined) {
    params.append('is_answered', String(isAnswered))
  }

  return request<PrayerListResponse>(`/prayers?${params}`, { errorMessage: '기도 요청을 불러오는데 실패했습니다' })
}

/**
 * 기도 요청 상세 조회 (비로그인 가능)
 */
export const fetchPrayerDetail = async (
  prayerId: number
): Promise<Prayer> => {
  const result = await request<UntypedJson>(`/prayers/${prayerId}`, { errorMessage: '기도 요청을 불러오는데 실패했습니다' })
  return result.data
}

/**
 * 기도 요청 생성 (로그인 필수)
 */
export const createPrayer = async (
  data: CreatePrayerRequest
): Promise<PrayerResponse> => {
  return request<PrayerResponse>('/prayers', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '기도 요청 등록에 실패했습니다',
  })
}

/**
 * 기도 요청 삭제 (로그인 필수, 작성자만 가능)
 */
export const deletePrayer = async (
  prayerId: number
): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/prayers/${prayerId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '기도 요청 삭제에 실패했습니다',
  })
}
