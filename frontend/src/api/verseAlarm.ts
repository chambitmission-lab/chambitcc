import { API_V1 } from '../config/api'
import { request, requestRaw } from './utils/request'
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
  return request<VerseAlarm[]>(BASE, { auth: 'required', errorMessage: '알람 목록을 가져올 수 없습니다' })
}

export const createVerseAlarm = async (
  payload: VerseAlarmCreatePayload
): Promise<VerseAlarm> => {
  return request<VerseAlarm>(BASE, {
    method: 'POST',
    auth: 'required',
    json: payload,
    errorMessage: '알람 등록에 실패했습니다',
  })
}

export const updateVerseAlarm = async (
  alarmId: number,
  payload: VerseAlarmUpdatePayload
): Promise<VerseAlarm> => {
  return request<VerseAlarm>(`${BASE}/${alarmId}`, {
    method: 'PATCH',
    auth: 'required',
    json: payload,
    errorMessage: '알람 수정에 실패했습니다',
  })
}

export const deleteVerseAlarm = async (alarmId: number): Promise<void> => {
  await requestRaw(`${BASE}/${alarmId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '알람 삭제에 실패했습니다',
  })
}
