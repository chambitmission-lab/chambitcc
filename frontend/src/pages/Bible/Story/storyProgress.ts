import { useCallback, useState } from 'react'

// 스토리 모드 진행 상태 — 읽은 에피소드 id 목록을 localStorage에 보관.
// MVP는 기기 로컬 저장(백엔드 무변경). 서버 동기화는 후속 과제.
const READ_KEY = 'bible-story-read-v1'
// 완주 축하 연출은 한 번만
const CELEBRATED_KEY = 'bible-story-celebrated-v1'

export const loadReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

const saveReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch {
    // 저장 실패(시크릿 모드 등)는 조용히 무시 — 세션 내 상태로만 동작
  }
}

export const hasCelebrated = (): boolean => {
  try {
    return localStorage.getItem(CELEBRATED_KEY) === '1'
  } catch {
    return true
  }
}

export const markCelebrated = () => {
  try {
    localStorage.setItem(CELEBRATED_KEY, '1')
  } catch {
    // 무시
  }
}

// 읽음 상태를 React 상태로 쓰는 훅 — 페이지 단위로 쓰므로 탭 간 동기화는 불필요
export const useStoryProgress = () => {
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  return { readIds, markRead }
}
