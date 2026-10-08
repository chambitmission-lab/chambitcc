// 이번 주 공동 기도제목 단일 쿼리.
// 홈 배너·참비 환영 화면·/prayer-topics·예배 스크린·집중 기도 하단이 전부 같은 데이터를 쓰는데,
// 각자 useEffect 로 직접 부르거나 queryFn 을 복붙해 캐시를 못 나눴다(홈에서 받아 둔 걸 다시 요청).
// 키는 weeklyPrayerKeys.current() 하나 — 주간 단위 데이터라 10분 신선·30분 보관이면 충분하다.
import { useQuery } from '@tanstack/react-query'
import { getCurrentWeeklyPrayer, getWeeklyPrayer, getWeeklyPrayerList } from '../api/weeklyPrayer'
import type { RequestPriority } from '../api/utils/request'
import { weeklyPrayerKeys } from './queryKeys'

const STALE_MS = 10 * 60 * 1000
const GC_MS = 30 * 60 * 1000

/** useQuery/fetchQuery 양쪽에서 같은 키·queryFn·캐시 수명을 쓰기 위한 옵션 묶음 */
export const currentWeeklyPrayerQuery = (priority?: RequestPriority) => ({
  queryKey: weeklyPrayerKeys.current(),
  // 이번 주 기도제목이 없으면 404('NOT_FOUND') — 재시도해도 같으니 한 번만 묻는다
  queryFn: () => getCurrentWeeklyPrayer({ priority }),
  staleTime: STALE_MS,
  gcTime: GC_MS,
  retry: false as const,
})

export const weeklyPrayerListQuery = () => ({
  queryKey: weeklyPrayerKeys.list(),
  queryFn: () => getWeeklyPrayerList(),
  staleTime: STALE_MS,
  gcTime: GC_MS,
  retry: false as const,
})

interface CurrentOptions {
  enabled?: boolean
  /** 콜드 홈에서 기도 목록 게이트를 기다리지 않게 'high' 로 올릴 수 있다(utils/requestPriority) */
  priority?: RequestPriority
}

export const useCurrentWeeklyPrayer = (options: CurrentOptions = {}) =>
  useQuery({
    ...currentWeeklyPrayerQuery(options.priority),
    enabled: options.enabled,
    refetchOnWindowFocus: false,
  })

/** 특정 주차 상세 (예배 스크린 ?id=) — id 가 없으면 묻지 않는다 */
export const useWeeklyPrayerDetail = (id: number | null) =>
  useQuery({
    queryKey: weeklyPrayerKeys.detail(id ?? 0),
    queryFn: () => getWeeklyPrayer(id as number),
    enabled: id != null,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    retry: false,
    refetchOnWindowFocus: false,
  })
