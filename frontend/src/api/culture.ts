// 문화교실 API
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
import { request, requestRaw } from './utils/request'

// ── 강좌 ──────────────────────────────────────────────────────────────

// 공개 강좌 목록 (인증 불필요)
export const getCultureClasses = async (): Promise<CultureClass[]> => {
  return request<CultureClass[]>('/culture/classes', { errorMessage: '강좌 목록을 불러오지 못했습니다' })
}

// 전체 강좌 목록 + 신청자 수 (관리자)
export const getAllCultureClasses = async (): Promise<CultureClassAdmin[]> => {
  return request<CultureClassAdmin[]>('/culture/classes/all', { errorMessage: '강좌 목록을 불러오지 못했습니다' })
}

// 강좌 생성 (관리자)
export const createCultureClass = async (
  data: CreateCultureClassRequest
): Promise<CultureClass> => {
  return request<CultureClass>('/culture/classes', {
    method: 'POST',
    json: data,
    errorMessage: '강좌 생성에 실패했습니다',
  })
}

// 강좌 수정 (관리자)
export const updateCultureClass = async (
  id: number,
  data: UpdateCultureClassRequest
): Promise<CultureClass> => {
  return request<CultureClass>(`/culture/classes/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '강좌 수정에 실패했습니다',
  })
}

// 강좌 삭제 (관리자)
export const deleteCultureClass = async (id: number): Promise<void> => {
  await requestRaw(`/culture/classes/${id}`, { method: 'DELETE', errorMessage: '강좌 삭제에 실패했습니다' })
}

// ── 수강신청 ──────────────────────────────────────────────────────────

// 수강신청 (비회원 가능)
export const createCultureApplication = async (
  data: CreateCultureApplicationRequest
): Promise<CultureApplication> => {
  return request<CultureApplication>('/culture/applications', {
    method: 'POST',
    json: data,
    errorMessage: '수강신청에 실패했습니다',
  })
}

// 신청 내역 조회 (전화번호 + 생년월일 본인 확인)
export const lookupCultureApplications = async (
  data: CultureApplicationLookupRequest
): Promise<CultureApplication[]> => {
  return request<CultureApplication[]>('/culture/applications/lookup', {
    method: 'POST',
    json: data,
    errorMessage: '신청 내역 조회에 실패했습니다',
  })
}

// 신청 취소 (본인 확인)
export const cancelCultureApplication = async (
  id: number,
  data: CultureApplicationLookupRequest
): Promise<CultureApplication> => {
  return request<CultureApplication>(`/culture/applications/${id}/cancel`, {
    method: 'POST',
    json: data,
    errorMessage: '신청 취소에 실패했습니다',
  })
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
  return request<CultureApplication[]>(`/culture/applications${qs ? `?${qs}` : ''}`, { errorMessage: '신청 목록을 불러오지 못했습니다' })
}

// 신청 상태 변경 (관리자)
export const updateCultureApplicationStatus = async (
  id: number,
  status: CultureApplicationStatus
): Promise<CultureApplication> => {
  return request<CultureApplication>(`/culture/applications/${id}/status`, {
    method: 'PATCH',
    json: { status },
    errorMessage: '상태 변경에 실패했습니다',
  })
}

// ── 공지사항 ──────────────────────────────────────────────────────────

// 공개 공지 목록 (인증 불필요)
export const getCultureNotices = async (): Promise<CultureNotice[]> => {
  return request<CultureNotice[]>('/culture/notices', { errorMessage: '공지사항을 불러오지 못했습니다' })
}

// 전체 공지 목록 (관리자)
export const getAllCultureNotices = async (): Promise<CultureNotice[]> => {
  return request<CultureNotice[]>('/culture/notices/all', { errorMessage: '공지사항을 불러오지 못했습니다' })
}

// 공지 생성 (관리자)
export const createCultureNotice = async (
  data: CreateCultureNoticeRequest
): Promise<CultureNotice> => {
  return request<CultureNotice>('/culture/notices', {
    method: 'POST',
    json: data,
    errorMessage: '공지 생성에 실패했습니다',
  })
}

// 공지 수정 (관리자)
export const updateCultureNotice = async (
  id: number,
  data: UpdateCultureNoticeRequest
): Promise<CultureNotice> => {
  return request<CultureNotice>(`/culture/notices/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: '공지 수정에 실패했습니다',
  })
}

// 공지 삭제 (관리자)
export const deleteCultureNotice = async (id: number): Promise<void> => {
  await requestRaw(`/culture/notices/${id}`, { method: 'DELETE', errorMessage: '공지 삭제에 실패했습니다' })
}
