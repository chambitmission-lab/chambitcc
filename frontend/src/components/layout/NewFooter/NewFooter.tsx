import { Link } from 'react-router-dom'
import './NewFooter.css'

const NewFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="new-footer">
      <div className="footer-inner">
        {/* Main Content */}
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <h2 className="footer-logo">참빛</h2>
            <p className="footer-tagline">
              어둠 속에서 빛을 비추는 교회
            </p>
          </div>

          {/* Sections Wrapper for better mobile layout */}
          <div className="footer-sections-wrapper">
            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">바로가기</h3>
              <nav className="footer-links">
                <Link to="/about">소개</Link>
                <Link to="/worship">예배</Link>
                <Link to="/sermon">말씀</Link>
                <Link to="/ministry">사역</Link>
              </nav>
            </div>

            {/* Contact */}
            <div className="footer-section">
              <h3 className="footer-title">연락처</h3>
              <div className="footer-contact">
                <p>Tel: 032-323-1004</p>
                <p className="footer-address">
                  경기도 부천시<br />
                  송내대로265번길 29
                </p>
              </div>
            </div>

            {/* Social */}
            <div className="footer-section">
              <h3 className="footer-title">소통</h3>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="YouTube">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-divider" />
          <div className="footer-copyright">
            <p>© {currentYear} 참빛교회. All rights reserved.</p>
            <p className="footer-credit">Provided By 교회사랑넷</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default NewFooter
