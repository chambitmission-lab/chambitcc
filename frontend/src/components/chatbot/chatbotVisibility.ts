import { useCallback, useSyncExternalStore } from 'react'

/**
 * 참비 FAB 노출 여부.
 *
 * - 기본 숨김은 "이번 방문만"(sessionStorage) — 새로고침하면 참비가 다시 나온다.
 * - 스낵바의 "계속 숨기기"를 고르면 기기 영구(localStorage)로 승격한다.
 * - 위젯 · 전체 메뉴(⋮) 토글이 같은 상태를 봐야 해서 스토리지 + 커스텀 이벤트로 동기화한다.
 *
 * 숨겨도 ⌘K 팔레트/홈 레일의 "참비에게 물어보기"(OPEN_CHATBOT_EVENT)는 그대로 열린다 —
 * 숨기는 대상은 플로팅 버튼이지 기능이 아니다.
 */
const SESSION_KEY = 'chambit:chatbot-hidden'
const PERSIST_KEY = 'chambit:chatbot-hidden-forever'

export const CHATBOT_VISIBILITY_EVENT = 'chambit:chatbot-visibility'

// 시크릿 모드·스토리지 차단 브라우저에서 getItem/setItem 자체가 throw 한다
const read = (store: () => Storage, key: string) => {
  try {
    return store().getItem(key) === '1'
  } catch {
    return false
  }
}
const write = (store: () => Storage, key: string, on: boolean) => {
  try {
    if (on) store().setItem(key, '1')
    else store().removeItem(key)
  } catch {
    /* 저장 못 해도 이번 세션 동작은 유지된다 */
  }
}

export const isChatbotHiddenForever = () => read(() => localStorage, PERSIST_KEY)
export const isChatbotHidden = () => read(() => sessionStorage, SESSION_KEY) || isChatbotHiddenForever()

const emit = () => window.dispatchEvent(new Event(CHATBOT_VISIBILITY_EVENT))

/** 이번 방문만 숨김 (기본) */
export const hideChatbot = () => {
  write(() => sessionStorage, SESSION_KEY, true)
  emit()
}

/** 이 기기에서 계속 숨김 */
export const hideChatbotForever = () => {
  write(() => sessionStorage, SESSION_KEY, true)
  write(() => localStorage, PERSIST_KEY, true)
  emit()
}

/** 되돌리기 · 전체 메뉴 토글 — 세션/영구 숨김을 모두 해제 */
export const showChatbot = () => {
  write(() => sessionStorage, SESSION_KEY, false)
  write(() => localStorage, PERSIST_KEY, false)
  emit()
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHATBOT_VISIBILITY_EVENT, onChange)
  // 다른 탭에서 "계속 숨기기"를 눌렀을 때도 따라간다
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHATBOT_VISIBILITY_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export const useChatbotHidden = () =>
  useSyncExternalStore(subscribe, isChatbotHidden, () => false)

/** 전체 메뉴 토글용 — [보임 여부, 토글] */
export const useChatbotVisibility = () => {
  const hidden = useChatbotHidden()
  const toggle = useCallback(() => {
    if (hidden) showChatbot()
    else hideChatbotForever()
  }, [hidden])
  return { visible: !hidden, toggle }
}
