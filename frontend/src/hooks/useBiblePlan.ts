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
