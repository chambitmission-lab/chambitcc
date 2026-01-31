import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './MobileMenu.css'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
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
