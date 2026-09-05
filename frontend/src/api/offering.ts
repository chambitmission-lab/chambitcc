// 온라인 헌금 안내 API (offering_guide / offering_accounts)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1 } from '../config/api'
import type {
  AccountPayload,
  AccountUpdatePayload,
  GuideUpdatePayload,
  OfferingAccount,
  OfferingData,
  OfferingGuide,
} from '../types/offering'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/offering`

/** 마이그레이션 전이거나 비어 있으면 빈 안내 — 섹션이 안내 문구를 그린다 */
const EMPTY: OfferingData = {
  guide: { id: 1, title_ko: '온라인 헌금' },
  accounts: [],
}

// ── 공개 ─────────────────────────────────────────────

export const fetchOffering = async (): Promise<OfferingData> => {
  try {
    return await request<OfferingData>(BASE)
  } catch (error) {
    console.warn('offering API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

export const fetchAdminOffering = async (): Promise<OfferingData> => {
  return request<OfferingData>(`${BASE}/admin/all`, { errorMessage: '온라인 헌금 안내를 불러오지 못했습니다' })
}

export const updateOfferingGuide = async (data: GuideUpdatePayload): Promise<OfferingGuide> => {
  return request<OfferingGuide>(`${BASE}/guide`, {
    method: 'PUT',
    json: data,
    errorMessage: '안내 문구 수정에 실패했습니다',
  })
}

export const createOfferingAccount = async (data: AccountPayload): Promise<OfferingAccount> => {
  return request<OfferingAccount>(`${BASE}/accounts`, {
    method: 'POST',
    json: data,
    errorMessage: '계좌 등록에 실패했습니다',
  })
}

export const updateOfferingAccount = async (
  id: number,
  data: AccountUpdatePayload,
): Promise<OfferingAccount> => {
  return request<OfferingAccount>(`${BASE}/accounts/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '계좌 수정에 실패했습니다',
  })
}

export const moveOfferingAccount = async (id: number, direction: 'up' | 'down'): Promise<void> => {
  await requestRaw(`${BASE}/accounts/${id}/move`, {
    method: 'PATCH',
    json: { direction },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const deleteOfferingAccount = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/accounts/${id}`, { method: 'DELETE', errorMessage: '계좌 삭제에 실패했습니다' })
}
