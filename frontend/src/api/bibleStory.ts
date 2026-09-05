import { request, type UntypedJson } from './utils/request'
// 처음 만나는 성경(42화 스토리 모드) 진행 API — 읽은 화 목록 조회 / 읽음 처리
export interface StoryProgress {
  episode_ids: string[]
  read_count: number
}

const EMPTY: StoryProgress = { episode_ids: [], read_count: 0 }

/** 내가 읽은 화 슬러그 목록 */
export const getStoryProgress = async (): Promise<string[]> => {
  const result = await request<UntypedJson>('/bible-story/progress', { auth: 'required', errorMessage: '스토리 진행을 불러오는데 실패했습니다' })
  return ((result.data ?? EMPTY) as StoryProgress).episode_ids ?? []
}

/** 화 읽음 처리 (멱등) — 갱신된 전체 목록 반환 */
export const markStoryEpisodeRead = async (episodeId: string): Promise<string[]> => {
  const result = await request<UntypedJson>('/bible-story/progress', {
    method: 'POST',
    auth: 'required',
    json: { episode_id: episodeId },
    errorMessage: '읽음 저장에 실패했습니다',
  })
  return ((result.data ?? EMPTY) as StoryProgress).episode_ids ?? []
}
