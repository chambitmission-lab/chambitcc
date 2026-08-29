// ⌘K 팔레트·챗봇을 여는 전역 이벤트 이름과 헬퍼 (컴포넌트 파일과 분리 — fast refresh)
export const OPEN_SEARCH_EVENT = 'chambit:open-search'
export const OPEN_CHATBOT_EVENT = 'chambit:open-chatbot'
export const openCommandPalette = () => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))

// 팔레트 청크는 lazy — 트리거에 마우스가 올라오거나 포커스될 때 미리 받아둔다(한 번만)
let preloaded = false
export const preloadCommandPalette = () => {
  if (preloaded) return
  preloaded = true
  void import('./CommandPalette')
}

export const isMacLike = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
