// 담임목사 인사말 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPastor,
  deletePastor,
  fetchAllPastors,
  fetchPastors,
  setCurrentPastor,
  updatePastor,
  uploadPastorPhoto,
} from '../api/pastors'
import type {
  Pastor,
  PastorCreatePayload,
  PastorListResponse,
  PastorUpdatePayload,
} from '../types/pastor'

export const pastorKeys = {
  all: ['pastors'] as const,
  admin: ['pastors', 'admin'] as const,
}

const EMPTY: PastorListResponse = { current: null, past: [] }

/** /greeting 공개 조회 — 현직 + 역대 */
export const usePastors = () => {
  const query = useQuery({
    queryKey: pastorKeys.all,
    queryFn: fetchPastors,
    staleTime: 1000 * 60 * 5,
  })

  const data = query.data ?? EMPTY
  return {
    current: data.current,
    past: data.past,
    isLoading: query.isLoading,
  }
}

/** 관리자 목록 — 비공개 포함 */
export const useAllPastors = (enabled = true) =>
  useQuery({
    queryKey: pastorKeys.admin,
    queryFn: fetchAllPastors,
    enabled,
    // 관리자 화면은 항상 최신이어야 한다 (전역 캐시우선 설정을 이 쿼리에서만 뒤집는다)
    refetchOnMount: 'always',
    staleTime: 0,
  })

/**
 * 목록 변경 후 공개/관리자 쿼리를 모두 되살린다.
 * refetchType:'all' — /greeting 이 비활성 상태여도 다음 진입에서 옛 값을 그리지 않게.
 */
const useInvalidatePastors = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: pastorKeys.all, refetchType: 'all' })
  }
}

export const useCreatePastor = () => {
  const invalidate = useInvalidatePastors()
  return useMutation({
    mutationFn: (data: PastorCreatePayload) => createPastor(data),
    onSuccess: invalidate,
  })
}

export const useUpdatePastor = () => {
  const invalidate = useInvalidatePastors()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PastorUpdatePayload }) =>
      updatePastor(id, data),
    onSuccess: invalidate,
  })
}

export const useSetCurrentPastor = () => {
  const invalidate = useInvalidatePastors()
  return useMutation({
    mutationFn: (id: number) => setCurrentPastor(id),
    onSuccess: invalidate,
  })
}

export const useDeletePastor = () => {
  const invalidate = useInvalidatePastors()
  return useMutation({
    mutationFn: (id: number) => deletePastor(id),
    onSuccess: invalidate,
  })
}

export const useUploadPastorPhoto = () =>
  useMutation({
    mutationFn: (file: File) => uploadPastorPhoto(file),
  })

export type { Pastor }
