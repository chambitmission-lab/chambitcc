import { useLocation } from 'react-router-dom'
import { tokenStore } from '../../../utils/tokenStore'

// 몰입형·인증 화면에선 좌측 레일을 숨긴다 (본문 오프셋도 함께 빠져야 하므로 훅을 공유).
// DesktopNavRail 본체는 PC 에서만 lazy 로 받으므로, 헤더·App 이 공유하는 이 훅은
// 별도 파일에 둔다 — 같은 파일에 있으면 훅 import 만으로 레일 전체가 엔트리에 딸려 온다.
const HIDDEN_PATHS = ['/login', '/register', '/prayer-focus', '/prayer-topics/screen']

export const useDesktopRailVisible = (): boolean => {
  const { pathname } = useLocation()
  if (HIDDEN_PATHS.includes(pathname)) return false
  // 랜딩(비로그인 홈·/welcome 미리보기)은 제품 소개 화면 — 앱 크롬 없이 전체 폭을 쓴다.
  // 로그인 판정은 App.tsx의 홈 분기와 같은 기준(localStorage 토큰)을 쓴다.
  if (pathname === '/welcome') return false
  if (pathname === '/' && !tokenStore.getAccess()) return false
  return true
}
