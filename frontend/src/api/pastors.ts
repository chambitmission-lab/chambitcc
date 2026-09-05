// 담임목사 인사말 API (church_pastors)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1 } from '../config/api'
import type {
  Pastor,
  PastorCreatePayload,
  PastorListResponse,
  PastorUpdatePayload,
} from '../types/pastor'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/pastors`

const EMPTY: PastorListResponse = { current: null, past: [] }

// ── 공개 ─────────────────────────────────────────────

/**
 * 현직 + 역대 담임목사.
 * 마이그레이션 전이거나 아직 등록이 없으면 빈 목록을 돌려준다 —
 * /greeting 이 에러 화면 대신 안내 문구를 그리게 하기 위함.
 */
export const fetchPastors = async (): Promise<PastorListResponse> => {
  try {
    return await request<PastorListResponse>(BASE)
  } catch (error) {
    console.warn('pastors API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

/** 비공개까지 포함한 전체 목록 */
export const fetchAllPastors = async (): Promise<Pastor[]> => {
  return request<Pastor[]>(`${BASE}/admin/all`, { errorMessage: '목사님 목록을 불러오지 못했습니다' })
}

export const createPastor = async (data: PastorCreatePayload): Promise<Pastor> => {
  return request<Pastor>(BASE, {
    method: 'POST',
    json: data,
    errorMessage: '등록에 실패했습니다',
  })
}

export const updatePastor = async (
  pastorId: number,
  data: PastorUpdatePayload,
): Promise<Pastor> => {
  return request<Pastor>(`${BASE}/${pastorId}`, {
    method: 'PUT',
    json: data,
    errorMessage: '수정에 실패했습니다',
  })
}

/** 교체 전용 — 기존 현직은 전임으로 내려가고 종료일이 채워진다 */
export const setCurrentPastor = async (pastorId: number): Promise<Pastor> => {
  return request<Pastor>(`${BASE}/${pastorId}/set-current`, { method: 'POST', errorMessage: '현 담임목사 지정에 실패했습니다' })
}

export const deletePastor = async (pastorId: number): Promise<void> => {
  await requestRaw(`${BASE}/${pastorId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}

/** 인물 사진 업로드 (R2). URL 저장은 등록/수정 요청이 담당한다 */
export const uploadPastorPhoto = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<UntypedJson>(`${BASE}/upload-photo`, {
    method: 'POST',
    body: formData,
    errorMessage: '사진 업로드에 실패했습니다',
  })
  return body.url
}
