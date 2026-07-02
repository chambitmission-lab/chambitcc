import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  SituationCategory,
  SituationWithVerses,
  SituationCategoryCreate,
  SituationCategoryUpdate,
  SituationVerseAdd,
  SituationVerse,
} from '../types/situation'

const BASE = `${API_V1}/situations`

export const getSituationCategories = async (): Promise<SituationCategory[]> => {
  const res = await apiFetch(BASE)
  if (!res.ok) throw new Error('상황 목록을 불러오는데 실패했습니다')
  return res.json()
}

export const getSituationVerses = async (categoryId: number): Promise<SituationWithVerses> => {
  const res = await apiFetch(`${BASE}/${categoryId}/verses`)
  if (!res.ok) throw new Error('구절 목록을 불러오는데 실패했습니다')
  return res.json()
}

// ── Admin ────────────────────────────────────────────────────────────

export const getAllSituationCategories = async (): Promise<SituationCategory[]> => {
  const res = await apiFetch(`${BASE}/admin/all`, { headers: getAuthHeaders(true) })
  if (!res.ok) throw new Error('상황 목록을 불러오는데 실패했습니다')
  return res.json()
}

export const createSituationCategory = async (data: SituationCategoryCreate): Promise<SituationCategory> => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('카테고리 생성에 실패했습니다')
  return res.json()
}

export const updateSituationCategory = async (
  id: number, data: SituationCategoryUpdate
): Promise<SituationCategory> => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('카테고리 수정에 실패했습니다')
  return res.json()
}

export const deleteSituationCategory = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('카테고리 삭제에 실패했습니다')
}

export const addSituationVerse = async (
  categoryId: number, data: SituationVerseAdd
): Promise<SituationVerse> => {
  const res = await apiFetch(`${BASE}/${categoryId}/verses`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || '구절 추가에 실패했습니다')
  }
  return res.json()
}

export const removeSituationVerse = async (situationVerseId: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/verses/${situationVerseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('구절 제거에 실패했습니다')
}

export const seedSituations = async (): Promise<{ message: string; seeded: boolean }> => {
  const res = await apiFetch(`${BASE}/seed`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  })
  if (!res.ok) throw new Error('씨드 실패')
  return res.json()
}
