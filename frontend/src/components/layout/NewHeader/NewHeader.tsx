import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../../contexts/ThemeContext'
import { logout, isAdmin } from '../../../utils/auth'
import { getUnreadCount } from '../../../api/notification'
import NotificationModal from '../../common/NotificationModal'
import './NewHeader.css'

const NewHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setIsMenuOpen(false)
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
    setIsAdminUser(isAdmin())
    
    // 읽지 않은 알림 개수 로드
    if (token) {
      loadUnreadCount()
    }
  }, [location])

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('읽지 않은 알림 개수 로드 실패:', error)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tighter font-display select-none text-gray-900 dark:text-white">
            참빛교회
          </h1>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button 
            onClick={toggleTheme}
            className="text-gray-800 dark:text-white hover:text-primary transition-colors"
            aria-label="테마 변경"
          >
            <span className="material-icons-outlined text-2xl">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="text-gray-800 dark:text-white hover:text-primary transition-colors relative"
            aria-label="알림"
          >
            <span className="material-icons-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black"></span>
            )}
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-800 dark:text-white hover:text-primary transition-colors"
            aria-label="메뉴"
          >
            <span className="material-icons-outlined text-2xl -rotate-12 mb-1">send</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark shadow-lg">
          <div className="max-w-md mx-auto">
            <nav className="py-2">
              <Link
                to="/about"
                className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                소개
              </Link>
              <Link
                to="/worship"
                className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                예배
              </Link>
              <Link
                to="/sermon"
                className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                말씀
              </Link>
              <Link
                to="/ministry"
                className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                사역
              </Link>
              <Link
                to="/news"
                className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                소식
              </Link>
              <div className="border-t border-border-light dark:border-border-dark my-2"></div>
              {isAdminUser && (
                <>
                  <Link
                    to="/admin/notifications"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    📢 공지사항 관리
                  </Link>
                  <div className="border-t border-border-light dark:border-border-dark my-2"></div>
                </>
              )}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 text-sm text-primary font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                >
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={loadUnreadCount}
      />
    </header>
  )
}

export default NewHeader
