import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all, refetchType: 'all' }),
  })
}

export const useOpenCapsule = (capsuleId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => openCapsule(capsuleId),
    onSuccess: (detail: CapsuleDetail) => {
      qc.setQueryData(capsuleKeys.detail(capsuleId), detail)
      qc.invalidateQueries({ queryKey: capsuleKeys.list(), refetchType: 'all' })
    },
  })
}

export const useClaimCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => claimCapsule(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all, refetchType: 'all' }),
  })
}

export const useDeleteCapsule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (capsuleId: number) => deleteCapsule(capsuleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: capsuleKeys.all, refetchType: 'all' }),
  })
}
