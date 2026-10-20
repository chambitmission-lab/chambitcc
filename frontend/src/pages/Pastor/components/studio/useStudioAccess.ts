// 설교 준비실 입장 — 목회자 권한 + 직분 '담임목사'(서버가 판단). 세션 동안 바뀌지 않아 한 번만 묻는다.
//   확인 요청이 실패한 것은 '허용 안 됨'과 다르다 — failed 로 따로 알려 화면이 다시 시도 버튼을 보이게 한다.
import { useQuery } from '@tanstack/react-query'
import { fetchStudioAccess } from '../../../../api/pastor'
import { pastorKeys } from '../../../../hooks/queryKeys'
import { isPastor } from '../../../../utils/access'

export const useStudioAccess = () => {
  const pastor = isPastor()
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: pastorKeys.studioAccess(),
    queryFn: fetchStudioAccess,
    enabled: pastor,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  return {
    allowed: !!data?.allowed,
    checking: pastor && (isPending || isFetching),
    failed: isError,
    retry: () => void refetch(),
  }
}
