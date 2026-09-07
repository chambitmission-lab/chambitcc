import { request, type UntypedJson } from './utils/request'
// 성경 지도여행 방문 API — 방문한 장소 목록 조회 / 방문 처리
export interface AtlasProgress {
  place_ids: string[]
  visit_count: number
}

const EMPTY: AtlasProgress = { place_ids: [], visit_count: 0 }

/** 내가 방문한 장소 슬러그 목록 */
export const getAtlasProgress = async (): Promise<string[]> => {
  const result = await request<UntypedJson>('/bible-atlas/progress', {
    auth: 'required',
    errorMessage: '지도여행 기록을 불러오는데 실패했습니다',
  })
  return ((result.data ?? EMPTY) as AtlasProgress).place_ids ?? []
}

/** 장소 방문 처리 (멱등) — 갱신된 전체 목록 반환 */
export const markAtlasPlaceVisited = async (placeId: string): Promise<string[]> => {
  const result = await request<UntypedJson>('/bible-atlas/progress', {
    method: 'POST',
    auth: 'required',
    json: { place_id: placeId },
    errorMessage: '방문 기록 저장에 실패했습니다',
  })
  return ((result.data ?? EMPTY) as AtlasProgress).place_ids ?? []
}
