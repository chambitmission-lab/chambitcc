import { API_V1, apiFetch } from '../config/api'
import type { MeditationCard, TimeOfDay, EmotionTag } from '../types/meditation'

interface GetMeditationParams {
  time_of_day?: TimeOfDay
  emotion?: EmotionTag
}

export const getTodayMeditation = async (
  params: GetMeditationParams = {}
): Promise<MeditationCard> => {
  const qs = new URLSearchParams()
  if (params.time_of_day) qs.set('time_of_day', params.time_of_day)
  if (params.emotion) qs.set('emotion', params.emotion)

  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = `${API_V1}/meditation/today${qs.toString() ? `?${qs.toString()}` : ''}`
  const response = await apiFetch(url, { headers })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND')
    }
    throw new Error('Failed to fetch today meditation')
  }

  return response.json()
}
