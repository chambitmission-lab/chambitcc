import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chooseLeagueTeam, fetchLeague, finishLeagueRound, startLeagueRound } from '../api/bibleLeague'

// ['bluemarble', ...] 아래에 두어 main.tsx 의 persist 제외 규칙(게임 상태는 서버 권위)을 그대로 탄다
export const QK_LEAGUE = ['bluemarble', 'league'] as const

export const useLeague = (enabled = true) =>
  useQuery({
    queryKey: QK_LEAGUE,
    queryFn: fetchLeague,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  })

export const useChooseTeam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chooseLeagueTeam,
    onSuccess: (data) => qc.setQueryData(QK_LEAGUE, data),
  })
}

export const useStartRound = () => useMutation({ mutationFn: startLeagueRound })

export const useFinishRound = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: finishLeagueRound,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_LEAGUE }),
  })
}
