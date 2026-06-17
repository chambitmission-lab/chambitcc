import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import LangFlag from '../../../common/LangFlag'

interface SettingsMenuProps {
  isLoggedIn: boolean
  onLogout: () => void
}

const SettingsMenu = ({ isLoggedIn, onLogout }: SettingsMenuProps) => {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="py-2 px-3">
      {/* 언어 전환 */}
      <button
        onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
        className="
          w-full flex items-center gap-2 px-3 py-3 rounded-xl
          text-[14px] font-medium text-gray-900 dark:text-white/85
          hover:bg-gray-100/60 dark:hover:bg-white/[0.04]
          transition-colors
        "
      >
        <LangFlag code={language === 'ko' ? 'us' : 'kr'} className="text-base rounded-[2px]" />
        <span>{language === 'ko' ? 'English' : '한국어'}</span>
      </button>

      {/* 내 정보 (로그인 상태에서만) */}
      {isLoggedIn && (
        <Link
          to="/account"
          className="
            w-full flex items-center gap-2 px-3 py-3 rounded-xl
            text-[14px] font-medium text-gray-900 dark:text-white/85
            hover:bg-gray-100/60 dark:hover:bg-white/[0.04]
            transition-colors
          "
        >
          <span className="material-icons-outlined text-[18px] text-gray-500 dark:text-white/55">
            person
          </span>
          <span>{t('accountTitle')}</span>
        </Link>
      )}

      <div className="border-t border-border-light dark:border-border-dark my-2 mx-1" />

      {/* 로그인/로그아웃 — brand purple→pink 통일 */}
      {isLoggedIn ? (
        <button
          onClick={onLogout}
          className="
            w-full text-left px-3 py-3 rounded-xl text-[14px] font-bold tracking-[-0.01em]
            hover:bg-purple-50/70 dark:hover:bg-purple-500/10
            transition-colors
          "
        >
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
            {t('logout')}
          </span>
        </button>
      ) : (
        <Link
          to="/login"
          className="
            block px-3 py-3 rounded-xl text-[14px] font-bold tracking-[-0.01em]
            hover:bg-purple-50/70 dark:hover:bg-purple-500/10
            transition-colors
          "
        >
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
            {t('login')}
          </span>
        </Link>
      )}
    </div>
  )
}

export default SettingsMenu
