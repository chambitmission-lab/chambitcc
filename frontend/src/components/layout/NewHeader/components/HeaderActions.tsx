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
    'text-gray-700 dark:text-white/80 hover:text-purple-600 dark:hover:text-purple-300 transition-colors'

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleTheme}
        className={iconBaseClass}
        aria-label={t('themeToggleAria')}
      >
        <span className="material-icons-outlined text-2xl">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <button
        onClick={onNotificationClick}
        className={`${iconBaseClass} relative`}
        aria-label={t('notificationsAria')}
      >
        <span className="material-icons-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-background-light dark:ring-background-dark" />
        )}
      </button>

      <button
        onClick={onMenuToggle}
        className={`${iconBaseClass} ${isMenuOpen ? 'text-purple-600 dark:text-purple-300' : ''}`}
        aria-label={isMenuOpen ? t('menuCloseAria') : t('menuAria')}
      >
        <span className="material-icons-outlined text-2xl">
          {isMenuOpen ? 'close' : 'more_vert'}
        </span>
      </button>
    </div>
  )
}

export default HeaderActions
