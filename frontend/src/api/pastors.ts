// 담임목사 인사말 API (church_pastors)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1, apiFetch } from '../config/api'
import type {
  Pastor,
  PastorCreatePayload,
  PastorListResponse,
  PastorUpdatePayload,
} from '../types/pastor'

const BASE = `${API_V1}/pastors`

const EMPTY: PastorListResponse = { current: null, past: [] }

const authHeaders = (json = true): Record<string, string> => {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

const unwrap = async (response: Response, fallback: string) => {
  if (!response.ok) {
    let detail = fallback
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : fallback
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 */
    }
    throw new Error(detail)
  }
  return response.json()
}

// ── 공개 ─────────────────────────────────────────────

/**
 * 현직 + 역대 담임목사.
 * 마이그레이션 전이거나 아직 등록이 없으면 빈 목록을 돌려준다 —
 * /greeting 이 에러 화면 대신 안내 문구를 그리게 하기 위함.
 */
export const fetchPastors = async (): Promise<PastorListResponse> => {
  try {
    const response = await apiFetch(BASE)
    if (!response.ok) return EMPTY
    return response.json()
  } catch (error) {
    console.warn('pastors API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

/** 비공개까지 포함한 전체 목록 */
export const fetchAllPastors = async (): Promise<Pastor[]> => {
  const response = await apiFetch(`${BASE}/admin/all`, { headers: authHeaders(false) })
  return unwrap(response, '목사님 목록을 불러오지 못했습니다')
}

export const createPastor = async (data: PastorCreatePayload): Promise<Pastor> => {
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return unwrap(response, '등록에 실패했습니다')
}

export const updatePastor = async (
  pastorId: number,
  data: PastorUpdatePayload,
): Promise<Pastor> => {
  const response = await apiFetch(`${BASE}/${pastorId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return unwrap(response, '수정에 실패했습니다')
}

/** 교체 전용 — 기존 현직은 전임으로 내려가고 종료일이 채워진다 */
export const setCurrentPastor = async (pastorId: number): Promise<Pastor> => {
  const response = await apiFetch(`${BASE}/${pastorId}/set-current`, {
    method: 'POST',
    headers: authHeaders(),
  })
  return unwrap(response, '현 담임목사 지정에 실패했습니다')
}

export const deletePastor = async (pastorId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${pastorId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  })
  if (!response.ok) {
    await unwrap(response, '삭제에 실패했습니다')
  }
}

/** 인물 사진 업로드 (R2). URL 저장은 등록/수정 요청이 담당한다 */
export const uploadPastorPhoto = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiFetch(`${BASE}/upload-photo`, {
    method: 'POST',
    headers: authHeaders(false),
    body: formData,
  })
  const body = await unwrap(response, '사진 업로드에 실패했습니다')
  return body.url
}
