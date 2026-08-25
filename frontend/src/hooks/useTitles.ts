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
    refetchOnMount: true,
  })

/** 현재 장착한 칭호(프로필용) */
export const useEquippedTitle = (enabled = true) =>
  useQuery({
    queryKey: titleKeys.equipped(),
    queryFn: getEquippedTitle,
    enabled,
    // 장착 변경은 useEquipTitle 이 setQueryData 로 즉시 캐시에 반영하므로
    // 마운트마다 강제 재조회('always')할 필요가 없다. staleTime 이 지나면
    // 전역 refetchOnMount:true 가 캐시를 먼저 그린 뒤 조용히 재조회한다.
    staleTime: 1000 * 60 * 5,
  })

/** 칭호 장착/해제 */
export const useEquipTitle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string | null) => (key ? equipTitle(key) : unequipTitle().then(() => null)),
    onSuccess: (data) => {
      // 장착 결과(또는 해제 시 null)를 equipped 캐시에 즉시 반영 — 프로필 칩이 곧바로 갱신되도록.
      // (equipped 쿼리는 장착 시점에 보통 비활성이라 invalidate만으론 즉시 refetch되지 않음)
      qc.setQueryData(titleKeys.equipped(), data ?? null)
      qc.invalidateQueries({ queryKey: titleKeys.all })
    },
  })
}
