// 교육과 훈련 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/** /education 공개 조회 */
export const useEducationTree = () => {
  const query = useQuery({
    queryKey: educationKeys.all,
    queryFn: fetchEducationTree,
    staleTime: 1000 * 60 * 5,
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
