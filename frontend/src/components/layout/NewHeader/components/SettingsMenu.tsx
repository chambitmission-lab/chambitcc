import { Link } from 'react-router-dom'
import { Sparkle } from '@phosphor-icons/react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import LangFlag from '../../../common/LangFlag'
import { IconPerson } from './NavIcons'
import { useChatbotVisibility } from '../../../chatbot/chatbotVisibility'

interface SettingsMenuProps {
  isLoggedIn: boolean
  onLogout: () => void
}

const SettingsMenu = ({ isLoggedIn, onLogout }: SettingsMenuProps) => {
  const { language, setLanguage, t } = useLanguage()
  // 참비 플로팅 버튼 노출 — FAB 의 × 로 "계속 숨기기"를 고른 뒤 되살리는 유일한 경로다
  const { visible: chatbotVisible, toggle: toggleChatbot } = useChatbotVisibility()

  return (
    // lg+: 메가 메뉴 카드의 한 줄 푸터 — 내 정보(좌) · 언어/로그아웃(우)
    <div className="py-2 px-3 lg:px-5 lg:flex lg:items-center lg:justify-between lg:gap-4">
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
              lg:w-auto lg:py-2.5
            "
          >
            <IconPerson className="w-[18px] h-[18px] text-ink-muted" />
            <span>{t('accountTitle')}</span>
          </Link>

          <div className="border-t border-border-light dark:border-border-dark my-2 mx-1 lg:hidden" />
        </>
      )}

      {/* 참비 플로팅 버튼 on/off */}
      <button
        type="button"
        role="switch"
        aria-checked={chatbotVisible}
        onClick={toggleChatbot}
        className="
          w-full flex items-center gap-2 px-3 py-3 rounded-xl
          text-[14px] font-medium text-gray-900 dark:text-white/85
          hover:bg-gray-100/60 dark:hover:bg-white/[0.04]
          transition-colors
          lg:w-auto lg:py-2.5
        "
      >
        <Sparkle size={18} weight="duotone" className="text-ink-muted" />
        <span>참비 버튼</span>
        <span
          aria-hidden
          className={`ml-auto lg:ml-2 relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
            chatbotVisible ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <span
            className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200 ${
              chatbotVisible ? 'left-[19px]' : 'left-[3px]'
            }`}
          />
        </span>
      </button>

      <div className="border-t border-border-light dark:border-border-dark my-2 mx-1 lg:hidden" />

      {/* 푸터 행: 언어 전환(좌) + 로그인/로그아웃(우) — 다국어 설정은 최하단 컨벤션 */}
      <div className="flex items-center justify-between lg:justify-end lg:gap-2 lg:ml-auto">
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
