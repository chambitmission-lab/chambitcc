// 설교 준비실 입장 — 목회자 권한 + 직분 '담임목사'(서버가 판단). 세션 동안 바뀌지 않아 한 번만 묻는다.
import { useQuery } from '@tanstack/react-query'
import { fetchStudioAccess } from '../../../../api/pastor'
import { pastorKeys } from '../../../../hooks/queryKeys'
import { isPastor } from '../../../../utils/access'

export const useStudioAccess = () => {
  const pastor = isPastor()
  const { data, isPending } = useQuery({
    queryKey: pastorKeys.studioAccess(),
    queryFn: fetchStudioAccess,
    enabled: pastor,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  return { allowed: !!data?.allowed, checking: pastor && isPending }
}
