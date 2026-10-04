// 예배 시간표(주일+평일) 단일 쿼리.
// /worship·홈 레일·⌘K·인사 레일·랜딩이 전부 같은 데이터를 쓰는데, 각자 queryFn 을
// 복붙하거나(캐시는 공유) 다른 키를 쓰면(랜딩) 중복 요청 + invalidate 누락이 생겼다.
// 키는 worshipKeys.services() 하나 — 관리자가 /worship 에서 고치면 전 화면이 함께 갱신된다.
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getSundayServices, getWeekdayServices } from '../api/worship'
import type { WorshipService } from '../types/worship'
import { worshipKeys } from './queryKeys'

export const fetchAllWorshipServices = async (): Promise<WorshipService[]> => {
  const [sunday, weekday] = await Promise.all([getSundayServices(), getWeekdayServices()])
  return [...sunday, ...weekday]
}

interface Options<T> {
  enabled?: boolean
  /** 일부만 쓰는 화면(랜딩=주일만)은 select 로 좁힌다 — 캐시는 그대로 공유 */
  select?: (services: WorshipService[]) => T
}

export function useWorshipServices(options?: Options<WorshipService[]>): UseQueryResult<WorshipService[], Error>
export function useWorshipServices<T>(options: Options<T>): UseQueryResult<T, Error>
export function useWorshipServices<T = WorshipService[]>(options: Options<T> = {}) {
  return useQuery<WorshipService[], Error, T>({
    queryKey: worshipKeys.services(),
    queryFn: fetchAllWorshipServices,
    enabled: options.enabled,
    select: options.select,
    // 예배 시간표는 사실상 고정 데이터
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
}
