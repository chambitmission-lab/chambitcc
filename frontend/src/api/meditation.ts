import type { MeditationCard, TimeOfDay, EmotionTag } from '../types/meditation'
import { request, withStatusMessages } from './utils/request'

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

  return withStatusMessages(
    request<MeditationCard>(`/meditation/today${qs.toString() ? `?${qs.toString()}` : ''}`, {
      errorMessage: 'Failed to fetch today meditation',
    }),
    { 404: 'NOT_FOUND' }
  )
}
