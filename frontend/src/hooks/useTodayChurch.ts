// 오늘의 교회 — 작년 오늘의 나 + 어제 우리 교회. 홈에선 묶음(today_church 조각)이 캐시를 심는다.
import { useCallback, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { answerPrayer } from '../api/prayer/prayerActionApi'
import { getTodayChurch, type TodayChurch } from '../api/todayChurch'
import { tokenStore } from '../utils/tokenStore'
import { safeStorage } from '../utils/safeStorage'
import { showToast } from '../utils/toast'
import { invalidateGroupStats } from './useGroups'
import { prayerKeys } from './usePrayersQuery'
import { profileKeys, todayChurchKeys } from './queryKeys'

export const useTodayChurch = (enabled = true) => {
  const loggedIn = !!tokenStore.getAccess()
  return useQuery({
    queryKey: todayChurchKeys.today(),
    queryFn: getTodayChurch,
    enabled: loggedIn && enabled,
    // 하루 단위로 바뀌는 내용 — 날짜가 바뀌면 서버 date 가 달라진다
    staleTime: 1000 * 60 * 10,
  })
}

/** 작년 오늘의 기도에 '응답받았어요' — 기존 응답 등록(간증 필수)과 같은 API, 캐시는 여기서 직접 고친다 */
export const useAnswerMemoryPrayer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ prayerId, testimony }: { prayerId: number; testimony: string; prayerCount: number }) =>
      answerPrayer(prayerId, testimony),
    onSuccess: (_res, { prayerId, prayerCount }) => {
      qc.setQueryData<TodayChurch>(todayChurchKeys.today(), (prev) =>
        prev && {
          ...prev,
          memories: prev.memories.map((m) =>
            m.kind === 'prayer' && m.id === prayerId ? { ...m, is_answered: true } : m,
          ),
        },
      )
      // 응답의 전당·피드·프로필·기도방 응답률이 같은 기도를 보여 준다 (usePrayersInfinite 의 answer 와 같은 범위)
      qc.invalidateQueries({ queryKey: prayerKeys.lists(), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: prayerKeys.answeredCount() })
      qc.invalidateQueries({ queryKey: profileKeys.all, refetchType: 'none' })
      invalidateGroupStats(qc)
      // 함께 기도한 사람들에게는 서버가 응답 푸시를 보낸다(prayer_answer.py)
      showToast(prayerCount > 0 ? '응답의 기록이 남았어요. 함께 기도한 분들께도 전해 드릴게요' : '응답의 기록이 남았어요')
    },
    onError: (error: Error) => showToast(error.message, 'error'),
  })
}

// ── '아직 기도 중이에요' — 서버에 남길 일이 아니라 이 기기에서 버튼만 접는다 ──
const STILL_KEY = 'todayChurch.stillPraying'
const STILL_MAX = 60
const stillListeners = new Set<() => void>()
let stillCache: string | null | undefined

const readStill = (): string => {
  if (stillCache === undefined) stillCache = safeStorage.get(STILL_KEY)
  return stillCache ?? '[]'
}
const parseStill = (raw: string): number[] => {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []
  } catch {
    return []
  }
}

export const useStillPraying = () => {
  const raw = useSyncExternalStore(
    (fn) => {
      stillListeners.add(fn)
      return () => stillListeners.delete(fn)
    },
    readStill,
    () => '[]',
  )
  const ids = parseStill(raw)
  const mark = useCallback((prayerId: number) => {
    const next = [prayerId, ...parseStill(readStill()).filter((id) => id !== prayerId)].slice(0, STILL_MAX)
    stillCache = JSON.stringify(next)
    safeStorage.set(STILL_KEY, stillCache)
    stillListeners.forEach((fn) => fn())
    showToast('응답의 날까지 계속 함께 기도할게요')
  }, [])
  return { isStillPraying: (prayerId: number) => ids.includes(prayerId), markStillPraying: mark }
}
