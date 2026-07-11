// 문화교실 API
import { API_V1, apiFetch } from '../config/api'
import type {
  CultureClass,
  CultureClassAdmin,
  CreateCultureClassRequest,
  UpdateCultureClassRequest,
  CultureApplication,
  CreateCultureApplicationRequest,
  CultureApplicationLookupRequest,
  CultureApplicationStatus,
  CultureNotice,
  CreateCultureNoticeRequest,
  UpdateCultureNoticeRequest,
} from '../types/culture'

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const throwDetail = async (response: Response, fallback: string): Promise<never> => {
  let detail = fallback
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') detail = body.detail
  } catch {
    // JSON 아닌 응답은 fallback 사용
  }
  throw new Error(detail)
}

// ── 강좌 ──────────────────────────────────────────────────────────────

// 공개 강좌 목록 (인증 불필요)
export const getCultureClasses = async (): Promise<CultureClass[]> => {
  const response = await apiFetch(`${API_V1}/culture/classes`)
  if (!response.ok) return throwDetail(response, '강좌 목록을 불러오지 못했습니다')
  return response.json()
}

// 전체 강좌 목록 + 신청자 수 (관리자)
export const getAllCultureClasses = async (): Promise<CultureClassAdmin[]> => {
  const response = await apiFetch(`${API_V1}/culture/classes/all`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '강좌 목록을 불러오지 못했습니다')
  return response.json()
}

// 강좌 생성 (관리자)
export const createCultureClass = async (
  data: CreateCultureClassRequest
): Promise<CultureClass> => {
  const response = await apiFetch(`${API_V1}/culture/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '강좌 생성에 실패했습니다')
  return response.json()
}

// 강좌 수정 (관리자)
export const updateCultureClass = async (
  id: number,
  data: UpdateCultureClassRequest
): Promise<CultureClass> => {
  const response = await apiFetch(`${API_V1}/culture/classes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '강좌 수정에 실패했습니다')
  return response.json()
}

// 강좌 삭제 (관리자)
export const deleteCultureClass = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_V1}/culture/classes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '강좌 삭제에 실패했습니다')
}

// ── 수강신청 ──────────────────────────────────────────────────────────

// 수강신청 (비회원 가능)
export const createCultureApplication = async (
  data: CreateCultureApplicationRequest
): Promise<CultureApplication> => {
  const response = await apiFetch(`${API_V1}/culture/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '수강신청에 실패했습니다')
  return response.json()
}

// 신청 내역 조회 (전화번호 + 생년월일 본인 확인)
export const lookupCultureApplications = async (
  data: CultureApplicationLookupRequest
): Promise<CultureApplication[]> => {
  const response = await apiFetch(`${API_V1}/culture/applications/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '신청 내역 조회에 실패했습니다')
  return response.json()
}

// 신청 취소 (본인 확인)
export const cancelCultureApplication = async (
  id: number,
  data: CultureApplicationLookupRequest
): Promise<CultureApplication> => {
  const response = await apiFetch(`${API_V1}/culture/applications/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '신청 취소에 실패했습니다')
  return response.json()
}

// 신청 목록 조회 (관리자)
export const getCultureApplications = async (params?: {
  class_id?: number
  status?: CultureApplicationStatus
}): Promise<CultureApplication[]> => {
  const search = new URLSearchParams()
  if (params?.class_id) search.set('class_id', String(params.class_id))
  if (params?.status) search.set('status', params.status)
  const qs = search.toString()
  const response = await apiFetch(
    `${API_V1}/culture/applications${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() }
  )
  if (!response.ok) return throwDetail(response, '신청 목록을 불러오지 못했습니다')
  return response.json()
}

// 신청 상태 변경 (관리자)
export const updateCultureApplicationStatus = async (
  id: number,
  status: CultureApplicationStatus
): Promise<CultureApplication> => {
  const response = await apiFetch(`${API_V1}/culture/applications/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) return throwDetail(response, '상태 변경에 실패했습니다')
  return response.json()
}

// ── 공지사항 ──────────────────────────────────────────────────────────

// 공개 공지 목록 (인증 불필요)
export const getCultureNotices = async (): Promise<CultureNotice[]> => {
  const response = await apiFetch(`${API_V1}/culture/notices`)
  if (!response.ok) return throwDetail(response, '공지사항을 불러오지 못했습니다')
  return response.json()
}

// 전체 공지 목록 (관리자)
export const getAllCultureNotices = async (): Promise<CultureNotice[]> => {
  const response = await apiFetch(`${API_V1}/culture/notices/all`, {
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '공지사항을 불러오지 못했습니다')
  return response.json()
}

// 공지 생성 (관리자)
export const createCultureNotice = async (
  data: CreateCultureNoticeRequest
): Promise<CultureNotice> => {
  const response = await apiFetch(`${API_V1}/culture/notices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '공지 생성에 실패했습니다')
  return response.json()
}

// 공지 수정 (관리자)
export const updateCultureNotice = async (
  id: number,
  data: UpdateCultureNoticeRequest
): Promise<CultureNotice> => {
  const response = await apiFetch(`${API_V1}/culture/notices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) return throwDetail(response, '공지 수정에 실패했습니다')
  return response.json()
}

// 공지 삭제 (관리자)
export const deleteCultureNotice = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_V1}/culture/notices/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) return throwDetail(response, '공지 삭제에 실패했습니다')
}
