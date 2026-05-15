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

  const dateKey = now.toISOString().slice(0, 10)

  return useQuery({
    queryKey: ['meditation', 'today', dateKey, timeOfDay, emotion ?? null],
    queryFn: () => getTodayMeditation({ time_of_day: timeOfDay, emotion }),
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
}
