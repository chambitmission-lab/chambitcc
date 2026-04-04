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
  const { handleLogout } = useLogout(setIsLoggedIn, setIsAdminUser)
  
  // React Query로 알림 개수 조회
  const { data } = useNotifications()
  const unreadCount = data?.unread_count || 0

  return (
    <>
      {/* Backdrop Blur Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[55]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <header 
        className="fixed top-0 left-0 right-0 z-[60] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark" 
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
