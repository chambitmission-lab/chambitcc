import { useTheme } from '../../../../contexts/ThemeContext'
import { prewarmThemeToggle } from '../../../../utils/themeAssets'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { SearchIconButton } from '../../../command/SearchTrigger'

interface HeaderActionsProps {
  unreadCount: number
  isMenuOpen: boolean
  onNotificationClick: () => void
  /** hover·터치 시작 시 알림 모달 청크를 미리 받는다 — 탭 시점엔 이미 도착해 바로 뜬다 */
  onNotificationWarm?: () => void
  onMenuToggle: () => void
  /** 비로그인일 때만 넘긴다 — 모바일에서 알림 종 대신 로그인 버튼을 보여준다 */
  onLogin?: () => void
}

const HeaderActions = ({ unreadCount, isMenuOpen, onNotificationClick, onNotificationWarm, onMenuToggle, onLogin }: HeaderActionsProps) => {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  /* inline-flex — 버튼 줄높이(≈32px) 안에서 24px 글리프가 위로 붙어 옆 로그인 알약과 4px 어긋났다 */
  const iconBaseClass =
    'inline-flex items-center justify-center text-gray-700 dark:text-white/80 hover:text-brand transition-colors'

  /* 24px 고정 박스 — 아이콘 폰트 로드 전 리가처 원문("dark_mode" 등)이
   * 헤더 폭을 밀어내 로고를 세로로 꺾는 것을 막는다.
   * leading-none 필수: text-2xl 의 line-height(32px)가 폰트 CSS의 line-height:1 을
   * 덮어써 글리프가 24px 박스 아래로 밀려 하단이 잘린다 */
  const iconGlyphClass =
    'material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden'

  return (
    <div className="flex items-center gap-4">
      {/* 검색(⌘K 팔레트) — 모바일 전용 축소 진입점. lg+ 는 중앙 검색 캡슐이 같은 팔레트를 열므로
          돋보기를 숨겨 헤더 노이즈를 줄인다 */}
      <SearchIconButton className={`${iconBaseClass} lg:hidden`} />
      <button
        onClick={toggleTheme}
        onPointerEnter={prewarmThemeToggle}
        onFocus={prewarmThemeToggle}
        className={iconBaseClass}
        aria-label={t('themeToggleAria')}
      >
        <span className={iconGlyphClass}>
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      {/* 비로그인 — 알림은 받을 게 없으니 종 자리를 로그인이 쓴다(PC lg+ 는 헤더 CTA가 따로 있다).
          로그아웃된 기존 교인이 햄버거 안까지 찾아 들어가지 않게 첫 화면에 꺼내 둔다 */}
      {onLogin ? (
        <button
          type="button"
          onClick={onLogin}
          className="hdr-login-pill lg:hidden"
        >
          {t('navCtaLogin')}
        </button>
      ) : (
        <button
          onClick={onNotificationClick}
          onPointerEnter={onNotificationWarm}
          onPointerDown={onNotificationWarm}
          onFocus={onNotificationWarm}
          className={`${iconBaseClass} relative`}
          aria-label={t('notificationsAria')}
        >
          <span className={iconGlyphClass}>notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-brand rounded-full ring-2 ring-background-light dark:ring-background-dark" />
          )}
        </button>
      )}

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
