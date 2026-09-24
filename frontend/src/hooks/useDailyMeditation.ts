import { useQuery, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query'
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

// 이번 세션에서 노출 기록(preview 아님)으로 받은 카드 키. 감정 카드는 preview 로
// 프리패치되므로, 실제로 고른 순간 캐시 히트면 서버 호출이 없어 노출이 안 남는다 →
// 그때 한 번만 기록용 요청을 보낸다. 같은 날 같은 카드라 응답은 버려도 된다.
const recordedKeys = new Set<string>()

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

  const qc = useQueryClient()
  const queryKey = meditationKey(dateKey, timeOfDay, emotion)
  const keyStr = queryKey.join('|')

  const query = useQuery({
    queryKey,
    queryFn: () => {
      recordedKeys.add(keyStr)
      return getTodayMeditation({ time_of_day: timeOfDay, emotion })
    },
    staleTime: STALE,
    retry: false,
    // 감정 칩을 바꿔 키가 달라져도 이전 카드를 그대로 두고 조용히 갈아끼운다.
    // (없으면 isLoading → 스켈레톤으로 화면 전체가 "새로고침"되듯 깜빡인다)
    placeholderData: keepPreviousData,
  })

  // 프리패치(preview)로 채워진 감정 카드를 실제로 보게 된 순간 노출을 한 번 기록한다.
  // 이 키로 queryFn 이 직접 돌았다면 이미 기록됐으므로 건너뛴다.
  // (hasOwnData: keepPreviousData 로 이전 감정 카드가 보이는 동안은 아직 이 카드가 아니다)
  const hasOwnData = qc.getQueryData(queryKey) !== undefined && !query.isPlaceholderData
  useEffect(() => {
    if (!emotion || !hasOwnData || recordedKeys.has(keyStr)) return
    recordedKeys.add(keyStr)
    void getTodayMeditation({ time_of_day: timeOfDay, emotion }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr, hasOwnData])

  return query
}

/**
 * 홈 묵상 카드(감정 없음)를 미리 받아 둔다 — 로그인 직후 마중 연출이 도는 동안 호출.
 * 로그인은 캐시를 통째로 비우므로(사용자별 분리) 홈에 도착하면 이 카드만 스켈레톤으로
 * API 왕복을 기다렸다. 키·staleTime 을 useDailyMeditation 과 맞춰 도착 즉시 캐시 히트가 된다.
 */
export const prefetchTodayMeditation = (qc: QueryClient) => {
  const now = new Date()
  const timeOfDay = deriveTimeOfDay(now.getHours())
  return qc
    .prefetchQuery({
      queryKey: meditationKey(localDateKey(now), timeOfDay),
      queryFn: () => getTodayMeditation({ time_of_day: timeOfDay }),
      staleTime: STALE,
    })
    .catch(() => {})
}

/**
 * 감정별 묵상 6종을 진입 직후 미리 받아 둔다 — 첫 클릭도 캐시 히트로 즉시 전환.
 * preview 로 받아 노출 이력은 남기지 않는다(실제로 고를 때 useDailyMeditation 이 기록).
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
            queryFn: () => getTodayMeditation({ time_of_day: timeOfDay, emotion, preview: true }),
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
