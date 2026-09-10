// 섬기는 사람들 API (church_people)
// 조회는 공개(인증 불필요), 나머지는 관리자.
import { API_V1 } from '../config/api'
import type {
  PeopleDirectory,
  Person,
  PersonCreatePayload,
  PersonUpdatePayload,
} from '../types/people'
import { request, requestRaw, type UntypedJson } from './utils/request'

const BASE = `${API_V1}/people`

const EMPTY: PeopleDirectory = { leaders: [], people: [] }

// ── 공개 ─────────────────────────────────────────────

/**
 * 대표(담임·원로목사) + 교역자/선교사/장로/직원 전체.
 * 마이그레이션 전이거나 등록이 없으면 빈 목록 — /people 이 에러 화면 대신
 * 안내 문구를 그리게 한다.
 */
export const fetchPeople = async (): Promise<PeopleDirectory> => {
  try {
    return await request<PeopleDirectory>(BASE)
  } catch (error) {
    console.warn('people API not available:', error)
    return EMPTY
  }
}

// ── 관리자 ───────────────────────────────────────────

/** 비공개까지 포함한 전체 목록 */
export const fetchAllPeople = async (): Promise<Person[]> => {
  return request<Person[]>(`${BASE}/admin/all`, {
    errorMessage: '섬기는 사람들 목록을 불러오지 못했습니다',
  })
}

export const createPerson = async (data: PersonCreatePayload): Promise<Person> => {
  return request<Person>(BASE, {
    method: 'POST',
    json: data,
    errorMessage: '등록에 실패했습니다',
  })
}

export const updatePerson = async (
  personId: number,
  data: PersonUpdatePayload,
): Promise<Person> => {
  return request<Person>(`${BASE}/${personId}`, {
    method: 'PUT',
    json: data,
    errorMessage: '수정에 실패했습니다',
  })
}

/** 같은 탭 안에서 한 칸 이동 */
export const movePerson = async (personId: number, direction: 'up' | 'down'): Promise<void> => {
  await requestRaw(`${BASE}/${personId}/move`, {
    method: 'PATCH',
    json: { direction },
    errorMessage: '순서 변경에 실패했습니다',
  })
}

export const deletePerson = async (personId: number): Promise<void> => {
  await requestRaw(`${BASE}/${personId}`, {
    method: 'DELETE',
    errorMessage: '삭제에 실패했습니다',
  })
}

/** 인물 사진 업로드 (R2). URL 저장은 등록/수정 요청이 담당한다 */
export const uploadPersonPhoto = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<UntypedJson>(`${BASE}/upload-photo`, {
    method: 'POST',
    body: formData,
    errorMessage: '사진 업로드에 실패했습니다',
  })
  return body.url
}
