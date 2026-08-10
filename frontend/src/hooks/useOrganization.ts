import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrgUnit,
  deleteOrgUnit,
  getAdminOrgTree,
  getOrgTree,
  moveOrgUnit,
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

// 전역 기본값이 캐시 우선(refetchOnMount:false)이라, refetchType:'all' 을 주지 않으면
// 관리자 화면에서 고친 내용이 이미 떠 있던 공개 조직도 캐시에 반영되지 않는다.
const useOrgMutation = <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: organizationKeys.all, refetchType: 'all' }),
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

export const useSeedOrg = () => useOrgMutation((force: boolean) => seedOrg(force))
