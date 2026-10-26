import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  addPlanMembers,
  completeDay,
  createPersonalPlan,
  createPlan,
  deletePersonalPlan,
  deletePlan,
  getPlan,
  getPlanOverview,
  getTodayReadings,
  joinPlanByCode,
  listAllPlans,
  listPlans,
  mergePlanDays,
  previewPlanInvite,
  restartPlan,
  subscribePlan,
  uncompleteDay,
  unsubscribePlan,
  updatePersonalPlan,
  updatePlan,
} from '../api/biblePlan'
import { isApiError } from '../api/utils/request'
import type {
  PersonalPlanCreateRequest,
  PersonalPlanUpdateRequest,
  PlanCreateRequest,
  PlanDayInput,
  PlanOverview,
  PlanUpdateRequest,
  TodayResponse,
} from '../types/biblePlan'
import { isAuthenticated } from '../utils/auth'
import { scheduleTitleEvaluation } from '../utils/titleUnlockBus'

export const biblePlanKeys = {
  all: ['biblePlan'] as const,
  list: () => [...biblePlanKeys.all, 'list'] as const,
  adminList: () => [...biblePlanKeys.all, 'adminList'] as const,
  detail: (id: number) => [...biblePlanKeys.all, 'detail', id] as const,
  today: () => [...biblePlanKeys.all, 'today'] as const,
  overview: () => [...biblePlanKeys.all, 'overview'] as const,
  invite: (code: string) => [...biblePlanKeys.all, 'invite', code] as const,
}

export const useBiblePlans = () =>
  useQuery({
    queryKey: biblePlanKeys.list(),
    queryFn: listPlans,
    staleTime: 1000 * 60 * 5,
  })

export const useBiblePlan = (planId: number, enabled = true) =>
  useQuery({
    queryKey: biblePlanKeys.detail(planId),
    queryFn: () => getPlan(planId),
    enabled: enabled && planId > 0,
    staleTime: 1000 * 60,
  })

const TODAY_STALE = 1000 * 60

export const useTodayReadings = (enabled = true) =>
  useQuery({
    queryKey: biblePlanKeys.today(),
    queryFn: getTodayReadings,
    enabled,
    staleTime: TODAY_STALE,
  })

const EMPTY_TODAY: TodayResponse = { items: [] }

/**
 * 플랜 화면 묶음 한 번 받기 — 목록·오늘의 읽기 조각 캐시에도 심는다(홈 오늘 카드·상세가 그대로 이어받는다).
 *
 * 백엔드는 단일 워커라 목록·오늘을 동시에 보내면 사실상 직렬이 되어 각각 혼자일 때(300·400ms)의 합이 걸렸다.
 * 오늘의 읽기가 이미 신선하면(홈 묶음 /home/summary 가 1분 안에 심어 둔 경우) 목록만 받는다 —
 * 그때 묶음을 부르면 서버가 오늘의 읽기(자유 읽기 동기화 포함)를 공짜가 아닌 값으로 다시 계산한다.
 * 비로그인은 목록만(오늘은 인증 필수). 묶음 404(백엔드 미배포)면 조각별 요청으로 돌아간다.
 */
const fetchPlanOverview = async (qc: QueryClient): Promise<PlanOverview> => {
  const seedPlans = (overview: PlanOverview) => {
    qc.setQueryData(biblePlanKeys.list(), overview.plans)
    return overview
  }
  if (!isAuthenticated()) return seedPlans({ plans: await listPlans(), today: EMPTY_TODAY })

  const todayState = qc.getQueryState<TodayResponse>(biblePlanKeys.today())
  const cachedToday = todayState?.data
  // 완료·구독 변경(invalidatePlanData)으로 무효화된 오늘은 신선하지 않다 — 묶음으로 같이 새로 받는다
  if (
    todayState &&
    cachedToday !== undefined &&
    !todayState.isInvalidated &&
    Date.now() - todayState.dataUpdatedAt < TODAY_STALE
  ) {
    return seedPlans({ plans: await listPlans(), today: cachedToday })
  }

  const overview = await getPlanOverview().catch(async (error: unknown) => {
    if (!isApiError(error, 404)) throw error
    const [plans, today] = await Promise.all([listPlans(), getTodayReadings()])
    return { plans, today }
  })
  qc.setQueryData(biblePlanKeys.today(), overview.today)
  return seedPlans(overview)
}

/** /bible/plans 가 쓰는 유일한 조회 — 목록과 오늘의 읽기를 한 번에 */
export const usePlanOverview = () => {
  const qc = useQueryClient()
  return useQuery({
    queryKey: biblePlanKeys.overview(),
    queryFn: () => fetchPlanOverview(qc),
    staleTime: TODAY_STALE,
  })
}

