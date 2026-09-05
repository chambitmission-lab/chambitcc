import { API_V1 } from '../config/api'
import type {
  SituationCategory,
  SituationWithVerses,
  SituationCategoryCreate,
  SituationCategoryUpdate,
  SituationVerseAdd,
  SituationVerse,
} from '../types/situation'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/situations`

export const getSituationCategories = async (): Promise<SituationCategory[]> => {
  return request<SituationCategory[]>(BASE, { errorMessage: '상황 목록을 불러오는데 실패했습니다' })
}

export const getSituationVerses = async (categoryId: number): Promise<SituationWithVerses> => {
  return request<SituationWithVerses>(`${BASE}/${categoryId}/verses`, { errorMessage: '구절 목록을 불러오는데 실패했습니다' })
}

// ── Admin ────────────────────────────────────────────────────────────

export const getAllSituationCategories = async (): Promise<SituationCategory[]> => {
  return request<SituationCategory[]>(`${BASE}/admin/all`, { errorMessage: '상황 목록을 불러오는데 실패했습니다' })
}

export const createSituationCategory = async (data: SituationCategoryCreate): Promise<SituationCategory> => {
  return request<SituationCategory>(BASE, {
    method: 'POST',
    json: data,
    errorMessage: '카테고리 생성에 실패했습니다',
  })
}

export const updateSituationCategory = async (
  id: number, data: SituationCategoryUpdate
): Promise<SituationCategory> => {
  return request<SituationCategory>(`${BASE}/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '카테고리 수정에 실패했습니다',
  })
}

export const deleteSituationCategory = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/${id}`, { method: 'DELETE', errorMessage: '카테고리 삭제에 실패했습니다' })
}

export const addSituationVerse = async (
  categoryId: number, data: SituationVerseAdd
): Promise<SituationVerse> => {
  return request<SituationVerse>(`${BASE}/${categoryId}/verses`, {
    method: 'POST',
    json: data,
    errorMessage: '구절 추가에 실패했습니다',
  })
}

export const removeSituationVerse = async (situationVerseId: number): Promise<void> => {
  await requestRaw(`${BASE}/verses/${situationVerseId}`, { method: 'DELETE', errorMessage: '구절 제거에 실패했습니다' })
}

export const updateSituationVerseMessage = async (
  situationVerseId: number, message: string | null
): Promise<void> => {
  await requestRaw(`${BASE}/verses/${situationVerseId}`, {
    method: 'PATCH',
    json: { message },
    errorMessage: '위로 메시지 저장에 실패했습니다',
  })
}

export const seedSituations = async (): Promise<{ message: string; seeded: boolean }> => {
  return request<{ message: string; seeded: boolean }>(`${BASE}/seed`, { method: 'POST', errorMessage: '씨드 실패' })
}
