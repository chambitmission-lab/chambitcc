import { useQuery } from '@tanstack/react-query'
import { getTodayMeditation } from '../api/meditation'
import type { EmotionTag, TimeOfDay } from '../types/meditation'

export const deriveTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 4 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  return 'evening'
}

interface UseDailyMeditationOptions {
  emotion?: EmotionTag
  /** override 시간대 (테스트/수동 전환용) */
  timeOfDay?: TimeOfDay
}

export const useDailyMeditation = (options: UseDailyMeditationOptions = {}) => {
  const now = new Date()
  const timeOfDay = options.timeOfDay ?? deriveTimeOfDay(now.getHours())
  const emotion = options.emotion

  // 로컬(KST) 날짜 기준 키. toISOString()은 UTC라 자정~오전9시(KST)엔 아직 '어제'
  // 로 남아, 캐시 우선(refetchOnMount:false)+영구캐시와 겹치면 어제 묵상이 그대로 보인다.
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return useQuery({
    queryKey: ['meditation', 'today', dateKey, timeOfDay, emotion ?? null],
    queryFn: () => getTodayMeditation({ time_of_day: timeOfDay, emotion }),
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
}
