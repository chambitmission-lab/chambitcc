// 교육과 훈련 훅 - React Query
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  createCategory,
  createProgram,
  deleteCategory,
  deleteProgram,
  fetchAdminEducationTree,
  fetchEducationTree,
  moveCategory,
  moveProgram,
  updateCategory,
  updateProgram,
  uploadEducationImage,
} from '../api/education'
import type {
  CategoryPayload,
  CategoryUpdatePayload,
  EducationTree,
  ProgramPayload,
  ProgramUpdatePayload,
} from '../types/education'

export const educationKeys = {
  all: ['education'] as const,
  admin: ['education', 'admin'] as const,
}

const EMPTY: EducationTree = { categories: [] }

const TREE_STALE_MS = 1000 * 60 * 5

/**
 * /education 데이터 선요청 — 청크 프리로드(메뉴 열림·호버·유휴)와 같은 시점에 routePreload 가 부른다.
 * 청크·히어로 삽화만 미리 받아 두면 진입 시 히어로는 즉시 뜨는데 본문은 API 왕복만큼 늦게
 * 스켈레톤 뒤에 따라왔다(두 박자). 훅과 같은 키·staleTime 이라 캐시가 신선하면 요청이 나가지 않는다.
 */
export const prefetchEducationTree = (qc: QueryClient): void => {
  void qc.prefetchQuery({ queryKey: educationKeys.all, queryFn: fetchEducationTree, staleTime: TREE_STALE_MS })
}

/** /education 공개 조회 */
export const useEducationTree = () => {
  const query = useQuery({
    queryKey: educationKeys.all,
    queryFn: fetchEducationTree,
    staleTime: TREE_STALE_MS,
  })
  return {
    categories: (query.data ?? EMPTY).categories,
    isLoading: query.isLoading,
  }
}

/** 관리자 — 비활성 포함, 항상 최신 */
export const useAdminEducationTree = (enabled = true) =>
  useQuery({
    queryKey: educationKeys.admin,
    queryFn: fetchAdminEducationTree,
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  })

/** 변경 후 공개/관리자 쿼리 모두 되살림 (비활성 /education 도 다음 진입에서 최신) */
const useInvalidateEducation = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: educationKeys.all })
  }
}

export const useCreateCategory = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({ mutationFn: (data: CategoryPayload) => createCategory(data), onSuccess: invalidate })
}

export const useUpdateCategory = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdatePayload }) => updateCategory(id, data),
    onSuccess: invalidate,
  })
}

export const useMoveCategory = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 'up' | 'down' }) => moveCategory(id, direction),
    onSuccess: invalidate,
  })
}

export const useDeleteCategory = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({ mutationFn: (id: number) => deleteCategory(id), onSuccess: invalidate })
}

export const useCreateProgram = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({ mutationFn: (data: ProgramPayload) => createProgram(data), onSuccess: invalidate })
}

export const useUpdateProgram = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProgramUpdatePayload }) => updateProgram(id, data),
    onSuccess: invalidate,
  })
}

export const useMoveProgram = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 'up' | 'down' }) => moveProgram(id, direction),
    onSuccess: invalidate,
  })
}

export const useDeleteProgram = () => {
  const invalidate = useInvalidateEducation()
  return useMutation({ mutationFn: (id: number) => deleteProgram(id), onSuccess: invalidate })
}

export const useUploadEducationImage = () =>
  useMutation({ mutationFn: (file: File) => uploadEducationImage(file) })
