import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeDay,
  createPlan,
  deletePlan,
  getPlan,
  getTodayReadings,
  listAllPlans,
  listPlans,
  restartPlan,
  subscribePlan,
  uncompleteDay,
  unsubscribePlan,
  updatePlan,
} from '../api/biblePlan'
import type { PlanCreateRequest, PlanUpdateRequest } from '../types/biblePlan'

export const biblePlanKeys = {
  all: ['biblePlan'] as const,
  list: () => [...biblePlanKeys.all, 'list'] as const,
  adminList: () => [...biblePlanKeys.all, 'adminList'] as const,
  detail: (id: number) => [...biblePlanKeys.all, 'detail', id] as const,
  today: () => [...biblePlanKeys.all, 'today'] as const,
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

export const useTodayReadings = (enabled = true) =>
  useQuery({
    queryKey: biblePlanKeys.today(),
    queryFn: getTodayReadings,
    enabled,
    staleTime: 1000 * 60,
  })

const invalidatePlanData = (qc: ReturnType<typeof useQueryClient>) => {
  // refetchType: 'all' — 그만두기/구독을 상세 페이지에서 누르면 홈의 today 카드,
  //   목록 등 비활성 쿼리는 기본값 'active'로는 stale 마크만 되고, 전역
  //   refetchOnMount:false(queryClient.ts)와 결합되면 다음 마운트에도 옛 캐시가
  //   그대로 노출된다. 비활성 쿼리까지 즉시 refetch해 페이지 간 동기화를 보장한다.
  qc.invalidateQueries({ queryKey: biblePlanKeys.all, refetchType: 'all' })
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
    onSuccess: () => invalidatePlanData(qc),
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

export const useDeletePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => deletePlan(planId),
    onSuccess: () => invalidatePlanData(qc),
  })
}
