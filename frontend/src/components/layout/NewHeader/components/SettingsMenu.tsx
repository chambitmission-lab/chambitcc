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
      {/* 내 정보 (로그인 상태에서만) — 하단 탭바 마이페이지와 동선 일치 */}
      {isLoggedIn && (
        <>
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

          <div className="border-t border-border-light dark:border-border-dark my-2 mx-1" />
        </>
      )}

      {/* 푸터 행: 언어 전환(좌) + 로그인/로그아웃(우) — 다국어 설정은 최하단 컨벤션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          className="
            flex items-center gap-1.5 px-3 py-2.5 rounded-xl
            text-[13px] font-medium text-gray-500 dark:text-white/55
            hover:bg-gray-100/60 dark:hover:bg-white/[0.04]
            hover:text-gray-900 dark:hover:text-white/85
            transition-colors
          "
        >
          <LangFlag code={language === 'ko' ? 'us' : 'kr'} className="text-sm rounded-[2px]" />
          <span>{language === 'ko' ? 'English' : '한국어'}</span>
        </button>

        {/* 로그인/로그아웃 — 브랜드 블루 통일 */}
        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="
              px-3 py-2.5 rounded-xl text-[14px] font-bold tracking-[-0.01em]
              text-brand
              hover:bg-[var(--brand-soft)]
              transition-colors
            "
          >
            {t('logout')}
          </button>
        ) : (
          <Link
            to="/login"
            className="
              px-3 py-2.5 rounded-xl text-[14px] font-bold tracking-[-0.01em]
              text-brand
              hover:bg-[var(--brand-soft)]
              transition-colors
            "
          >
            {t('login')}
          </Link>
        )}
      </div>
    </div>
  )
}

export default SettingsMenu
