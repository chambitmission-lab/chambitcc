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
    // 전역 refetchOnMount:false(queryClient.ts) 때문에, 장착 변경 후 프로필 재진입 시
    // 무효화만으론 옛 캐시가 그대로 보인다 → 마운트마다 최신 장착 칭호를 다시 불러온다.
    refetchOnMount: 'always',
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
