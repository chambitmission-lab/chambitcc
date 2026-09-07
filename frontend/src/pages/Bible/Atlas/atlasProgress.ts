import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAtlasProgress, markAtlasPlaceVisited } from '../../../api/bibleAtlas'
import { isAuthenticated } from '../../../utils/auth'
import { scheduleTitleEvaluation } from '../../../utils/titleUnlockBus'
import { sessionStore } from '../../../utils/tokenStore'

// 지도여행 방문 기록 — 여권에 찍히는 도장.
//
// 로그인 사용자는 서버(bible_atlas_progress)가 단일 출처다. 모아 온 도장이
// 브라우저 저장소 정리(iOS 홈화면 PWA 의 7일 ITP 등)로 사라지면 이 기능의
// 의미가 통째로 없어지기 때문이다 — 스토리 모드(storyProgress.ts)와 같은 이유,
// 같은 구조로 맞췄다.
//
// 비로그인(게스트)은 계정이 없으니 기기 로컬에만 남는다. 로그인 시 게스트
// 기록을 서버로 합치지는 않는다(로그인 이후 기록만 영속).
const GUEST_VISITED_KEY = 'bible-atlas-visited-v1'
// 여정 완주 축하 연출은 여정당 한 번만 (연출 상태라 로컬 보관)
const CELEBRATED_KEY = 'bible-atlas-celebrated-v1'

export const ATLAS_PROGRESS_KEY = ['bible', 'atlas-progress'] as const

const userKey = (base: string): string => {
  try {
    const username = sessionStore.get('username')
    return username ? `${base}:${username}` : base
  } catch {
    return base
  }
}

const loadGuestVisited = (): Set<string> => {
  try {
    const raw = localStorage.getItem(GUEST_VISITED_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

const saveGuestVisited = (ids: Set<string>) => {
  try {
    localStorage.setItem(GUEST_VISITED_KEY, JSON.stringify([...ids]))
  } catch {
    // 저장 실패(시크릿 모드 등)는 조용히 무시 — 세션 내 상태로만 동작
  }
}

const loadCelebrated = (): Set<string> => {
  try {
    const raw = localStorage.getItem(userKey(CELEBRATED_KEY))
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/** 이 여정의 완주 축하를 이미 봤는가 */
export const hasCelebratedJourney = (journeyId: string): boolean =>
  loadCelebrated().has(journeyId)

export const markJourneyCelebrated = (journeyId: string) => {
  try {
    const next = loadCelebrated()
    next.add(journeyId)
    localStorage.setItem(userKey(CELEBRATED_KEY), JSON.stringify([...next]))
  } catch {
    // 무시
  }
}

/**
 * 방문 상태 훅 — 로그인이면 서버, 아니면 로컬.
 *
 * 방문 처리는 낙관적 반영 후 POST(멱등) — 실패 시 재조회로 서버 상태에 맞춘다.
 */
export const useAtlasProgress = () => {
  const authed = isAuthenticated()
  const queryClient = useQueryClient()

  const { data: serverIds } = useQuery({
    queryKey: ATLAS_PROGRESS_KEY,
    queryFn: getAtlasProgress,
    enabled: authed,
    staleTime: 1000 * 60 * 5,
  })

  const [guestIds, setGuestIds] = useState<Set<string>>(loadGuestVisited)

  const visitedIds = useMemo(
    () => (authed ? new Set(serverIds ?? []) : guestIds),
    [authed, serverIds, guestIds]
  )

  const { mutate } = useMutation({
    mutationFn: markAtlasPlaceVisited,
    // 멱등 POST 라 순단에는 재시도가 안전하다 — 여기서 놓치면 도장이 조용히 사라진다
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    onSuccess: (ids) => {
      queryClient.setQueryData(ATLAS_PROGRESS_KEY, ids)
      // 읽기·플랜·스토리와 동일하게 칭호 평가를 예약한다 (전역 TitleUnlockHost 가 팝업 처리)
      scheduleTitleEvaluation()
    },
    onError: () => {
      // 낙관적 반영을 서버 실제 상태로 되돌린다
      queryClient.invalidateQueries({ queryKey: ATLAS_PROGRESS_KEY })
    },
  })

  const markVisited = useCallback(
    (placeId: string) => {
      if (!authed) {
        setGuestIds((prev) => {
          if (prev.has(placeId)) return prev
          const next = new Set(prev)
          next.add(placeId)
          saveGuestVisited(next)
          return next
        })
        return
      }

      const prev = queryClient.getQueryData<string[]>(ATLAS_PROGRESS_KEY)
      if (prev?.includes(placeId)) return
      queryClient.setQueryData<string[]>(ATLAS_PROGRESS_KEY, [...(prev ?? []), placeId])
      mutate(placeId)
    },
    [authed, mutate, queryClient]
  )

  return { visitedIds, markVisited }
}
