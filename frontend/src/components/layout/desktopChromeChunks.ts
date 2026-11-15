import { tokenStore } from '../../utils/tokenStore'

// PC 크롬(헤더 메뉴 + 좌측 레일)의 lazy 청크 로더 — React.lazy 와 앱 시작 시 미리 받기가
// 같은 약속을 공유해야 청크 요청이 한 번이다.
// 두 청크는 lg(1024px) 이상에서만 쓰이므로 엔트리에서 떼어 두었는데, lazy 는 "처음 그릴 때"
// 요청을 시작한다. 그러면 엔트리 평가 → 첫 렌더 → 그제서야 요청이라, 새로고침 때마다
// 헤더·레일이 본문보다 한 박자 늦게 채워졌다. main.tsx 가 렌더 전에 warmDesktopChrome 을
// 불러 요청을 앞당긴다(늦는 동안의 자리는 DesktopNavFallback·DesktopNavRailShell 이 지킨다).

let navChunk: Promise<typeof import('./NewHeader/components/DesktopNav')> | undefined
let railChunk: Promise<typeof import('./DesktopNavRail/DesktopNavRail')> | undefined

export const loadDesktopNav = () => (navChunk ??= import('./NewHeader/components/DesktopNav'))
export const loadDesktopNavRail = () => (railChunk ??= import('./DesktopNavRail/DesktopNavRail'))

/** 앱 시작 시 한 번 — PC 폭일 때만 받는다(모바일은 지금처럼 한 바이트도 받지 않는다) */
export const warmDesktopChrome = (): void => {
  try {
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    void loadDesktopNav().catch(() => {})
    // 레일은 비로그인 랜딩에선 안 뜬다(useDesktopRailVisible) — 로그인 사용자만 미리 받는다
    if (tokenStore.hasAccess()) void loadDesktopNavRail().catch(() => {})
  } catch {
    /* matchMedia 없는 환경 — lazy 가 평소대로 받는다 */
  }
}
