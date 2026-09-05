// 주보 API
import type { Bulletin, BulletinUpdatePayload } from '../types/bulletin'
import { request, requestRaw, type UntypedJson } from './utils/request'

/**
 * 주보 목록 조회
 *
 * fresh=true 는 관리자 화면용 — 목록 응답에 60초 공개 캐시가 붙어 있어서,
 * 방금 수정/삭제한 결과가 그대로 안 보이면 "수정이 안 된다"로 읽힌다.
 */
export const getBulletins = async (skip = 0, limit = 10, fresh = false): Promise<Bulletin[]> => {
  const data = await request<UntypedJson>(`/bulletins?skip=${skip}&limit=${limit}`, {
    cache: fresh ? 'no-store' : undefined,
    errorMessage: '주보 목록을 불러오는데 실패했습니다',
  })
  
  // 응답이 배열 형식
  if (Array.isArray(data)) {
    return data
  }
  
  return []
}

/**
 * 주보 상세 조회
 *
 * countView=false 는 관리자 수정 화면처럼 페이지 목록만 필요한 조회 —
 * 조회수를 올리지 않는다.
 */
export const getBulletinDetail = async (id: number, countView = true): Promise<Bulletin> => {
  return request<Bulletin>(`/bulletins/${id}${countView ? '' : '?count_view=false'}`, {
    cache: countView ? undefined : 'no-store',
    errorMessage: '주보를 불러오는데 실패했습니다',
  })
}

/**
 * 주보 생성 (관리자 전용) - multipart/form-data 사용
 */
export const createBulletin = async (
  title: string,
  bulletinDate: string,
  description: string,
  files: File[]
): Promise<Bulletin> => {
  
  const formData = new FormData()
  formData.append('title', title)
  formData.append('bulletin_date', bulletinDate)
  if (description) {
    formData.append('description', description)
  }
  
  // 파일들 추가
  files.forEach((file) => {
    formData.append('files', file)
  })
  
  return request<Bulletin>('/bulletins', {
    method: 'POST',
    body: formData,
    errorMessage: '주보 생성에 실패했습니다',
  })
}

/**
 * 주보 정보 수정 (관리자 전용) — 제목·날짜·설명
 *
 * 페이지 이미지는 별도 엔드포인트(추가/삭제/순서)로 다룬다.
 */
export const updateBulletin = async (
  id: number,
  payload: BulletinUpdatePayload
): Promise<Bulletin> => {
  return request<Bulletin>(`/bulletins/${id}`, {
    method: 'PUT',
    json: payload,
    errorMessage: '주보 수정에 실패했습니다',
  })
}

/**
 * 주보 페이지 추가 (관리자 전용)
 * pageNumber 를 생략하면 마지막 페이지 뒤에 붙는다. 새 페이지 id 를 돌려준다.
 */
export const addBulletinPage = async (
  bulletinId: number,
  file: File,
  pageNumber?: number
): Promise<number> => {
  const formData = new FormData()
  formData.append('file', file)
  if (pageNumber !== undefined) {
    formData.append('page_number', String(pageNumber))
  }

  const data = await request<UntypedJson>(`/bulletins/${bulletinId}/pages`, {
    method: 'POST',
    body: formData,
    errorMessage: '페이지 추가에 실패했습니다',
  })
  return data.page_id as number
}

/**
 * 주보 페이지 삭제 (관리자 전용)
 */
export const deleteBulletinPage = async (pageId: number): Promise<void> => {
  await requestRaw(`/bulletins/pages/${pageId}`, { method: 'DELETE', errorMessage: '페이지 삭제에 실패했습니다' })
}

/**
 * 주보 페이지 순서 변경 (관리자 전용)
 * 최종 순서의 page id 를 전부 보내야 한다.
 */
export const reorderBulletinPages = async (
  bulletinId: number,
  pageIds: number[]
): Promise<void> => {
  await requestRaw(`/bulletins/${bulletinId}/pages/order`, {
    method: 'PUT',
    json: { page_ids: pageIds },
    errorMessage: '페이지 순서 변경에 실패했습니다',
  })
}

/**
 * 주보 삭제 (관리자 전용)
 */
export const deleteBulletin = async (id: number): Promise<void> => {
  await requestRaw(`/bulletins/${id}`, { method: 'DELETE', errorMessage: '주보 삭제에 실패했습니다' })
}
