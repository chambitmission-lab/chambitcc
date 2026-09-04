// 온라인 헌금 안내 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOfferingAccount,
  deleteOfferingAccount,
  fetchAdminOffering,
  fetchOffering,
  moveOfferingAccount,
  updateOfferingAccount,
  updateOfferingGuide,
} from '../api/offering'
import type {
  AccountPayload,
  AccountUpdatePayload,
  GuideUpdatePayload,
  OfferingData,
} from '../types/offering'

export const offeringKeys = {
  all: ['offering'] as const,
  admin: ['offering', 'admin'] as const,
}

const EMPTY: OfferingData = {
  guide: { id: 1, title_ko: '온라인 헌금' },
  accounts: [],
}

/** /news 온라인 헌금 탭 — 공개 조회 */
export const useOffering = () => {
  const query = useQuery({
    queryKey: offeringKeys.all,
    queryFn: fetchOffering,
    staleTime: 1000 * 60 * 5,
  })
  const data = query.data ?? EMPTY
  return {
    guide: data.guide,
    accounts: data.accounts,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/** 관리자 — 숨김 포함, 항상 최신 */
export const useAdminOffering = (enabled = true) =>
  useQuery({
    queryKey: offeringKeys.admin,
    queryFn: fetchAdminOffering,
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  })

/** 변경 후 공개/관리자 쿼리 모두 되살림 (전역 캐시우선 설정이라 refetchType:'all' 필요) */
const useInvalidateOffering = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: offeringKeys.all })
  }
}

export const useUpdateOfferingGuide = () => {
  const invalidate = useInvalidateOffering()
  return useMutation({
    mutationFn: (data: GuideUpdatePayload) => updateOfferingGuide(data),
    onSuccess: invalidate,
  })
}

export const useCreateOfferingAccount = () => {
  const invalidate = useInvalidateOffering()
  return useMutation({
    mutationFn: (data: AccountPayload) => createOfferingAccount(data),
    onSuccess: invalidate,
  })
}

export const useUpdateOfferingAccount = () => {
  const invalidate = useInvalidateOffering()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountUpdatePayload }) =>
      updateOfferingAccount(id, data),
    onSuccess: invalidate,
  })
}

export const useMoveOfferingAccount = () => {
  const invalidate = useInvalidateOffering()
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 'up' | 'down' }) =>
      moveOfferingAccount(id, direction),
    onSuccess: invalidate,
  })
}

export const useDeleteOfferingAccount = () => {
  const invalidate = useInvalidateOffering()
  return useMutation({
    mutationFn: (id: number) => deleteOfferingAccount(id),
    onSuccess: invalidate,
  })
}
