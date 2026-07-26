// Admin API
import { API_V1, apiFetch } from '../config/api'
import type { PrayerGroup } from '../types/prayer'

// 관리자용 그룹 목록 조회
export interface AdminGroupListResponse {
  success: boolean
  data: {
    items: Array<PrayerGroup & {
      creator_id: number
      creator_name: string
      updated_at: string
    }>
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export const fetchAdminGroups = async (
  page: number = 1,
  limit: number = 20
): Promise<AdminGroupListResponse> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(
    `${API_V1}/admin/groups?page=${page}&limit=${limit}`,
    { headers }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 말씀 반응 통계 (익명 집계 — 개인 식별 정보 없음)
export interface EngagementCount {
  total: number
  users: number
}

export interface EngagementVerse {
  verse_id: number
  book_number: number
  book_name: string
  chapter: number
  verse: number
  text: string
  count: number
  users: number
  /** 밑줄 단어 TOP에서만: 이 구절에서 밑줄 그어진 단어들 (많이 그은 순) */
  words?: string[]
}

export interface BibleEngagementData {
  summary: {
    favorites: EngagementCount
    notes: EngagementCount
    highlights: EngagementCount
    word_notes: EngagementCount
  }
  top_favorites: EngagementVerse[]
  top_notes: EngagementVerse[]
  top_underlines: EngagementVerse[]
  top_words: Array<{ word: string; count: number }>
  book_distribution: Array<{ book_number: number; book_name: string; count: number }>
}

export const fetchBibleEngagement = async (
  days?: number
): Promise<BibleEngagementData> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const query = days ? `?days=${days}` : ''
  const response = await apiFetch(`${API_V1}/admin/bible-engagement${query}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '말씀 반응 통계를 불러오는데 실패했습니다')
  }

  const json = await response.json()
  return json.data
}

// 관리자용 그룹 삭제
export const deleteAdminGroup = async (groupId: number): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  }

  const response = await apiFetch(`${API_V1}/admin/groups/${groupId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '그룹 삭제에 실패했습니다')
  }
}
