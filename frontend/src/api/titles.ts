// 성경 칭호 API — 칭호 컬렉션 조회 / 획득 평가(해금) / 장착
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export type TitleCategory = 'time' | 'pattern' | 'hidden'
export type TitleTier = 'bronze' | 'silver' | 'gold'

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
}

export interface EvaluatePayload extends TitlesPayload {
  newly_earned: TitleStatus[]
}

/** 전체 칭호 컬렉션 + 획득/진척/장착 상태 */
export const getTitles = async (): Promise<TitlesPayload> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/titles`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('칭호를 불러오는데 실패했습니다')
  const result = await res.json()
  return (result.data ?? { titles: [], summary: { total: 0, earned: 0, equipped_key: null } }) as TitlesPayload
}

/** 읽기 직후 호출 — 새로 획득한 칭호(newly_earned) 반환 */
export const evaluateTitles = async (): Promise<EvaluatePayload> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/titles/evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('칭호 평가에 실패했습니다')
  const result = await res.json()
  return (result.data ?? { newly_earned: [], titles: [], summary: { total: 0, earned: 0, equipped_key: null } }) as EvaluatePayload
}

/** 칭호 장착 */
export const equipTitle = async (key: string): Promise<TitleStatus> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/titles/${encodeURIComponent(key)}/equip`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || '칭호 장착에 실패했습니다')
  }
  const result = await res.json()
  return result.data as TitleStatus
}

/** 칭호 장착 해제 */
export const unequipTitle = async (): Promise<void> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/titles/unequip`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('칭호 해제에 실패했습니다')
}

/** 현재 장착한 칭호(없으면 null) — 프로필 표시용 */
export const getEquippedTitle = async (): Promise<TitleStatus | null> => {
  requireAuth()
  const res = await apiFetch(`${API_V1}/titles/equipped`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  const result = await res.json()
  return (result.data ?? null) as TitleStatus | null
}