/**
 * 플랜 화면 묶음 선요청 — 두 시점에서 부른다(키·staleTime 은 usePlanOverview 와 같아 진입 시 캐시를 그대로 이어받는다).
 *   1. 라우트 진입(RouteDataPrefetch): Suspense 바깥이라 청크 다운로드와 나란히 — 새로고침·딥링크 진입에서
 *      청크 왕복 뒤에야 API 가 출발하던 직렬을 없앤다
 *   2. 청크 프리로드(routePreload.routeDataPrefetchers): 메뉴 호버 등. coldOnly 로 캐시가 아예 없을 때만
 */
export const prefetchPlanOverview = (qc: QueryClient, coldOnly = false): void => {
  void qc.prefetchQuery({
    queryKey: biblePlanKeys.overview(),
    queryFn: () => fetchPlanOverview(qc),
    staleTime: coldOnly ? Infinity : TODAY_STALE,
  })
}

/**
 * 홈 "오늘의 읽기" 카드를 미리 받아 둔다 — 로그인 직후 마중 연출이 도는 동안 호출.
 * 이 카드는 응답 전엔 아예 그려지지 않아서(null), 캐시가 비워진 로그인 직후엔
 * 홈에 도착한 뒤 뒤늦게 끼어들었다. 키·staleTime 은 useTodayReadings 와 같다.
 */
export const prefetchTodayReadings = (qc: ReturnType<typeof useQueryClient>) =>
  qc
    .prefetchQuery({
      queryKey: biblePlanKeys.today(),
      queryFn: getTodayReadings,
      staleTime: 1000 * 60,
    })
    .catch(() => {})

const invalidatePlanData = (qc: ReturnType<typeof useQueryClient>) => {
  // 그만두기/구독을 상세 페이지에서 누르면 홈의 today 카드·목록은 비활성이라 stale 마크만
  // 된다 — 전역 refetchOnMount:true 가 다음 마운트에 재조회하므로 그걸로 충분하다.
  qc.invalidateQueries({ queryKey: biblePlanKeys.all })
}

export const useSubscribePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, startDate }: { planId: number; startDate?: string }) =>
      subscribePlan(planId, startDate),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useUnsubscribePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => unsubscribePlan(planId),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useRestartPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => restartPlan(planId),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useCompleteDay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, dayNumber }: { planId: number; dayNumber: number }) =>
      completeDay(planId, dayNumber),
    onSuccess: () => {
      invalidatePlanData(qc)
      // 마지막 일차 완료가 플랜 완주 칭호(유종의 미 등)로 이어질 수 있어
      // 자유 읽기와 동일하게 칭호 평가를 예약한다 (전역 TitleUnlockHost 가 팝업 처리)
      scheduleTitleEvaluation()
    },
  })
}

export const useUncompleteDay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, dayNumber }: { planId: number; dayNumber: number }) =>
      uncompleteDay(planId, dayNumber),
    onSuccess: () => invalidatePlanData(qc),
  })
}

// ── 개인 플랜(나만의 플랜) / 초대 ──
export const useCreatePersonalPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PersonalPlanCreateRequest) => createPersonalPlan(payload),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useUpdatePersonalPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, payload }: { planId: number; payload: PersonalPlanUpdateRequest }) =>
      updatePersonalPlan(planId, payload),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useDeletePersonalPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => deletePersonalPlan(planId),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const usePlanInvitePreview = (inviteCode: string) =>
  useQuery({
    queryKey: biblePlanKeys.invite(inviteCode),
    queryFn: () => previewPlanInvite(inviteCode),
    enabled: inviteCode.length >= 4,
    retry: false,
  })

export const useAddPlanMembers = (planId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userIds: number[]) => addPlanMembers(planId, userIds),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useJoinPlanByCode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => joinPlanByCode(inviteCode),
    onSuccess: () => invalidatePlanData(qc),
  })
}

// ── 관리자 ──
export const useAllBiblePlans = (enabled = true) =>
  useQuery({
    queryKey: biblePlanKeys.adminList(),
    queryFn: listAllPlans,
    enabled,
    staleTime: 1000 * 30,
  })

export const useCreatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PlanCreateRequest) => createPlan(payload),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useUpdatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, payload }: { planId: number; payload: PlanUpdateRequest }) =>
      updatePlan(planId, payload),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useMergePlanDays = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, days }: { planId: number; days: PlanDayInput[] }) =>
      mergePlanDays(planId, days),
    onSuccess: () => invalidatePlanData(qc),
  })
}

export const useDeletePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => deletePlan(planId),
    onSuccess: () => invalidatePlanData(qc),
  })
}
