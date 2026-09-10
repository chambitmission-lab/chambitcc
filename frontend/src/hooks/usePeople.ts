// 섬기는 사람들 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPerson,
  deletePerson,
  fetchAllPeople,
  fetchPeople,
  movePerson,
  updatePerson,
  uploadPersonPhoto,
} from '../api/people'
import type { PeopleDirectory, PersonCreatePayload, PersonUpdatePayload } from '../types/people'

export const peopleKeys = {
  all: ['people'] as const,
  admin: ['people', 'admin'] as const,
}

const EMPTY: PeopleDirectory = { leaders: [], people: [] }

/** /people 공개 조회 — 대표 카드 + 전체 인물 */
export const usePeopleDirectory = () => {
  const query = useQuery({
    queryKey: peopleKeys.all,
    queryFn: fetchPeople,
    staleTime: 1000 * 60 * 5,
  })
  const data = query.data ?? EMPTY
  return {
    leaders: data.leaders,
    people: data.people,
    isLoading: query.isLoading,
  }
}

/** 관리자 목록 — 비공개 포함, 항상 최신 (전역 캐시우선 설정을 이 쿼리에서만 뒤집는다) */
export const useAllPeople = (enabled = true) =>
  useQuery({
    queryKey: peopleKeys.admin,
    queryFn: fetchAllPeople,
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  })

/**
 * 변경 후 공개/관리자 쿼리를 모두 되살린다.
 * 키 앞부분이 같아 ['people'] 무효화 한 번이면 둘 다 걸린다.
 */
const useInvalidatePeople = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: peopleKeys.all })
  }
}

export const useCreatePerson = () => {
  const invalidate = useInvalidatePeople()
  return useMutation({
    mutationFn: (data: PersonCreatePayload) => createPerson(data),
    onSuccess: invalidate,
  })
}

export const useUpdatePerson = () => {
  const invalidate = useInvalidatePeople()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PersonUpdatePayload }) =>
      updatePerson(id, data),
    onSuccess: invalidate,
  })
}

export const useMovePerson = () => {
  const invalidate = useInvalidatePeople()
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 'up' | 'down' }) =>
      movePerson(id, direction),
    onSuccess: invalidate,
  })
}

export const useDeletePerson = () => {
  const invalidate = useInvalidatePeople()
  return useMutation({
    mutationFn: (id: number) => deletePerson(id),
    onSuccess: invalidate,
  })
}

export const useUploadPersonPhoto = () =>
  useMutation({
    mutationFn: (file: File) => uploadPersonPhoto(file),
  })
