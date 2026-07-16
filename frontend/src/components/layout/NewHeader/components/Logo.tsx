import { Link, useLocation } from 'react-router-dom'

const Logo = () => {
  const location = useLocation()

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }

  return (
    <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative">
      {/* 주변 빛 확산 — 브랜드 블루 (theme.css 토큰) */}
      <div className="absolute inset-0 bg-[var(--brand-glow)] blur-md animate-pulse" />

      <h1
        className="text-xl font-extrabold tracking-tighter font-display select-none text-gray-900 dark:text-white relative z-10"
        style={{ filter: 'drop-shadow(0 0 10px var(--brand-glow)) drop-shadow(0 0 20px var(--brand-glow))' }}
      >
        참빛교회
      </h1>
    </Link>
  )
}

export default Logo
