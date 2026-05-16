// 집중 기도 세션 API
// 로그인 사용자만 호출 가능. 비로그인이면 로컬에서만 처리하도록 호출부에서 분기.
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'

export type PrayerThemeId =
  | 'thanks'
  | 'repentance'
  | 'anxiety'
  | 'intercession'
  | 'decision'
  | 'freedom'

export type AmbienceId = 'silent' | 'rain' | 'dawn' | 'piano' | 'candle' | 'church'

export interface CreatePrayerSessionRequest {
  duration: number  // 초
  theme?: PrayerThemeId | null
  verse_id?: number | null
  ambience?: AmbienceId | null
  mood?: string | null
  note?: string | null
  completed_at?: string  // ISO 8601
}

export interface PrayerSessionResponse {
  id: number
  user_id: number
  duration: number
  theme: string | null
  verse_id: number | null
  ambience: string | null
  mood: string | null
  note: string | null
  completed_at: string
  created_at: string
}

export interface PrayerSessionStats {
  total_sessions: number
  total_minutes: number
  total_seconds: number
  streak_days: number
  this_week_sessions: number
  this_week_minutes: number
  average_duration_minutes: number
  most_used_duration: number | null
  last_session_date: string | null
}

const cleanPayload = (data: CreatePrayerSessionRequest): Record<string, unknown> => {
  const out: Record<string, unknown> = { duration: data.duration }
  if (data.theme) out.theme = data.theme
  if (data.verse_id !== undefined && data.verse_id !== null) out.verse_id = data.verse_id
  if (data.ambience) out.ambience = data.ambience
  if (data.mood) out.mood = data.mood
  if (data.note) out.note = data.note
  if (data.completed_at) out.completed_at = data.completed_at
  return out
}

/** 세션 1회 기록 (로그인 필수) */
export const createPrayerSession = async (
  data: CreatePrayerSessionRequest,
): Promise<PrayerSessionResponse> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/prayer-sessions`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(cleanPayload(data)),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || '기도 세션 기록에 실패했습니다')
  }
  const json = await response.json()
  return json.data as PrayerSessionResponse
}

/** 통계 조회 (로그인 필수) */
export const getPrayerSessionStats = async (): Promise<PrayerSessionStats> => {
  requireAuth()
  const response = await apiFetch(`${API_V1}/prayer-sessions/stats`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('통계 조회에 실패했습니다')
  }
  const json = await response.json()
  return json.data as PrayerSessionStats
}

/** 로컬 폴백 — 비로그인 시 사용 */
const LOCAL_KEY = 'prayer_focus_local_sessions'

interface LocalSession {
  duration: number
  theme?: string | null
  completed_at: string
}

export const recordLocalSession = (data: CreatePrayerSessionRequest): void => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const list: LocalSession[] = raw ? JSON.parse(raw) : []
    list.unshift({
      duration: data.duration,
      theme: data.theme ?? null,
      completed_at: data.completed_at ?? new Date().toISOString(),
    })
    // 최대 200개만 보관
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 200)))
  } catch {
    // 저장 실패는 무시
  }
}

export const getLocalSessions = (): LocalSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as LocalSession[]) : []
  } catch {
    return []
  }
}
