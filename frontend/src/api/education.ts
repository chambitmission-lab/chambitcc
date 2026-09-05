// 교육과 훈련 API (education_categories / education_programs)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1 } from '../config/api'
import type {
  CategoryPayload,
  CategoryUpdatePayload,
  EducationCategory,
  EducationProgram,
  EducationTree,
  ProgramPayload,
  ProgramUpdatePayload,
} from '../types/education'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/education`

const EMPTY: EducationTree = { categories: [] }

// ── 공개 ─────────────────────────────────────────────

/** 마이그레이션 전이거나 비어 있으면 빈 트리 — /education 이 안내 문구를 그린다 */
export const fetchEducationTree = async (): Promise<EducationTree> => {
  try {
    return await request<EducationTree>(BASE)
  } catch (error) {
    console.warn('education API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

export const fetchAdminEducationTree = async (): Promise<EducationTree> => {
  return request<EducationTree>(`${BASE}/admin/all`, { errorMessage: '교육과 훈련 목록을 불러오지 못했습니다' })
}

export const createCategory = async (data: CategoryPayload): Promise<EducationCategory> => {
  return request<EducationCategory>(`${BASE}/categories`, {
    method: 'POST',
    json: data,
    errorMessage: '카테고리 등록에 실패했습니다',
  })
}

export const updateCategory = async (
  id: number,
  data: CategoryUpdatePayload,
): Promise<EducationCategory> => {
  return request<EducationCategory>(`${BASE}/categories/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '카테고리 수정에 실패했습니다',
  })
}

export const moveCategory = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  await requestRaw(`${BASE}/categories/${id}/move`, {
    method: 'PATCH',
    json: { direction },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const deleteCategory = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/categories/${id}`, { method: 'DELETE', errorMessage: '카테고리 삭제에 실패했습니다' })
}

export const createProgram = async (data: ProgramPayload): Promise<EducationProgram> => {
  return request<EducationProgram>(`${BASE}/programs`, {
    method: 'POST',
    json: data,
    errorMessage: '프로그램 등록에 실패했습니다',
  })
}

export const updateProgram = async (
  id: number,
  data: ProgramUpdatePayload,
): Promise<EducationProgram> => {
  return request<EducationProgram>(`${BASE}/programs/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '프로그램 수정에 실패했습니다',
  })
}

export const moveProgram = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  await requestRaw(`${BASE}/programs/${id}/move`, {
    method: 'PATCH',
    json: { direction },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const deleteProgram = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/programs/${id}`, { method: 'DELETE', errorMessage: '프로그램 삭제에 실패했습니다' })
}

/** 프로그램 대표 사진 업로드 (R2). URL 저장은 등록/수정 요청이 담당한다 */
export const uploadEducationImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<UntypedJson>(`${BASE}/upload-image`, {
    method: 'POST',
    body: formData,
    errorMessage: '사진 업로드에 실패했습니다',
  })
  return body.url
}
