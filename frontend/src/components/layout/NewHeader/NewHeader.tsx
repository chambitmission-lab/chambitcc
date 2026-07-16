import { useState } from 'react'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationModal from '../../common/NotificationModal'
import Logo from './components/Logo'
import HeaderActions from './components/HeaderActions'
import MobileMenu from './components/MobileMenu'
import { useMenuState } from './hooks/useMenuState'
import { useAuthState } from './hooks/useAuthState'
import { useLogout } from './hooks/useLogout'
import './NewHeader.css'

const NewHeader = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  
  // Custom hooks
  const { isMenuOpen, setIsMenuOpen, menuRef } = useMenuState()
  const { isLoggedIn, isAdminUser, setIsLoggedIn, setIsAdminUser } = useAuthState()
  const { handleLogout } = useLogout(setIsLoggedIn, setIsAdminUser, () => setIsMenuOpen(false))
  
  // React Query로 알림 개수 조회 (첫 페이지 기준 전체 unread_count)
  const { data } = useNotifications()
  const unreadCount = data?.pages[0]?.unread_count ?? 0

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
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <HeaderActions 
            unreadCount={unreadCount}
            isMenuOpen={isMenuOpen}
            onNotificationClick={() => setIsNotificationOpen(true)}
            onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          />
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
