// 교육과 훈련 API (education_categories / education_programs)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  CategoryPayload,
  CategoryUpdatePayload,
  EducationCategory,
  EducationProgram,
  EducationTree,
  ProgramPayload,
  ProgramUpdatePayload,
} from '../types/education'

const BASE = `${API_V1}/education`

const EMPTY: EducationTree = { categories: [] }

const readError = async (res: Response, fallback: string): Promise<never> => {
  const body = await res.json().catch(() => null)
  throw new Error(typeof body?.detail === 'string' ? body.detail : fallback)
}

// ── 공개 ─────────────────────────────────────────────

/** 마이그레이션 전이거나 비어 있으면 빈 트리 — /education 이 안내 문구를 그린다 */
export const fetchEducationTree = async (): Promise<EducationTree> => {
  try {
    const res = await apiFetch(BASE)
    if (!res.ok) return EMPTY
    return res.json()
  } catch (error) {
    console.warn('education API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

export const fetchAdminEducationTree = async (): Promise<EducationTree> => {
  const res = await apiFetch(`${BASE}/admin/all`, { headers: getAuthHeaders() })
  if (!res.ok) await readError(res, '교육과 훈련 목록을 불러오지 못했습니다')
  return res.json()
}

export const createCategory = async (data: CategoryPayload): Promise<EducationCategory> => {
  const res = await apiFetch(`${BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '카테고리 등록에 실패했습니다')
  return res.json()
}

export const updateCategory = async (
  id: number,
  data: CategoryUpdatePayload,
): Promise<EducationCategory> => {
  const res = await apiFetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '카테고리 수정에 실패했습니다')
  return res.json()
}

export const moveCategory = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  const res = await apiFetch(`${BASE}/categories/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ direction }),
  })
  if (!res.ok) await readError(res, '순서 변경에 실패했습니다')
}

export const deleteCategory = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) await readError(res, '카테고리 삭제에 실패했습니다')
}

export const createProgram = async (data: ProgramPayload): Promise<EducationProgram> => {
  const res = await apiFetch(`${BASE}/programs`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '프로그램 등록에 실패했습니다')
  return res.json()
}

export const updateProgram = async (
  id: number,
  data: ProgramUpdatePayload,
): Promise<EducationProgram> => {
  const res = await apiFetch(`${BASE}/programs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '프로그램 수정에 실패했습니다')
  return res.json()
}

export const moveProgram = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  const res = await apiFetch(`${BASE}/programs/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ direction }),
  })
  if (!res.ok) await readError(res, '순서 변경에 실패했습니다')
}

export const deleteProgram = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/programs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) await readError(res, '프로그램 삭제에 실패했습니다')
}

/** 프로그램 대표 사진 업로드 (R2). URL 저장은 등록/수정 요청이 담당한다 */
export const uploadEducationImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch(`${BASE}/upload-image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })
  if (!res.ok) await readError(res, '사진 업로드에 실패했습니다')
  const body = await res.json()
  return body.url
}
