import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptCompanion,
  cheerCompanion,
  getCompanion,
  getMyCompanions,
  inviteCompanion,
  leaveCompanion,
  updateCompanionGoal,
  updateCompanionTopic,
} from '../api/companion'
import type { CompanionDetail, CompanionGoal } from '../types/companion'

export const companionKeys = {
  all: ['companion'] as const,
  home: () => [...companionKeys.all, 'home'] as const,
  detail: (id: number) => [...companionKeys.all, 'detail', id] as const,
}

// 진행량은 둘의 기록에서 매번 다시 세므로 재진입 때마다 갱신한다(전역 refetchOnMount:false 의 예외)
export const useMyCompanions = (enabled = true) =>
  useQuery({
    queryKey: companionKeys.home(),
    queryFn: getMyCompanions,
    enabled,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useCompanion = (id: number, enabled = true) =>
  useQuery({
    queryKey: companionKeys.detail(id),
    queryFn: () => getCompanion(id),
    enabled: enabled && id > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

export const useInviteCompanion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, goal }: { userId: number; goal: CompanionGoal }) => inviteCompanion(userId, goal),
    onSuccess: () => qc.invalidateQueries({ queryKey: companionKeys.home() }),
  })
}

export const useAcceptCompanion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => acceptCompanion(id),
    onSuccess: (detail) => {
      qc.setQueryData(companionKeys.detail(detail.id), detail)
      qc.invalidateQueries({ queryKey: companionKeys.home() })
    },
  })
}

export const useUpdateCompanionGoal = (id: number) =>
  useDetailMutation<CompanionGoal>(id, (goal) => updateCompanionGoal(id, goal))

// 상세 응답을 그대로 심고 목록(홈 발자국 버튼·카드)만 다시 받는다
const useDetailMutation = <TVars,>(id: number, fn: (vars: TVars) => Promise<CompanionDetail>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (detail) => {
      qc.setQueryData(companionKeys.detail(id), detail)
      qc.invalidateQueries({ queryKey: companionKeys.home() })
    },
  })
}

export const useCheerCompanion = (id: number) => useDetailMutation<void>(id, () => cheerCompanion(id))

export const useUpdateCompanionTopic = (id: number) =>
  useDetailMutation<string>(id, (content) => updateCompanionTopic(id, content))

export const useLeaveCompanion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leaveCompanion(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: companionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: companionKeys.home() })
    },
  })
}
