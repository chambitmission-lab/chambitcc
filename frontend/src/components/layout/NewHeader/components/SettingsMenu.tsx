import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface SettingsMenuProps {
  isLoggedIn: boolean
  onLogout: () => void
}

const SettingsMenu = ({ isLoggedIn, onLogout }: SettingsMenuProps) => {
  const { language, setLanguage, t } = useLanguage()

  return (
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
      
      {isLoggedIn ? (
        <button
          onClick={onLogout}
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
  )
}

export default SettingsMenu
