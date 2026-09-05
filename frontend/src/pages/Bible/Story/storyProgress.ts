import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoryProgress, markStoryEpisodeRead } from '../../../api/bibleStory'
import { isAuthenticated } from '../../../utils/auth'
import { scheduleTitleEvaluation } from '../../../utils/titleUnlockBus'
import { sessionStore } from '../../../utils/tokenStore'

// 스토리 모드 진행 상태 — 읽은 에피소드 id 목록.
//
// 로그인 사용자는 서버(bible_story_progress)가 단일 출처다.
// 예전에는 localStorage 뿐이라 세션이 만료돼 user_username 이 사라지거나
// (iOS 홈화면 PWA 의 7일 ITP 정리처럼) 브라우저가 저장소를 비우면 42화 진행이
// 통째로 사라졌다. 그 재발을 막는 것이 서버 저장의 이유다.
//
// 비로그인(게스트)은 계정이 없으니 여전히 기기 로컬에만 남는다. 로그인 시
// 게스트 기록을 서버로 합치지는 않는다(로그인 이후 기록만 영속).
const GUEST_READ_KEY = 'bible-story-read-v1'
// 완주 축하 연출은 한 번만 (연출 상태라 로컬 보관)
const CELEBRATED_KEY = 'bible-story-celebrated-v1'

export const STORY_PROGRESS_KEY = ['bible', 'story-progress'] as const

const userKey = (base: string): string => {
  try {
    const username = sessionStore.get('username')
    return username ? `${base}:${username}` : base
  } catch {
    return base
  }
}

const loadGuestReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(GUEST_READ_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

const saveGuestReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(GUEST_READ_KEY, JSON.stringify([...ids]))
  } catch {
    // 저장 실패(시크릿 모드 등)는 조용히 무시 — 세션 내 상태로만 동작
  }
}

export const hasCelebrated = (): boolean => {
  try {
    return localStorage.getItem(userKey(CELEBRATED_KEY)) === '1'
  } catch {
    return true
  }
}

export const markCelebrated = () => {
  try {
    localStorage.setItem(userKey(CELEBRATED_KEY), '1')
  } catch {
    // 무시
  }
}

/**
 * 읽음 상태 훅 — 로그인이면 서버, 아니면 로컬.
 *
 * 서버 목록은 React Query 캐시를 공유하므로 지도/에피소드/성경 허브가 같은 값을 본다.
 * 읽음 처리는 낙관적 반영 후 POST(멱등) — 실패 시 재조회로 서버 상태에 맞춘다.
 */
export const useStoryProgress = () => {
  const authed = isAuthenticated()
  const queryClient = useQueryClient()

  const { data: serverIds } = useQuery({
    queryKey: STORY_PROGRESS_KEY,
    queryFn: getStoryProgress,
    enabled: authed,
    staleTime: 1000 * 60 * 5,
  })

  const [guestIds, setGuestIds] = useState<Set<string>>(loadGuestReadIds)

  const readIds = useMemo(
    () => (authed ? new Set(serverIds ?? []) : guestIds),
    [authed, serverIds, guestIds]
  )

  const { mutate } = useMutation({
    mutationFn: markStoryEpisodeRead,
    // 멱등 POST 라 순단에는 재시도가 안전하다 — 여기서 놓치면 진행이 조용히 사라진다
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
    onSuccess: ids => {
      queryClient.setQueryData(STORY_PROGRESS_KEY, ids)
      // 마지막 42화 완주가 '초보 딱지 뗀 자' 해금으로 이어지므로, 읽기·플랜과 동일하게
      // 칭호 평가를 예약한다 (전역 TitleUnlockHost 가 팝업 처리)
      scheduleTitleEvaluation()
    },
    onError: () => {
      // 낙관적 반영을 서버 실제 상태로 되돌린다
      queryClient.invalidateQueries({ queryKey: STORY_PROGRESS_KEY })
    },
  })

  const markRead = useCallback(
    (id: string) => {
      if (!authed) {
        setGuestIds(prev => {
          if (prev.has(id)) return prev
          const next = new Set(prev)
          next.add(id)
          saveGuestReadIds(next)
          return next
        })
        return
      }

      const prev = queryClient.getQueryData<string[]>(STORY_PROGRESS_KEY)
      if (prev?.includes(id)) return
      queryClient.setQueryData<string[]>(STORY_PROGRESS_KEY, [...(prev ?? []), id])
      mutate(id)
    },
    [authed, mutate, queryClient]
  )

  return { readIds, markRead }
}
