import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completePuzzle, getPuzzles, type PuzzlesPayload } from '../api/puzzles'
import { titleKeys } from './useTitles'

export const puzzleKeys = {
  all: ['puzzles'] as const,
  list: () => [...puzzleKeys.all, 'list'] as const,
}

/** 말씀 퍼즐 목록 — 조각은 읽기로 바뀌므로 탭에 들어올 때마다 새로 받는다 */
export const usePuzzles = (enabled = true) =>
  useQuery({
    queryKey: puzzleKeys.list(),
    queryFn: getPuzzles,
    enabled,
    staleTime: 1000 * 15,
    refetchOnMount: true,
  })

/** 맞추기 완성 — 완성 상태를 캐시에 바로 넣고, 칭호 목록은 새로 받게 한다 */
export const useCompletePuzzle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, seconds }: { key: string; seconds: number }) => completePuzzle(key, seconds),
    onSuccess: ({ puzzle }) => {
      qc.setQueryData<PuzzlesPayload>(puzzleKeys.list(), (prev) =>
        prev ? { ...prev, puzzles: prev.puzzles.map((p) => (p.key === puzzle.key ? puzzle : p)) } : prev,
      )
      void qc.invalidateQueries({ queryKey: titleKeys.all })
    },
  })
}
