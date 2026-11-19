import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMyVerseAlarms,
  createVerseAlarm,
  updateVerseAlarm,
  deleteVerseAlarm,
  type VerseAlarmCreatePayload,
  type VerseAlarmUpdatePayload,
} from '../api/verseAlarm'
import { isAuthenticated } from '../utils/auth'

const ALARMS_KEY = ['verse-alarms']

/** enabled=false 면 요청하지 않는다 — 목록이 꼭 필요할 때만 받는 화면(홈 레일 안내)용 */
export const useVerseAlarms = (enabled = true) => {
  return useQuery({
    queryKey: ALARMS_KEY,
    queryFn: getMyVerseAlarms,
    enabled: enabled && isAuthenticated(),
    staleTime: 1000 * 60,
  })
}

export const useCreateVerseAlarm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VerseAlarmCreatePayload) => createVerseAlarm(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALARMS_KEY }),
  })
}

export const useUpdateVerseAlarm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      alarmId,
      payload,
    }: {
      alarmId: number
      payload: VerseAlarmUpdatePayload
    }) => updateVerseAlarm(alarmId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALARMS_KEY }),
  })
}

export const useDeleteVerseAlarm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alarmId: number) => deleteVerseAlarm(alarmId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALARMS_KEY }),
  })
}
