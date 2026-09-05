// 목양컬럼 API
import type { Column, ColumnEngagement, CreateColumnRequest, UpdateColumnRequest } from '../types/column'
import { request, requestRaw } from './utils/request'

// 목양컬럼 목록 조회 (인증 불필요, 선택적 키워드 검색)
export const getColumns = async (q?: string): Promise<Column[]> => {
  const params = new URLSearchParams()
  if (q && q.trim()) params.set('q', q.trim())
  const qs = params.toString()
  return request<Column[]>(`/columns${qs ? `?${qs}` : ''}`, { errorMessage: 'Failed to fetch columns' })
}

// 목양컬럼 상세 조회 (인증 불필요)
export const getColumn = async (id: number): Promise<Column> => {
  return request<Column>(`/columns/${id}`, { errorMessage: 'Failed to fetch column' })
}

// 편지에 아멘 토글 (로그인 필수)
export const toggleColumnAmen = async (id: number): Promise<ColumnEngagement> => {
  return request<ColumnEngagement>(`/columns/${id}/amen`, { method: 'POST', errorMessage: 'Failed to toggle amen' })
}

// 편지를 끝까지 읽었음을 기록 (로그인 필수, 1인 1회 — 멱등)
export const markColumnRead = async (id: number): Promise<ColumnEngagement> => {
  return request<ColumnEngagement>(`/columns/${id}/read`, { method: 'POST', errorMessage: 'Failed to mark column as read' })
}

// 목양컬럼 생성 (관리자)
export const createColumn = async (data: CreateColumnRequest): Promise<Column> => {
  return request<Column>('/columns', {
    method: 'POST',
    json: data,
    errorMessage: 'Failed to create column',
  })
}

// 목양컬럼 수정 (관리자)
export const updateColumn = async (id: number, data: UpdateColumnRequest): Promise<Column> => {
  return request<Column>(`/columns/${id}`, {
    method: 'PUT',
    json: data,
    errorMessage: 'Failed to update column',
  })
}

// 목양컬럼 삭제 (관리자)
export const deleteColumn = async (id: number): Promise<void> => {
  await requestRaw(`/columns/${id}`, { method: 'DELETE', errorMessage: 'Failed to delete column' })
}
