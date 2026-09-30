import { useState } from 'react'
import NavigationMenu from './NavigationMenu'
import SettingsMenu from './SettingsMenu'
import { Link } from 'react-router-dom'
import { lazyModal } from '../../../../utils/lazyModal'
import { isPastor } from '../../../../utils/access'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { Svg } from './NavIcons'
// 관리자 메뉴(아이콘 세트 포함 18KB)는 관리자에게만 — 엔트리에서 분리
const AdminMenu = lazyModal(() => import('./AdminMenu'))

// AdminMenu.tsx 의 OPEN_KEY 와 같은 값 — lazy 청크라 상수를 import 하지 않는다
const ADMIN_OPEN_KEY = 'adminMenu:open'

interface MobileMenuProps {
  isAdminUser: boolean
  isLoggedIn: boolean
  /** lg+ 여부 — NavigationMenu 가 PC 메가 메뉴·모바일 런처 중 한쪽만 그리게 한다 */
  isDesktop: boolean
  onLogout: () => void
}

/* PC 푸터 보조 링크 — 설정 행과 같은 크기·톤. 목회자·관리 도구는 본 메뉴보다 튀면 안 된다 */
const footerLinkClass = `
  flex items-center gap-2 px-3 py-2.5 rounded-xl
  text-[length:calc(15.5px*var(--mm,1))] font-medium text-gray-900 dark:text-white/85
  hover:bg-gray-100/60 dark:hover:bg-white/[0.04] transition-colors
`

const MobileMenu = ({ isAdminUser, isLoggedIn, isDesktop, onLogout }: MobileMenuProps) => {
  const { t } = useLanguage()
  const showPastor = isLoggedIn && isPastor()
  const [adminOpen, setAdminOpen] = useState(() => {
    try { return localStorage.getItem(ADMIN_OPEN_KEY) === '1' } catch { return false }
  })
  const toggleAdmin = () => {
    const next = !adminOpen
    setAdminOpen(next)
    try { localStorage.setItem(ADMIN_OPEN_KEY, next ? '1' : '0') } catch { /* 이번 세션 토글은 동작한다 */ }
  }

  // PC: 목회자 홈 · 관리 도구는 큰 카드 대신 푸터 한 줄의 링크로 — 관리 도구 목록은 그 아래에 펼친다
  const desktopExtra = isDesktop && (showPastor || isAdminUser) ? (
    <>
      <span aria-hidden className="mx-1 h-4 w-px bg-border-light dark:bg-border-dark" />
      {showPastor && (
        <Link to="/pastor" className={footerLinkClass}>
          <span className="material-icons-outlined text-[18px] text-ink-muted">dashboard</span>
          <span>{t('navPastorHome')}</span>
        </Link>
      )}
      {isAdminUser && (
        <button type="button" onClick={toggleAdmin} aria-expanded={adminOpen} className={footerLinkClass}>
          <Svg className="w-[18px] h-[18px] text-ink-muted">
            <path d="M12 3 5 6v5.4c0 4.3 2.9 8.1 7 9.6 4.1-1.5 7-5.3 7-9.6V6l-7-3Z" />
            <path d="m9.4 11.9 1.9 1.9 3.5-3.8" />
          </Svg>
          <span>{t('navMenuAdminTools')}</span>
          <Svg className={`w-4 h-4 text-ink-muted transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}>
            <path d="m6 9.5 6 6 6-6" />
          </Svg>
        </button>
      )}
    </>
  ) : null

  // PC 글씨는 헤더 '가' 단계를 따른다 — 배율(--mm)은 <html data-text-scale> 에서 상속(NewHeader.css `.mega-menu`)
  return (
    <div
      className="
        mega-menu absolute top-14 left-0 right-0 z-[60]
        bg-background-light dark:bg-background-dark
        border-b border-border-light dark:border-border-dark
        shadow-lg
        screen-cap-minus-header overflow-y-auto overflow-x-hidden overscroll-contain
        lg:top-[4.25rem] lg:left-1/2 lg:right-auto
        lg:rounded-2xl lg:border lg:border-black/[0.06] lg:dark:border-white/[0.08]
        lg:shadow-2xl lg:!max-h-[calc(100vh-6rem)]
        lg:origin-top lg:animate-pop-in
      "
    >
      {/* 모바일: 폰 폭 컬럼 / lg+: 메가 메뉴 카드 폭 전체 사용 */}
      <div className="max-w-md mx-auto pb-4 lg:max-w-none lg:pb-1">
        <NavigationMenu isDesktop={isDesktop} />

        <div className="border-t border-border-light dark:border-border-dark" />

        {isDesktop ? (
          <>
            <SettingsMenu isLoggedIn={isLoggedIn} onLogout={onLogout} extra={desktopExtra} />
            {isAdminUser && adminOpen && <AdminMenu panelOnly />}
          </>
        ) : (
          <>
            {/* 목회자 영역 — 목회자(is_pastor)에게만. 관리자 메뉴와 별개 권한이다 */}
            {showPastor && (
              <div className="px-4 pt-4">
                <Link
                  to="/pastor"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] hover:border-brand transition-colors"
                >
                  <span className="material-icons-outlined text-[22px] text-brand">dashboard</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold text-ink-strong">{t('navPastorHome')}</span>
                    <span className="block text-[11.5px] text-gray-500 dark:text-white/50">
                      {t('navPastorHomeDesc')}
                    </span>
                  </span>
                  <span className="material-icons-outlined text-[18px] text-gray-400 dark:text-white/40">chevron_right</span>
                </Link>
              </div>
            )}

            {/* 관리자 메뉴 */}
            {isAdminUser && <AdminMenu />}

            {/* 설정 메뉴 */}
            <SettingsMenu isLoggedIn={isLoggedIn} onLogout={onLogout} />
          </>
        )}
      </div>
    </div>
  )
}

export default MobileMenu
