import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useIsRestoring, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getHomeRail, type HomeRail } from '../api/home'
import { isApiError } from '../api/utils/request'
import { tokenStore } from '../utils/tokenStore'
import { prayerStatsKeys } from './queryKeys'
import { prayerKeys } from './usePrayersQuery'
import { situationKeys } from './useSituation'

export const homeRailKeys = {
  all: ['home', 'rail'] as const,
  bundle: () => [...homeRailKeys.all, 'bundle'] as const,
}

// 조각 훅들의 staleTime(주간 통계 15분·카테고리 30분·구절 10분·내 기도 10분) 중 가장 짧은 쪽에 맞춘다
const BUNDLE_STALE_MS = 1000 * 60 * 10

// ── 조각 훅 게이트 (useHomeSummary 와 같은 구조) ──────────────────────────────
// 묶음을 받는 동안 레일 위젯의 단건 훅은 enabled=false 로 기다린다(캐시가 있으면 그걸 보여 준다).
// NewHome 이 렌더 단계에서 켜야 레일 위젯의 첫 useQuery 가 보고 멈춘다 — 레일은 lazy 청크라 어차피
// NewHome 보다 늦게 마운트되지만, 청크가 캐시에 있으면 같은 프레임에 가깝게 뜬다.
let pending = false
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const setPending = (next: boolean) => {
  if (pending === next) return
  pending = next
  listeners.forEach((fn) => fn())
}
/** 묶음 엔드포인트가 없는(옛) 백엔드 — 이 세션에선 다시 묶음을 기다리게 하지 않는다 */
let unsupported = false

/** 레일 위젯이 단건 훅의 enabled 에 쓰는 게이트 — 레일 밖에서는 항상 false */
export const useHomeRailPending = () => useSyncExternalStore(subscribe, () => pending, () => false)

const armHomeRail = (qc: QueryClient) => {
  if (unsupported || !tokenStore.getAccess()) return
  const state = qc.getQueryState(homeRailKeys.bundle())
  const fresh = state?.data !== undefined && Date.now() - state.dataUpdatedAt < BUNDLE_STALE_MS
  if (!fresh) setPending(true)
}

/** 묶음 조각을 단건 키에 심는다 — 실패(failed)한 조각은 건너뛴다 */
const seedPieces = (qc: QueryClient, r: HomeRail) => {
  const failed = new Set(r.failed ?? [])
  if (!failed.has('weekly') && r.weekly) qc.setQueryData(prayerStatsKeys.weekly(), r.weekly)
  if (!failed.has('categories') && r.categories) qc.setQueryData(situationKeys.categories(), r.categories)
  // 내 최근 기도는 "없음"(null) 이 정상값 — 단건 훅도 items[0] ?? null 을 돌려준다
  if (!failed.has('my_latest_prayer')) qc.setQueryData(prayerKeys.mineLatest(), r.my_latest_prayer)
  if (!failed.has('pick') && r.pick) qc.setQueryData(situationKeys.verses(r.pick.category_id), r.pick.verses)
}

/**
 * PC 홈 우측 레일 묶음 — 이번주 기도 현황·상황 카테고리·내 최근 기도·참비의 오늘 추천을 요청 하나로.
 *
 * 레일 위젯 셋의 요청은 가벼운데(서버 단독 100ms 이하) 레일이 lazy 청크라 가장 늦게 마운트되고, 요청은
 * 일반 대기열(동시 3개) 맨 뒤에 서서 콜드 진입에 3.5초에야 출발했다. 추천 구절은 상황 목록 → 카테고리 구절의
 * 2단 폭포라 5초에 끝났다(2026-10-28 실측). NewHome 이 레일 폭(railWide)일 때 부르므로 청크를 기다리지 않고
 * 첫 요청 묶음과 함께 'high' 로 나가고, 서버가 추천 카테고리까지 골라 구절을 실어 보내 폭포도 없다.
 */
export const useHomeRail = (enabled: boolean) => {
  const qc = useQueryClient()
  const loggedIn = !!tokenStore.getAccess()
  const active = enabled && loggedIn && !unsupported

  // 렌더 단계에서 한 번만 — 레일 위젯의 첫 useQuery 가 게이트를 보고 멈추게(effect 는 자식→부모 순이라 늦다)
  const isRestoring = useIsRestoring()
  const armedRef = useRef(false)
  if (active && !isRestoring && !armedRef.current) {
    armedRef.current = true
    armHomeRail(qc)
  }

  const query = useQuery({
    queryKey: homeRailKeys.bundle(),
    queryFn: async () => {
      try {
        const rail = await getHomeRail()
        seedPieces(qc, rail)
        return rail
      } catch (error) {
        // 묶음 엔드포인트가 아직 없는 백엔드(404) — 이 세션에선 조각 훅이 각자 받는다
        if (isApiError(error, 404)) unsupported = true
        throw error
      } finally {
        setPending(false)
      }
    },
    enabled: active,
    staleTime: BUNDLE_STALE_MS,
    retry: (count, error) => !isApiError(error, 404) && count < 1,
  })

  // 안전장치 — 게이트가 켜졌는데 묶음 요청이 돌고 있지 않으면 바로 푼다. 조각 훅이 영영 기다리는 일만은 없어야 한다
  const { isFetching } = query
  useEffect(() => {
    if (pending && !isFetching) setPending(false)
  }, [isFetching])
  useEffect(() => () => setPending(false), [])

  return query
}
