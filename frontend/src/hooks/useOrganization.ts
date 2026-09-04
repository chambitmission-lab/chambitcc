import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrgUnit,
  deleteOrgUnit,
  getAdminOrgTree,
  getOrgTree,
  moveOrgUnit,
  reorderOrgUnits,
  seedOrg,
  updateOrgUnit,
} from '../api/organization'
import type { OrgUnitUpdate } from '../types/organization'

export const organizationKeys = {
  all: ['organization'] as const,
  tree: () => [...organizationKeys.all, 'tree'] as const,
  adminTree: () => [...organizationKeys.all, 'admin'] as const,
}

export const useOrgTree = () =>
  useQuery({
    queryKey: organizationKeys.tree(),
    queryFn: getOrgTree,
    staleTime: 1000 * 60 * 10,
  })

export const useAdminOrgTree = () =>
  useQuery({
    queryKey: organizationKeys.adminTree(),
    queryFn: getAdminOrgTree,
    staleTime: 0,
  })

// 관리자 화면에서 고친 내용은 공개 조직도 캐시를 stale 로 만들고,
// 전역 refetchOnMount:true 가 조직도 재진입 때 재조회한다.
const useOrgMutation = <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: organizationKeys.all }),
  })
}

export const useCreateOrgUnit = () => useOrgMutation(createOrgUnit)

export const useUpdateOrgUnit = () =>
  useOrgMutation(({ id, data }: { id: number; data: OrgUnitUpdate }) => updateOrgUnit(id, data))

export const useDeleteOrgUnit = () => useOrgMutation(deleteOrgUnit)

export const useMoveOrgUnit = () =>
  useOrgMutation(({ id, direction }: { id: number; direction: 'up' | 'down' }) =>
    moveOrgUnit(id, direction),
  )

export const useReorderOrgUnits = () =>
  useOrgMutation(({ parentId, orderedIds }: { parentId: number | null; orderedIds: number[] }) =>
    reorderOrgUnits(parentId, orderedIds),
  )

export const useSeedOrg = () => useOrgMutation((force: boolean) => seedOrg(force))
