import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTitles, equipTitle, unequipTitle, getEquippedTitle } from '../api/titles'

export const titleKeys = {
  all: ['titles'] as const,
  list: () => [...titleKeys.all, 'list'] as const,
  equipped: () => [...titleKeys.all, 'equipped'] as const,
}

/** 전체 칭호 컬렉션 */
export const useTitles = (enabled = true) =>
  useQuery({
    queryKey: titleKeys.list(),
    queryFn: getTitles,
    enabled,
    staleTime: 1000 * 30,
    refetchOnMount: 'always',
  })

/** 현재 장착한 칭호(프로필용) */
export const useEquippedTitle = (enabled = true) =>
  useQuery({
    queryKey: titleKeys.equipped(),
    queryFn: getEquippedTitle,
    enabled,
    staleTime: 1000 * 60,
  })

/** 칭호 장착/해제 */
export const useEquipTitle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string | null) => (key ? equipTitle(key) : unequipTitle().then(() => null)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: titleKeys.all })
    },
  })
}
