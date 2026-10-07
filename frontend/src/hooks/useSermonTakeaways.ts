// 설교 '한 줄 붙잡기' — 목록 1회 조회 후 저장·삭제는 캐시를 직접 고쳐 즉시 반영한다
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteSermonTakeaway,
  getMySermonTakeaways,
  saveSermonTakeaway,
  type SermonTakeaway,
} from '../api/sermonTakeaway'
import { sermonKeys } from './queryKeys'
import { tokenStore } from '../utils/tokenStore'
import { showToast } from '../utils/toast'

export const useSermonTakeaways = () => {
  const loggedIn = !!tokenStore.getAccess()
  const query = useQuery({
    queryKey: sermonKeys.takeaways(),
    queryFn: getMySermonTakeaways,
    enabled: loggedIn,
    staleTime: 1000 * 60 * 5,
  })
  const bySermon = useMemo(() => {
    const map = new Map<number, SermonTakeaway>()
    for (const t of query.data ?? []) map.set(t.sermon_id, t)
    return map
  }, [query.data])
  return { ...query, loggedIn, bySermon }
}

export const useSaveSermonTakeaway = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sermonId, text }: { sermonId: number; text: string }) => saveSermonTakeaway(sermonId, text),
    onSuccess: (saved) => {
      // 최근 수정순 — 방금 붙잡은 한 줄을 맨 앞으로
      qc.setQueryData<SermonTakeaway[]>(sermonKeys.takeaways(), (prev = []) => [
        saved,
        ...prev.filter((t) => t.sermon_id !== saved.sermon_id),
      ])
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}

export const useDeleteSermonTakeaway = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sermonId: number) => deleteSermonTakeaway(sermonId),
    onSuccess: (_, sermonId) => {
      qc.setQueryData<SermonTakeaway[]>(sermonKeys.takeaways(), (prev = []) =>
        prev.filter((t) => t.sermon_id !== sermonId),
      )
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
}
