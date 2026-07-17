import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export interface MeditationRecord {
  id: number
  record_date: string
  verse_reference: string | null
  verse_text: string | null
  content: string
  emotion: string | null
  created_at: string | null
}

export interface MeditationRecordCreatePayload {
  content: string
  verse_reference?: string | null
  verse_text?: string | null
  emotion?: string | null
}

export interface MeditationStreak {
  current_streak: number
  total_records: number
  today_recorded: boolean
}

export const createMeditationRecord = async (
  payload: MeditationRecordCreatePayload
): Promise<MeditationRecord> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/meditation/records`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '묵상 기록 저장에 실패했습니다')
  }
  return response.json()
}

export const getMeditationRecords = async (
  limit = 30
): Promise<MeditationRecord[]> => {
  requireAuth()
  const response = await apiFetch(
    `${API_V1}/meditation/records?limit=${limit}`,
    { headers: getAuthHeaders() }
  )
  if (!response.ok) throw new Error('묵상 기록을 가져올 수 없습니다')
  return response.json()
}

export const getMeditationStreak = async (): Promise<MeditationStreak> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/meditation/streak`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('스트릭 정보를 가져올 수 없습니다')
  return response.json()
}
