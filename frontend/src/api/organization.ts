// 교회 조직도 API
import { API_V1 } from '../config/api'
import type { OrgTree, OrgUnit, OrgUnitCreate, OrgUnitUpdate } from '../types/organization'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/church-org`

export const getOrgTree = async (): Promise<OrgTree> => {
  return request<OrgTree>(BASE, { errorMessage: '조직도를 불러오지 못했습니다' })
}

// ── Admin ────────────────────────────────────────────────────────────

export const getAdminOrgTree = async (): Promise<OrgTree> => {
  return request<OrgTree>(`${BASE}/admin/all`, { errorMessage: '조직도를 불러오지 못했습니다' })
}

export const createOrgUnit = async (data: OrgUnitCreate): Promise<OrgUnit> => {
  return request<OrgUnit>(BASE, {
    method: 'POST',
    json: data,
    errorMessage: '조직 추가에 실패했습니다',
  })
}

export const updateOrgUnit = async (id: number, data: OrgUnitUpdate): Promise<OrgUnit> => {
  return request<OrgUnit>(`${BASE}/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '조직 수정에 실패했습니다',
  })
}

export const deleteOrgUnit = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/${id}`, { method: 'DELETE', errorMessage: '조직 삭제에 실패했습니다' })
}

export const moveOrgUnit = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  await requestRaw(`${BASE}/${id}/move`, {
    method: 'PATCH',
    json: { direction },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const reorderOrgUnits = async (
  parentId: number | null,
  orderedIds: number[],
): Promise<void> => {
  await requestRaw(`${BASE}/reorder`, {
    method: 'PATCH',
    json: { parent_id: parentId, ordered_ids: orderedIds },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const seedOrg = async (force = false): Promise<{ seeded: boolean; message: string }> => {
  return request<{ seeded: boolean; message: string }>(`${BASE}/seed?force=${force}`, { method: 'POST', errorMessage: '초기 데이터 삽입에 실패했습니다' })
}
