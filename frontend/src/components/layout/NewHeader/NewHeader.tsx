import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../../contexts/ThemeContext'
import { isAdmin } from '../../../utils/auth'
import { useUnreadCount } from '../../../hooks/useNotifications'
import NotificationModal from '../../common/NotificationModal'
import './NewHeader.css'

const NewHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, toggleTheme } = useTheme()
  
  // React Query로 알림 개수 조회 (중복 호출 방지)
  const { data: unreadCount = 0 } = useUnreadCount()

  useEffect(() => {
    setIsMenuOpen(false)
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
    setIsAdminUser(isAdmin())
  }, [location])

  const handleLogout = async () => {
    // 1. 진행 중인 쿼리 취소
    await queryClient.cancelQueries()
    
    // 2. React Query 메모리 캐시 삭제
    queryClient.clear()
    
    // 3. localStorage 정리 (토큰, 사용자 정보, 영구 캐시)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_username')
    localStorage.removeItem('user_full_name')
    localStorage.removeItem('user_fingerprint')
    localStorage.removeItem('REACT_QUERY_CACHE')
    
    // 4. 상태 업데이트
    setIsLoggedIn(false)
    setIsAdminUser(false)
    
    // 5. 홈으로 이동 (리로드 없이 React Router로 처리)
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 relative">
          {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
          {/* 주변 빛 확산 효과 */}
          <div className="absolute inset-0 bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
          
          <h1 className="text-xl font-extrabold tracking-tighter font-display select-none text-gray-900 dark:text-white relative z-10 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] dark:drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]">
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
            <span className="material-icons-outlined text-2xl">more_vert</span>
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
                  className="block w-full text-left px-4 py-3 text-sm font-semibold transition-colors relative group"
                >
                  <span className="bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent group-hover:from-amber-700 group-hover:to-orange-600 dark:group-hover:from-amber-300 dark:group-hover:to-orange-300">
                    로그아웃
                  </span>
                  <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10"></div>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 text-sm font-semibold transition-colors relative group"
                >
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-indigo-700 dark:group-hover:from-purple-300 dark:group-hover:to-indigo-300">
                    로그인
                  </span>
                  <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10"></div>
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
      />
    </header>
  )
}

export default NewHeader
