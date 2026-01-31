import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import './MobileMenu.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setIsLoggedIn(false)
    onClose()
    navigate('/')
  }

  const menuItems = [
    { path: '/', label: '홈' },
    { path: '/about', label: '교회소개' },
    { path: '/tv', label: '참빛TV' },
    { path: '/education', label: '교육과 훈련' },
    { path: '/mission', label: '선교과 전도' },
    { path: '/ministry', label: '사역과 섬김' },
    { path: '/news', label: '교회소식' },
    { path: '/participate', label: '나눔과 참여' },
    { path: '/online', label: '온라인콘텐츠' },
    { path: '/culture', label: '문화교실' },
  ]

  return (
    <>
      <div 
        className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
        <nav className="mobile-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className="mobile-nav-link"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
          
          <div className="mobile-auth-section">
            <button 
              className="mobile-theme-toggle" 
              onClick={toggleTheme}
              aria-label="테마 전환"
            >
              {theme === 'dark' ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  <span>라이트 모드</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span>다크 모드</span>
                </>
              )}
            </button>
            
            {isLoggedIn ? (
              <button onClick={handleLogout} className="mobile-auth-button">
                로그아웃
              </button>
            ) : (
              <Link to="/login" className="mobile-auth-button" onClick={onClose}>
                로그인
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}

export default MobileMenu
