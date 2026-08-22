// ⌘K 팔레트·챗봇을 여는 전역 이벤트 이름과 헬퍼 (컴포넌트 파일과 분리 — fast refresh)
export const OPEN_SEARCH_EVENT = 'chambit:open-search'
export const OPEN_CHATBOT_EVENT = 'chambit:open-chatbot'
export const openCommandPalette = () => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))

export const isMacLike = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
