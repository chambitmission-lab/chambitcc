import { request } from './utils/request'
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
  return request<MeditationRecord>('/meditation/records', {
    method: 'POST',
    auth: 'required',
    json: payload,
    errorMessage: '묵상 기록 저장에 실패했습니다',
  })
}

export const getMeditationRecords = async (
  limit = 30
): Promise<MeditationRecord[]> => {
  return request<MeditationRecord[]>(`/meditation/records?limit=${limit}`, { auth: 'required', errorMessage: '묵상 기록을 가져올 수 없습니다' })
}

export const getMeditationStreak = async (): Promise<MeditationStreak> => {
  return request<MeditationStreak>('/meditation/streak', { auth: 'required', errorMessage: '스트릭 정보를 가져올 수 없습니다' })
}
