import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export interface VerseAlarm {
  id: number
  /** KST 24시간제 "HH:MM" */
  time_hhmm: string
  /** 월요일부터 7자리 플래그 (예: 평일 "1111100") */
  days_of_week: string
  label: string | null
  is_active: boolean
  last_sent_date: string | null
  created_at: string | null
}

export interface VerseAlarmCreatePayload {
  time_hhmm: string
  days_of_week: string
  label?: string | null
  is_active?: boolean
}

export type VerseAlarmUpdatePayload = Partial<VerseAlarmCreatePayload>

const BASE = `${API_V1}/verse-alarms`

export const getMyVerseAlarms = async (): Promise<VerseAlarm[]> => {
  requireAuth()
  const response = await apiFetch(BASE, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error('알람 목록을 가져올 수 없습니다')
  return response.json()
}

export const createVerseAlarm = async (
  payload: VerseAlarmCreatePayload
): Promise<VerseAlarm> => {
  requireAuth()
  const response = await apiFetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '알람 등록에 실패했습니다')
  }
  return response.json()
}

export const updateVerseAlarm = async (
  alarmId: number,
  payload: VerseAlarmUpdatePayload
): Promise<VerseAlarm> => {
  requireAuth()
  const response = await apiFetch(`${BASE}/${alarmId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || '알람 수정에 실패했습니다')
  }
  return response.json()
}

export const deleteVerseAlarm = async (alarmId: number): Promise<void> => {
  requireAuth()
  const response = await apiFetch(`${BASE}/${alarmId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('알람 삭제에 실패했습니다')
}
