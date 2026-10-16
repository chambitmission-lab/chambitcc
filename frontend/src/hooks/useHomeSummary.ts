import { useEffect, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getHomeSummary, type HomeSummary } from '../api/home'
import { isApiError } from '../api/utils/request'
import { tokenStore } from '../utils/tokenStore'
import { dailyVerseKeys, meditationKeys, notificationKeys, sermonKeys, todayChurchKeys, weeklyPrayerKeys } from './queryKeys'
import { biblePlanKeys } from './useBiblePlan'
import { deriveTimeOfDay, localDateKey } from './useDailyMeditation'
import { electionKeys } from './useElections'
import { groupKeys } from './useGroups'
import { intercessionKeys } from './useIntercession'
import { prayerKeys } from './usePrayersQuery'
import { surveyKeys } from './useSurvey'

export const homeKeys = {
  all: ['home'] as const,
  summary: () => [...homeKeys.all, 'summary'] as const,
}

// 묶음이 이만큼 지났으면 홈에 다시 들어올 때 새로 받고 조각을 다시 심는다. 조각 훅들의 staleTime 과
// 비슷하게 둬야 "묶음은 신선한데 조각은 stale 이라 각자 다시 요청"하는 일이 줄어든다.
const BUNDLE_STALE_MS = 1000 * 30

// ── 조각 훅 게이트 ──────────────────────────────────────────────────────────
// 묶음을 받는 동안 홈 위젯의 단건 훅은 enabled=false 로 기다린다(캐시가 있으면 그걸 보여 준다).
// 묶음이 조각을 심고 나면(또는 실패하면) 풀리는데, 심어진 조각은 신선해서 단건 훅이 다시 요청하지 않는다.
// useSyncExternalStore 로 두는 이유: NewHome 이 렌더 단계에서 켜야 자식의 첫 useQuery 가 보고 멈춘다
// (effect 는 자식→부모 순이라 부모 effect 에서 켜면 이미 다 나간 뒤 — requestPriority 게이트와 같은 사정).
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

/** 홈 위젯이 단건 훅의 enabled 에 쓰는 게이트 — 홈 밖에서는 항상 false */
export const useHomeBundlePending = () => useSyncExternalStore(subscribe, () => pending, () => false)

/**
 * NewHome 이 복원이 끝난 첫 렌더에서(렌더 단계!) 부른다 — 묶음이 없거나 오래됐으면 조각 훅을 멈춘다.
 * 멱등이라 StrictMode 이중 렌더에도 무해하다.
 */
export const armHomeBundle = (qc: QueryClient) => {
  if (unsupported || !tokenStore.getAccess()) return
  const state = qc.getQueryState(homeKeys.summary())
  const fresh = state?.data !== undefined && Date.now() - state.dataUpdatedAt < BUNDLE_STALE_MS
  if (!fresh) setPending(true)
}

/** 묶음 조각을 단건 키에 심는다 — 실패(failed)한 조각과 '없음'(null) 은 건너뛴다 */
const seedPieces = (qc: QueryClient, s: HomeSummary) => {
  const failed = new Set(s.failed ?? [])
  const ok = (name: keyof HomeSummary) => !failed.has(name) && s[name] !== null && s[name] !== undefined

  if (ok('meditation') && s.meditation) {
    // 서버(KST)와 같은 날·같은 시간대일 때만 — 키가 다르면 카드 훅이 제 키로 받는다
    const now = new Date()
    const timeOfDay = deriveTimeOfDay(now.getHours())
    const dateKey = localDateKey(now)
    if (s.meditation.date === dateKey && s.meditation.card.context?.time_of_day === timeOfDay) {
      qc.setQueryData(meditationKeys.card(dateKey, timeOfDay), s.meditation.card)
    }
  }
  if (ok('plan_today')) qc.setQueryData(biblePlanKeys.today(), s.plan_today)
  if (ok('sermon_takeaways')) qc.setQueryData(sermonKeys.takeaways(), s.sermon_takeaways!.items)
  if (ok('daily_verse')) qc.setQueryData(dailyVerseKeys.today(), s.daily_verse)
  if (ok('weekly_prayer')) qc.setQueryData(weeklyPrayerKeys.current(), s.weekly_prayer)
  if (ok('answered_total')) qc.setQueryData(prayerKeys.answeredCount(), s.answered_total)
  if (ok('intercession')) qc.setQueryData(intercessionKeys.me(), s.intercession)
  // 설문 배너는 "참여할 설문 없음" 이 정상값(null) — failed 만 아니면 심는다
  if (!failed.has('survey_banner')) qc.setQueryData(surveyKeys.homeBanner(), s.survey_banner)
  if (ok('elections')) qc.setQueryData(electionKeys.list(), s.elections)
  if (ok('popup_notices')) qc.setQueryData(notificationKeys.popups(), s.popup_notices)
  if (ok('my_groups')) qc.setQueryData(groupKeys.myGroups(), s.my_groups)
  if (ok('today_church')) qc.setQueryData(todayChurchKeys.today(), s.today_church)
}

/**
 * 홈 묶음 — 묵상·오늘의 읽기·설교 한 줄·올해의 말씀·이번 주 기도제목·응답 수·중보 짝·설문·선거·팝업 공지·
 * 내 그룹·오늘의 교회를 요청 하나로 받아 단건 키에 심는다(필사 허브 useTypingHome 과 같은 방식).
 * 홈은 콜드 마운트에 GET 18개를 보냈고 백엔드는 단일 워커라 요청 수 자체가 비용이었다.
 */
export const useHomeSummary = () => {
  const qc = useQueryClient()
  const loggedIn = !!tokenStore.getAccess()
  const query = useQuery({
    queryKey: homeKeys.summary(),
    queryFn: async () => {
      try {
        const summary = await getHomeSummary()
        seedPieces(qc, summary)
        return summary
      } catch (error) {
        // 묶음 엔드포인트가 아직 없는 백엔드(404) — 이 세션에선 조각 훅이 각자 받는다
        if (isApiError(error, 404)) unsupported = true
        throw error
      } finally {
        setPending(false)
      }
    },
    enabled: loggedIn && !unsupported,
    staleTime: BUNDLE_STALE_MS,
    retry: (count, error) => !isApiError(error, 404) && count < 1,
  })

  // 안전장치 — 게이트가 켜졌는데 묶음 요청이 돌고 있지 않으면(이미 신선하다고 판단 등) 바로 푼다.
  // 조각 훅이 영영 기다리는 일만은 없어야 한다.
  const { isFetching } = query
  useEffect(() => {
    if (pending && !isFetching) setPending(false)
  }, [isFetching])
  useEffect(() => () => setPending(false), [])

  return query
}
