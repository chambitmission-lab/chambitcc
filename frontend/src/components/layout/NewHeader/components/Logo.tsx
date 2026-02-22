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
      {/* 주변 빛 확산 효과 */}
      <div className="absolute inset-0 bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
      
      <h1 className="text-xl font-extrabold tracking-tighter font-display select-none text-gray-900 dark:text-white relative z-10 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] dark:drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]">
        참빛교회
      </h1>
    </Link>
  )
}

export default Logo
