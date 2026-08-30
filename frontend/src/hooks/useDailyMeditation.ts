import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getTodayMeditation } from '../api/meditation'
import type { EmotionTag, TimeOfDay } from '../types/meditation'

export const deriveTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 4 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  return 'evening'
}

const ALL_EMOTIONS: EmotionTag[] = ['weary', 'anxious', 'lonely', 'grateful', 'joyful', 'peaceful']
const STALE = 1000 * 60 * 30

const localDateKey = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const meditationKey = (dateKey: string, timeOfDay: TimeOfDay, emotion?: EmotionTag) =>
  ['meditation', 'today', dateKey, timeOfDay, emotion ?? null] as const

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
  const dateKey = localDateKey(now)

  return useQuery({
    queryKey: meditationKey(dateKey, timeOfDay, emotion),
    queryFn: () => getTodayMeditation({ time_of_day: timeOfDay, emotion }),
    staleTime: STALE,
    retry: false,
    // 감정 칩을 바꿔 키가 달라져도 이전 카드를 그대로 두고 조용히 갈아끼운다.
    // (없으면 isLoading → 스켈레톤으로 화면 전체가 "새로고침"되듯 깜빡인다)
    placeholderData: keepPreviousData,
  })
}

/**
 * 감정별 묵상 6종을 진입 직후 미리 받아 둔다 — 첫 클릭도 캐시 히트로 즉시 전환.
 * 기본(감정 없음) 쿼리가 먼저 끝난 뒤 순차로 깔아, 첫 화면 응답을 가로막지 않는다.
 */
export const usePrefetchEmotionMeditations = (timeOfDayOverride?: TimeOfDay, enabled = true) => {
  const qc = useQueryClient()
  useEffect(() => {
    if (!enabled) return
    const now = new Date()
    const timeOfDay = timeOfDayOverride ?? deriveTimeOfDay(now.getHours())
    const dateKey = localDateKey(now)
    let cancelled = false
    const run = async () => {
      for (const emotion of ALL_EMOTIONS) {
        if (cancelled) return
        await qc
          .prefetchQuery({
            queryKey: meditationKey(dateKey, timeOfDay, emotion),
            queryFn: () => getTodayMeditation({ time_of_day: timeOfDay, emotion }),
            staleTime: STALE,
          })
          .catch(() => {})
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [qc, timeOfDayOverride, enabled])
}
