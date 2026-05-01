import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchState,
  fetchTiles,
  startGame,
  advanceStep,
  submitAnswer,
  fetchLeaderboard,
  fetchBluemarbleStats,
  abandonGame,
} from '../api/bluemarble'

export const QK_BM_STATE = ['bluemarble', 'state'] as const
export const QK_BM_TILES = ['bluemarble', 'tiles'] as const
export const QK_BM_LEADERBOARD = ['bluemarble', 'leaderboard'] as const
export const QK_BM_STATS = ['bluemarble', 'stats'] as const

export const useBluemarbleState = (enabled = true) =>
  useQuery({
    queryKey: QK_BM_STATE,
    queryFn: fetchState,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

export const useBluemarbleTiles = () =>
  useQuery({
    queryKey: QK_BM_TILES,
    queryFn: fetchTiles,
    staleTime: 60 * 60 * 1000,
  })

export const useStartGame = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (restart: boolean = false) => startGame(restart),
    onSuccess: (data) => {
      qc.setQueryData(QK_BM_STATE, data)
    },
  })
}

export const useAdvanceStep = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceStep,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_BM_STATE })
    },
  })
}

export const useSubmitAnswer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { quizId: number; choiceIndex: number; elapsedMs?: number }) =>
      submitAnswer(vars.quizId, vars.choiceIndex, vars.elapsedMs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_BM_STATE })
      qc.invalidateQueries({ queryKey: QK_BM_STATS })
    },
  })
}

export const useLeaderboard = (limit = 10, enabled = true) =>
  useQuery({
    queryKey: [...QK_BM_LEADERBOARD, limit],
    queryFn: () => fetchLeaderboard(limit),
    enabled,
  })

export const useBluemarbleStats = (enabled = true) =>
  useQuery({
    queryKey: QK_BM_STATS,
    queryFn: fetchBluemarbleStats,
    enabled,
  })

export const useAbandonGame = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: abandonGame,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_BM_STATE })
    },
  })
}
