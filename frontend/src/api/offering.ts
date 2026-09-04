// 온라인 헌금 안내 API (offering_guide / offering_accounts)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  AccountPayload,
  AccountUpdatePayload,
  GuideUpdatePayload,
  OfferingAccount,
  OfferingData,
  OfferingGuide,
} from '../types/offering'

const BASE = `${API_V1}/offering`

/** 마이그레이션 전이거나 비어 있으면 빈 안내 — 섹션이 안내 문구를 그린다 */
const EMPTY: OfferingData = {
  guide: { id: 1, title_ko: '온라인 헌금' },
  accounts: [],
}

const readError = async (res: Response, fallback: string): Promise<never> => {
  const body = await res.json().catch(() => null)
  throw new Error(typeof body?.detail === 'string' ? body.detail : fallback)
}

// ── 공개 ─────────────────────────────────────────────

export const fetchOffering = async (): Promise<OfferingData> => {
  try {
    const res = await apiFetch(BASE)
    if (!res.ok) return EMPTY
    return res.json()
  } catch (error) {
    console.warn('offering API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

export const fetchAdminOffering = async (): Promise<OfferingData> => {
  const res = await apiFetch(`${BASE}/admin/all`, { headers: getAuthHeaders() })
  if (!res.ok) await readError(res, '온라인 헌금 안내를 불러오지 못했습니다')
  return res.json()
}

export const updateOfferingGuide = async (data: GuideUpdatePayload): Promise<OfferingGuide> => {
  const res = await apiFetch(`${BASE}/guide`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '안내 문구 수정에 실패했습니다')
  return res.json()
}

export const createOfferingAccount = async (data: AccountPayload): Promise<OfferingAccount> => {
  const res = await apiFetch(`${BASE}/accounts`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '계좌 등록에 실패했습니다')
  return res.json()
}

export const updateOfferingAccount = async (
  id: number,
  data: AccountUpdatePayload,
): Promise<OfferingAccount> => {
  const res = await apiFetch(`${BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) await readError(res, '계좌 수정에 실패했습니다')
  return res.json()
}

export const moveOfferingAccount = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  const res = await apiFetch(`${BASE}/accounts/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ direction }),
  })
  if (!res.ok) await readError(res, '순서 변경에 실패했습니다')
}

export const deleteOfferingAccount = async (id: number): Promise<void> => {
  const res = await apiFetch(`${BASE}/accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) await readError(res, '계좌 삭제에 실패했습니다')
}
