import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLanguage } from '../../../contexts/LanguageContext'
import { isAdmin } from '../../../utils/auth'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationModal from '../../common/NotificationModal'
import './NewHeader.css'

const NewHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  
  // React Query로 알림 개수 조회 (중복 호출 방지)
  const { data } = useNotifications()
  const unreadCount = data?.unread_count || 0

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }

  useEffect(() => {
    setIsMenuOpen(false)
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
    setIsAdminUser(isAdmin())
  }, [location])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

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
    <>
      {/* Backdrop Blur Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark" ref={menuRef}>
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative">
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
            className={`relative transition-all ${
              isMenuOpen 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-800 dark:text-white hover:text-primary'
            }`}
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴"}
          >
            {/* X 버튼 빛나는 효과 (비상구 스타일) */}
            {isMenuOpen && (
              <>
                <div className="absolute inset-0 bg-red-500/30 dark:bg-red-400/30 blur-lg animate-pulse"></div>
                <div className="absolute inset-0 bg-red-500/20 dark:bg-red-400/20 blur-md"></div>
              </>
            )}
            <span className={`material-icons-outlined text-2xl relative z-10 ${
              isMenuOpen ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] dark:drop-shadow-[0_0_10px_rgba(248,113,113,0.9)]' : ''
            }`}>
              {isMenuOpen ? 'close' : 'more_vert'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark shadow-lg overflow-hidden z-50">
          <div className="max-w-md mx-auto">
            {/* 가로 스크롤 메뉴 */}
            <nav className="flex overflow-x-auto scrollbar-hide py-3 px-4 gap-3">
              <Link
                to="/about"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('about')}
              </Link>
              <Link
                to="/worship"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('worship')}
              </Link>
              <Link
                to="/sermon"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('sermon')}
              </Link>
              <Link
                to="/events"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('events')}
              </Link>
              <Link
                to="/ministry"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('ministry')}
              </Link>
              <Link
                to="/news"
                className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
              >
                {t('news')}
              </Link>
            </nav>
            
            <div className="border-t border-border-light dark:border-border-dark"></div>
            
            {/* 세로 메뉴 (언어, 관리자, 로그인/로그아웃) */}
            <div className="py-2">
              {/* 언어 전환 */}
              <button
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-surface-light dark:hover:bg-surface-dark transition-colors flex items-center gap-2"
              >
                <span className="text-base">{language === 'ko' ? '🇺🇸' : '🇰🇷'}</span>
                <span>{language === 'ko' ? 'English' : '한국어'}</span>
              </button>
              
              <div className="border-t border-border-light dark:border-border-dark my-2"></div>
              {isAdminUser && (
                <>
                  <Link
                    to="/admin/notifications"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    {t('notificationManagement')}
                  </Link>
                  <Link
                    to="/admin/daily-verse"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    {t('dailyVerseManagement')}
                  </Link>
                  <Link
                    to="/admin/bulletins"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    {t('bulletinManagement')}
                  </Link>
                  <Link
                    to="/admin/events"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    {t('eventManagement')}
                  </Link>
                  <Link
                    to="/admin/push"
                    className="block px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 font-semibold hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    📢 푸시 알림 관리
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
                    {t('logout')}
                  </span>
                  <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10"></div>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 text-sm font-semibold transition-colors relative group"
                >
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-indigo-700 dark:group-hover:from-purple-300 dark:group-hover:to-indigo-300">
                    {t('login')}
                  </span>
                  <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10"></div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </header>
    </>
  )
}

export default NewHeader
