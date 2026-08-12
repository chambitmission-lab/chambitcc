// 교회 조직도 API
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type { OrgTree, OrgUnit, OrgUnitCreate, OrgUnitUpdate } from '../types/organization'

const BASE = `${API_V1}/church-org`

const readError = async (res: Response, fallback: string): Promise<never> => {
  const body = await res.json().catch(() => null)
  throw new Error(body?.detail || fallback)
}

export const getOrgTree = async (): Promise<OrgTree> => {
  const res = await apiFetch(BASE)
  if (!res.ok) await readError(res, '조직도를 불러오지 못했습니다')
  return res.json()
}

// ── Admin ────────────────────────────────────────────────────────────

export const getAdminOrgTree = async (): Promise<OrgTree> => {
  const res = await apiFetch(`${BASE}/admin/all`, { headers: getAuthHeaders() })
  if (!res.ok) await readError(res, '조직도를 불러오지 못했습니다')
  return res.json()
}

export const createOrgUnit = async (data: OrgUnitCreate): Promise<OrgUnit> => {
  const res = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '조직 추가에 실패했습니다')
  return res.json()
}

export const updateOrgUnit = async (id: number, data: OrgUnitUpdate): Promise<OrgUnit> => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '조직 수정에 실패했습니다')
  return res.json()
}

export const deleteOrgUnit = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) await readError(res, '조직 삭제에 실패했습니다')
}

export const moveOrgUnit = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  const res = await apiFetch(`${BASE}/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ direction }),
  })
  if (!res.ok) await readError(res, '순서 변경에 실패했습니다')
}

export const reorderOrgUnits = async (
  parentId: number | null,
  orderedIds: number[],
): Promise<void> => {
  const res = await apiFetch(`${BASE}/reorder`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ parent_id: parentId, ordered_ids: orderedIds }),
  })
  if (!res.ok) await readError(res, '순서 변경에 실패했습니다')
}

export const seedOrg = async (force = false): Promise<{ seeded: boolean; message: string }> => {
  const res = await apiFetch(`${BASE}/seed?force=${force}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) await readError(res, '초기 데이터 삽입에 실패했습니다')
  return res.json()
}
