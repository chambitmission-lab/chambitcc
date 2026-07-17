import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMeditationRecord,
  getMeditationRecords,
  getMeditationStreak,
  type MeditationRecordCreatePayload,
} from '../api/meditationRecord'
import { isAuthenticated } from '../utils/auth'

const RECORDS_KEY = ['meditation-records']
const STREAK_KEY = ['meditation-streak']

export const useMeditationRecords = (limit = 30) => {
  return useQuery({
    queryKey: [...RECORDS_KEY, limit],
    queryFn: () => getMeditationRecords(limit),
    enabled: isAuthenticated(),
    staleTime: 1000 * 60,
  })
}

export const useMeditationStreak = () => {
  return useQuery({
    queryKey: STREAK_KEY,
    queryFn: getMeditationStreak,
    enabled: isAuthenticated(),
    staleTime: 1000 * 60,
  })
}

export const useCreateMeditationRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MeditationRecordCreatePayload) =>
      createMeditationRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECORDS_KEY })
      queryClient.invalidateQueries({ queryKey: STREAK_KEY })
    },
  })
}
