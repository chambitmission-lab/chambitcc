// 목회 비서 (규칙 기반) — 심방 제안 · 성도 브리핑
import { pastorGet } from './_http'

export type ReasonTone = 'urgent' | 'care' | 'joy'

export interface Suggestion {
  user_id: number
  name: string
  avatar_url: string | null
  church_title: string | null
  district: string | null
  phone: string | null
  last_visit: string | null
  score: number
  reasons: Array<{ code: string; label: string; tone: ReasonTone }>
}

export interface SuggestionData {
  total: number
  items: Suggestion[]
}

export interface Briefing {
  headline: string
  points: Array<{
    kind: 'situation' | 'visit' | 'plan' | 'memo' | 'follow_up' | 'activity' | 'prayer' | 'birthday' | 'family' | 'note'
    text: string
    tone: 'info' | 'urgent' | 'care' | 'joy'
  }>
}

export const fetchSuggestions = (): Promise<SuggestionData> =>
  pastorGet('/pastor/assistant/suggestions', '목회 비서 제안을 불러오는데 실패했습니다')

export const fetchBriefing = (id: number): Promise<Briefing> =>
  pastorGet(`/pastor/members/${id}/briefing`, '브리핑을 불러오는데 실패했습니다')
