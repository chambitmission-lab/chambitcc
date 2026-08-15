import { useCallback, useState } from 'react'

// 스토리 모드 진행 상태 — 읽은 에피소드 id 목록을 localStorage에 보관.
// MVP는 기기 로컬 저장(백엔드 무변경). 서버 동기화는 후속 과제.
//
// 키는 계정별로 분리한다: 전역 키 하나만 쓰면 같은 기기에서 다른 사람이
// 로그인했을 때 이전 사용자의 "이어서 보기"가 그대로 보인다.
// 비로그인은 기존 키를 게스트 버킷으로 계속 쓴다.
const READ_KEY = 'bible-story-read-v1'
// 완주 축하 연출은 한 번만
const CELEBRATED_KEY = 'bible-story-celebrated-v1'

const userKey = (base: string): string => {
  try {
    const username = localStorage.getItem('user_username')
    return username ? `${base}:${username}` : base
  } catch {
    return base
  }
}

// 계정 구분이 없던 구버전 전역 키의 기록을 현재 로그인 계정으로 1회 이관.
// 실사용 기기는 본인 폰이라 전역 키의 기록은 그 계정의 것일 확률이 높다.
// 이관 후 전역 키는 지워, 이후 다른 계정·게스트에게 새어 나가지 않는다.
const migrateLegacy = (base: string) => {
  try {
    const username = localStorage.getItem('user_username')
    if (!username) return
    const key = `${base}:${username}`
    if (localStorage.getItem(key) != null) return
    const legacy = localStorage.getItem(base)
    if (legacy != null) {
      localStorage.setItem(key, legacy)
      localStorage.removeItem(base)
    }
  } catch {
    // 저장소 접근 실패(시크릿 모드 등)는 무시
  }
}

export const loadReadIds = (): Set<string> => {
  try {
    migrateLegacy(READ_KEY)
    const raw = localStorage.getItem(userKey(READ_KEY))
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

const saveReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(userKey(READ_KEY), JSON.stringify([...ids]))
  } catch {
    // 저장 실패(시크릿 모드 등)는 조용히 무시 — 세션 내 상태로만 동작
  }
}

export const hasCelebrated = (): boolean => {
  try {
    migrateLegacy(CELEBRATED_KEY)
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
