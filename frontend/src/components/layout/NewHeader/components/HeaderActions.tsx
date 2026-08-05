import { useTheme } from '../../../../contexts/ThemeContext'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface HeaderActionsProps {
  unreadCount: number
  isMenuOpen: boolean
  onNotificationClick: () => void
  onMenuToggle: () => void
}

const HeaderActions = ({ unreadCount, isMenuOpen, onNotificationClick, onMenuToggle }: HeaderActionsProps) => {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const iconBaseClass =
    'text-gray-700 dark:text-white/80 hover:text-brand transition-colors'

  /* 24px 고정 박스 — 아이콘 폰트 로드 전 리가처 원문("dark_mode" 등)이
   * 헤더 폭을 밀어내 로고를 세로로 꺾는 것을 막는다 */
  const iconGlyphClass =
    'material-icons-outlined text-2xl inline-block w-6 h-6 overflow-hidden'

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleTheme}
        className={iconBaseClass}
        aria-label={t('themeToggleAria')}
      >
        <span className={iconGlyphClass}>
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <button
        onClick={onNotificationClick}
        className={`${iconBaseClass} relative`}
        aria-label={t('notificationsAria')}
      >
        <span className={iconGlyphClass}>notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand rounded-full ring-2 ring-background-light dark:ring-background-dark" />
        )}
      </button>

      <button
        onClick={onMenuToggle}
        className={`${iconBaseClass} ${isMenuOpen ? 'text-brand' : ''}`}
        aria-label={isMenuOpen ? t('menuCloseAria') : t('menuAria')}
      >
        <span className={iconGlyphClass}>
          {isMenuOpen ? 'close' : 'more_vert'}
        </span>
      </button>
    </div>
  )
}

export default HeaderActions
