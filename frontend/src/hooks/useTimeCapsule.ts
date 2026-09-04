import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  claimCapsule,
  createCapsule,
  deleteCapsule,
  getCapsule,
  listMyCapsules,
  openCapsule,
  previewCapsule,
} from '../api/timeCapsule'
import type { CapsuleCreateRequest, CapsuleDetail } from '../types/timeCapsule'

export const capsuleKeys = {
  all: ['timeCapsule'] as const,
  list: () => [...capsuleKeys.all, 'list'] as const,
  detail: (id: number) => [...capsuleKeys.all, 'detail', id] as const,
  preview: (code: string) => [...capsuleKeys.all, 'preview', code] as const,
}

export const useMyCapsules = (enabled = true) =>
  useQuery({
    queryKey: capsuleKeys.list(),
    queryFn: listMyCapsules,
    enabled,
    staleTime: 1000 * 60,
    // openable(개봉 가능 여부)이 시간에 따라 바뀌는 목록 — 재진입 시 갱신
    refetchOnMount: true,
  })

export const useCapsule = (capsuleId: number, enabled = true) =>
  useQuery({
    queryKey: capsuleKeys.detail(capsuleId),
    queryFn: () => getCapsule(capsuleId),
    enabled: enabled && capsuleId > 0,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  })

/**
 * 알림 '바로가기'처럼 진입이 예정된 캡슐의 상세를 미리 받아둔다.
 * useCapsule과 staleTime을 맞춰야 진입 직후 refetchOnMount가 다시 돌지 않는다
 * (안 맞추면 미리 받아두고도 스켈레톤이 한 번 깜빡인다).
 */
export const prefetchCapsule = (qc: QueryClient, capsuleId: number) =>
  qc.prefetchQuery({
    queryKey: capsuleKeys.detail(capsuleId),
    queryFn: () => getCapsule(capsuleId),
    staleTime: 1000 * 30,
  })

export const useCapsulePreview = (inviteCode: string) =>
  useQuery({
    queryKey: capsuleKeys.preview(inviteCode),
    queryFn: () => previewCapsule(inviteCode),
    enabled: inviteCode.length >= 8,
    retry: false,
  })

export const useCreateCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CapsuleCreateRequest) => createCapsule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}

export const useOpenCapsule = (capsuleId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => openCapsule(capsuleId),
    onSuccess: (detail: CapsuleDetail) => {
      qc.setQueryData(capsuleKeys.detail(capsuleId), detail)
      qc.invalidateQueries({ queryKey: capsuleKeys.list() })
    },
  })
}

export const useClaimCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => claimCapsule(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}

export const useDeleteCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (capsuleId: number) => deleteCapsule(capsuleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all }),
  })
}
