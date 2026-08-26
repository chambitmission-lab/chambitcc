// 처음 만나는 성경(42화 스토리 모드) 진행 API — 읽은 화 목록 조회 / 읽음 처리
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export interface StoryProgress {
  episode_ids: string[]
  read_count: number
}

const EMPTY: StoryProgress = { episode_ids: [], read_count: 0 }

/** 내가 읽은 화 슬러그 목록 */
export const getStoryProgress = async (): Promise<string[]> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/bible-story/progress`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('스토리 진행을 불러오는데 실패했습니다')
  const result = await res.json()
  return ((result.data ?? EMPTY) as StoryProgress).episode_ids ?? []
}

/** 화 읽음 처리 (멱등) — 갱신된 전체 목록 반환 */
export const markStoryEpisodeRead = async (episodeId: string): Promise<string[]> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/bible-story/progress`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ episode_id: episodeId }),
  })
  if (!res.ok) throw new Error('읽음 저장에 실패했습니다')
  const result = await res.json()
  return ((result.data ?? EMPTY) as StoryProgress).episode_ids ?? []
}
