import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './NewHeader.css'

const NewHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setIsLoggedIn(false)
    navigate('/')
  }

  const navItems = [
    { path: '/about', label: '소개' },
    { path: '/worship', label: '예배' },
    { path: '/sermon', label: '말씀' },
    { path: '/ministry', label: '사역' },
    { path: '/news', label: '소식' },
  ]

  return (
    <header className={`new-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <span className="logo-text">참빛</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="header-btn">
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="header-btn">
              로그인
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴"
        >
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mobile-divider" />
          {isLoggedIn ? (
            <button onClick={handleLogout} className="mobile-nav-link">
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="mobile-nav-link">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default NewHeader
