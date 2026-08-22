import { useEffect, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useNotifications, useNotificationStream } from '../../../hooks/useNotifications'
import { preloadMenuRoutes } from '../../../utils/routePreload'
import NotificationModal from '../../common/NotificationModal'
import Logo from './components/Logo'
import DesktopNav from './components/DesktopNav'
import HeaderActions from './components/HeaderActions'
import MobileMenu from './components/MobileMenu'
import { useDesktopRailVisible } from '../DesktopNavRail/DesktopNavRail'
import { useMenuState } from './hooks/useMenuState'
import { useAuthState } from './hooks/useAuthState'
import { useLogout } from './hooks/useLogout'
import './NewHeader.css'

const NewHeader = () => {
  const { t } = useLanguage()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  
  // Custom hooks
  const { isMenuOpen, setIsMenuOpen, menuRef } = useMenuState()
  const { isLoggedIn, isAdminUser, setIsLoggedIn, setIsAdminUser } = useAuthState()
  const { handleLogout } = useLogout(setIsLoggedIn, setIsAdminUser, () => setIsMenuOpen(false))
  
  // React Query로 알림 개수 조회 (첫 페이지 기준 전체 unread_count)
  const { data } = useNotifications()
  const unreadCount = data?.pages[0]?.unread_count ?? 0

  // SSE 실시간 알림 스트림 — 새 공지/개인 알림 시 뱃지·목록 즉시 갱신 (폴링 대체)
  useNotificationStream(isLoggedIn)

  // 본문(main-content)은 좌측 레일만큼 밀린 영역의 가운데에 정렬되므로,
  // 헤더 인라인 메뉴도 같은 축(50% + 레일폭/2)에 맞춰야 위아래 중심이 일치한다
  const railVisible = useDesktopRailVisible()

  // PC(lg+)에선 우상단 액션을 좌측 레일 하단으로 옮겼다 (DesktopNavRail 유틸리티).
  // 알림 모달·전체 메뉴 패널의 소유권은 헤더에 남기고, 레일은 열기만 요청한다.
  // (열린 뒤엔 백드롭/모달이 레일을 덮으므로 토글 경합이 생기지 않는다)
  useEffect(() => {
    const openNotifications = () => setIsNotificationOpen(true)
    const openMenu = () => setIsMenuOpen(true)
    window.addEventListener('chambit:open-notifications', openNotifications)
    window.addEventListener('chambit:open-menu', openMenu)
    return () => {
      window.removeEventListener('chambit:open-notifications', openNotifications)
      window.removeEventListener('chambit:open-menu', openMenu)
    }
  }, [setIsMenuOpen])

  // 메뉴를 여는 순간 = 곧 이동한다는 신호 → 메뉴 페이지 청크를 미리 로드
  // (이미 받은 청크는 스킵되므로 유휴 프리로드와 중복돼도 비용 없음)
  useEffect(() => {
    if (isMenuOpen) void preloadMenuRoutes()
  }, [isMenuOpen])

  return (
    <>
      {/* Backdrop Blur Overlay — 하단 dock(z-100)까지 덮도록 dock보다 위 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[101]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 메뉴가 열리면 헤더(와 그 안의 드롭다운 메뉴)를 하단 dock(z-100) 위,
          모달류(z-110+) 아래로 올린다 — 평소 z-60을 유지해야 모달이 헤더를 덮을 수 있음 */}
      <header
        className={`fixed top-0 left-0 right-0 ${isMenuOpen ? 'z-[105]' : 'z-[60]'} bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06]`}
        ref={menuRef}
      >
        {/* lg+: 데스크톱 앱바 — 로고는 좌상단(좌측 레일과 정렬), 액션은 우상단 */}
        <div className="relative max-w-md mx-auto px-4 h-14 flex items-center justify-between lg:max-w-none lg:px-5">
          <Logo />
          {/* PC 전용 인라인 메뉴 — 본문 중심축(50% + 레일폭/2: lg 38px, xl 124px)에 절대 배치해
              페이지 콘텐츠와 세로 중심선이 일치하게 한다. 레일이 숨는 화면에선 화면 정중앙. */}
          <div
            className={`hidden lg:flex absolute inset-y-0 items-center gap-2 -translate-x-1/2 ${
              railVisible ? 'left-[calc(50%+38px)] xl:left-[calc(50%+124px)]' : 'left-1/2'
            }`}
          >
            <DesktopNav />
            {/* 사이트맵 트리거 — 레일 하단 ⋮ 만으론 전체 메뉴 입구가 안 보여서,
                캡슐 옆에 상시 노출한다. 레일이 없는 화면(인증 등)은 우상단
                햄버거(HeaderActions)가 같은 패널을 열므로 중복 노출하지 않는다 */}
            {railVisible && (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                onMouseEnter={() => void preloadMenuRoutes()}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13.5px] whitespace-nowrap ring-1 ring-inset transition-colors duration-150 ${
                  isMenuOpen
                    ? 'bg-[var(--brand-soft-strong)] text-brand font-bold ring-transparent'
                    : 'text-gray-600 dark:text-white/70 font-medium ring-black/[0.06] dark:ring-white/[0.08] hover:text-brand hover:bg-[var(--brand-soft)] hover:ring-transparent'
                }`}
              >
                <svg
                  className="w-[15px] h-[15px] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.2" />
                  <rect x="13" y="3.5" width="7.5" height="7.5" rx="2.2" />
                  <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.2" />
                  <rect x="13" y="13" width="7.5" height="7.5" rx="2.2" />
                </svg>
                {t('allMenu')}
              </button>
            )}
          </div>
          {/* 우상단 액션 — 레일이 보이는 PC에선 레일 하단 유틸리티가 대신한다 */}
          <div className={railVisible ? 'lg:hidden' : ''}>
            <HeaderActions
              unreadCount={unreadCount}
              isMenuOpen={isMenuOpen}
              onNotificationClick={() => setIsNotificationOpen(true)}
              onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <MobileMenu 
            isAdminUser={isAdminUser}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        )}
      </header>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  )
}

export default NewHeader
