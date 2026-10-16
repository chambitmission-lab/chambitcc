import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
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
import { fetchMyRabbit } from '../api/rabbit'
import { QK_RABBIT_ME } from './useRabbit'

export const QK_BM_STATE = ['bluemarble', 'state'] as const
export const QK_BM_TILES = ['bluemarble', 'tiles'] as const
export const QK_BM_LEADERBOARD = ['bluemarble', 'leaderboard'] as const
export const QK_BM_STATS = ['bluemarble', 'stats'] as const

// 게임 상태는 서버 권위 데이터라 마운트마다 새로 받되, 청크와 나란히 띄운 선요청(prefetchQuest)이
// 방금 끝났다면 그걸 그대로 쓴다. 예전엔 'always' + 마운트 invalidate 가 겹쳐 /state 가 진입마다
// 두 번 나갔고, 직렬 백엔드에서 두 번째가 첫 번째 뒤에 줄을 서 첫 화면이 그만큼 늦었다.
const STATE_FRESH_MS = 2_000
const TILES_FRESH_MS = 24 * 60 * 60 * 1000

export const useBluemarbleState = (enabled = true) =>
  useQuery({
    queryKey: QK_BM_STATE,
    queryFn: fetchState,
    enabled,
    staleTime: STATE_FRESH_MS,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

/** 120 발자취 칸 — 고정 데이터라 하루 캐시 + persist(main.tsx 예외) */
export const useBluemarbleTiles = (enabled = true) =>
  useQuery({
    queryKey: QK_BM_TILES,
    queryFn: fetchTiles,
    enabled,
    staleTime: TILES_FRESH_MS,
    refetchOnWindowFocus: false,
  })

/** /bluemarble 진입 전에 청크와 나란히 — 상태·칸·내 토끼를 한 번에 띄운다(routePreload·RouteDataPrefetch 공용) */
export const prefetchQuest = (qc: QueryClient): void => {
  void qc.prefetchQuery({ queryKey: QK_BM_STATE, queryFn: fetchState, staleTime: STATE_FRESH_MS })
  void qc.prefetchQuery({ queryKey: QK_BM_TILES, queryFn: fetchTiles, staleTime: TILES_FRESH_MS })
  void qc.prefetchQuery({ queryKey: QK_RABBIT_ME, queryFn: fetchMyRabbit, staleTime: 30 * 1000 })
}

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
