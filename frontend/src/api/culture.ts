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

// 공개 강좌 목록 (인증 불필요) — 상세는 카드에 쓰는 칸만 온다(slim). 계획표·꼭지는 getCultureClass
export const getCultureClasses = async (): Promise<CultureClass[]> => {
  return request<CultureClass[]>('/culture/classes?slim=1', { errorMessage: '강좌 목록을 불러오지 못했습니다' })
}

// 공개 강좌 한 건 — 상세 전체 (강좌를 열 때)
export const getCultureClass = async (id: number): Promise<CultureClass> => {
  return request<CultureClass>(`/culture/classes/${id}`, { errorMessage: '강좌 안내를 불러오지 못했습니다' })
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

/** 강좌 사진 업로드 (관리자, R2). URL 저장은 등록/수정 요청이 담당한다.
 * withThumb: 대표 사진은 목록 카드용 작은 사본도 함께 만든다(thumbUrl) */
export const uploadCultureImage = async (
  file: File,
  withThumb = false,
): Promise<{ url: string; thumbUrl: string | null }> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<{ url: string; thumb_url?: string | null }>(
    `/culture/upload-image${withThumb ? '?thumb=1' : ''}`,
    {
      method: 'POST',
      body: formData,
      errorMessage: '사진 업로드에 실패했습니다',
    },
  )
  return { url: body.url, thumbUrl: body.thumb_url ?? null }
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
