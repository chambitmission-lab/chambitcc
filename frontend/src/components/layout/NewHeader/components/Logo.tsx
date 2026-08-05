import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const Logo = () => {
  const location = useLocation()
  const { t } = useLanguage()

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }

  /* shrink-0·nowrap — 아이콘 폰트 로드 전 우측 액션이 리가처 원문 텍스트 폭으로
     벌어져도 로고가 짓눌려 세로로 꺾이지 않게 한다 */
  return (
    <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative shrink-0">
      {/* 주변 빛 확산 — 브랜드 블루 (theme.css 토큰) */}
      <div className="absolute inset-0 bg-[var(--brand-glow)] blur-md animate-pulse" />

      <h1
        className="text-xl font-extrabold tracking-tighter font-display select-none text-ink-strong relative z-10 whitespace-nowrap"
        style={{ filter: 'drop-shadow(0 0 10px var(--brand-glow)) drop-shadow(0 0 20px var(--brand-glow))' }}
      >
        {t('churchName')}
      </h1>
    </Link>
  )
}

export default Logo
