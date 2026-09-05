// 성경 칭호 API — 칭호 컬렉션 조회 / 획득 평가(해금) / 장착
import { request, requestRaw, isApiError, type UntypedJson } from './utils/request'

export type TitleCategory = 'time' | 'pattern' | 'hidden'
export type TitleTier = 'bronze' | 'silver' | 'gold' | 'legendary'

export interface TitleProgress {
  current: number
  target: number
}

export interface TitleStatus {
  key: string
  name: string
  icon: string
  category: TitleCategory
  category_label: string
  tier: TitleTier
  description: string
  hint: string
  hidden: boolean
  earned: boolean
  earned_at: string | null
  equipped: boolean
  progress: TitleProgress | null
}

export interface TitlesSummary {
  total: number
  earned: number
  equipped_key: string | null
}

export interface TitlesPayload {
  titles: TitleStatus[]
  summary: TitlesSummary
  // GET /titles 가 이번 조회로 새로 해금된 칭호를 함께 돌려준다(해금 팝업용).
  // 구버전 백엔드에는 없는 필드라 optional — 없으면 팝업만 생략된다.
  newly_earned?: TitleStatus[]
}

export interface EvaluatePayload extends TitlesPayload {
  newly_earned: TitleStatus[]
}

/** 전체 칭호 컬렉션 + 획득/진척/장착 상태 */
export const getTitles = async (): Promise<TitlesPayload> => {
  const result = await request<UntypedJson>('/titles', { auth: 'required', errorMessage: '칭호를 불러오는데 실패했습니다' })
  return (result.data ?? { titles: [], summary: { total: 0, earned: 0, equipped_key: null } }) as TitlesPayload
}

/** 읽기 직후 호출 — 새로 획득한 칭호(newly_earned) 반환 */
export const evaluateTitles = async (): Promise<EvaluatePayload> => {
  const result = await request<UntypedJson>('/titles/evaluate', {
    method: 'POST',
    auth: 'required',
    errorMessage: '칭호 평가에 실패했습니다',
  })
  return (result.data ?? { newly_earned: [], titles: [], summary: { total: 0, earned: 0, equipped_key: null } }) as EvaluatePayload
}

/** 칭호 장착 */
export const equipTitle = async (key: string): Promise<TitleStatus> => {
  const result = await request<UntypedJson>(`/titles/${encodeURIComponent(key)}/equip`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '칭호 장착에 실패했습니다',
  })
  return result.data as TitleStatus
}

/** 칭호 장착 해제 */
export const unequipTitle = async (): Promise<void> => {
  await requestRaw('/titles/unequip', {
    method: 'POST',
    auth: 'required',
    errorMessage: '칭호 해제에 실패했습니다',
  })
}

/** 현재 장착한 칭호(없으면 null) — 프로필 표시용 */
export const getEquippedTitle = async (): Promise<TitleStatus | null> => {
  try {
    const result = await request<{ data?: TitleStatus | null }>('/titles/equipped', { auth: 'required' })
    return result?.data ?? null
  } catch (error) {
    if (isApiError(error)) return null
    throw error
  }
}
