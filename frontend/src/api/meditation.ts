import type { MeditationCard, TimeOfDay, EmotionTag } from '../types/meditation'
import { request, withStatusMessages } from './utils/request'

interface GetMeditationParams {
  time_of_day?: TimeOfDay
  emotion?: EmotionTag
  /** 프리패치용 — 서버가 노출 이력을 남기지 않는다(보지 않은 절이 '최근 본 절'로 쌓이지 않게) */
  preview?: boolean
}

export const getTodayMeditation = async (
  params: GetMeditationParams = {}
): Promise<MeditationCard> => {
  const qs = new URLSearchParams()
  if (params.time_of_day) qs.set('time_of_day', params.time_of_day)
  if (params.emotion) qs.set('emotion', params.emotion)
  if (params.preview) qs.set('preview', 'true')

  return withStatusMessages(
    request<MeditationCard>(`/meditation/today${qs.toString() ? `?${qs.toString()}` : ''}`, {
      errorMessage: 'Failed to fetch today meditation',
    }),
    { 404: 'NOT_FOUND' }
  )
}
