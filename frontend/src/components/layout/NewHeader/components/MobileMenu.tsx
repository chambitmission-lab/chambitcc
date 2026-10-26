import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import NavigationMenu from './NavigationMenu'
import SettingsMenu from './SettingsMenu'
import { Link } from 'react-router-dom'
import { lazyModal } from '../../../../utils/lazyModal'
import { isPastor } from '../../../../utils/access'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { Svg } from './NavIcons'
import { safeStorage } from '../../../../utils/safeStorage'
import { adminKeys } from '../../../../hooks/queryKeys'
// 관리자 메뉴(아이콘 세트 포함 18KB)는 관리자에게만 — 엔트리에서 분리
const AdminMenu = lazyModal(() => import('./AdminMenu'))

// AdminMenu.tsx 의 OPEN_KEY 와 같은 값 — lazy 청크라 상수를 import 하지 않는다.
// PC 에선 '마지막에 관리 탭을 보고 닫았는가' — 다시 열면 그 탭으로 돌아온다
const ADMIN_OPEN_KEY = 'adminMenu:open'

type MenuMode = 'member' | 'admin'

// 할 일 배지 — AdminMenu 패널과 같은 쿼리 키를 나눠 쓴다. api/admin 은 관리자 청크에만 두려고 동적 import
const fetchMenuStatus = () => import('../../../../api/admin').then(m => m.fetchAdminMenuStatus())

/* PC 메뉴/관리 탭 — 검색창 왼쪽에 붙는 세그먼트. 성도 메뉴와 관리 도구를 한 화면에 쌓지 않고
   한 번에 한쪽만 보여 준다. 관리 탭 숫자 = 할 일 수(급한 게 있으면 amber) */
const ModeSwitch = ({
  mode, onChange, todo, urgent, onWarmAdmin,
}: { mode: MenuMode; onChange: (m: MenuMode) => void; todo: number; urgent: boolean; onWarmAdmin: () => void }) => {
  const { t } = useLanguage()
  const tab = (m: MenuMode, shortcut: string, icon: ReactNode, label: string, extra?: ReactNode) => {
    const on = mode === m
    return (
      <button
        type="button"
        role="tab"
        aria-selected={on}
        title={shortcut}
        onClick={() => onChange(m)}
        onPointerEnter={m === 'admin' ? onWarmAdmin : undefined}
        className={`flex items-center gap-1.5 rounded-[10px] px-3.5 text-[length:calc(15px*var(--mm,1))] font-semibold transition-colors duration-150 ${
          on
            ? 'bg-background-light dark:bg-card-dark text-ink-strong shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
            : 'text-ink-muted hover:text-ink-strong'
        }`}
      >
        <span className={on ? 'text-brand' : ''}>{icon}</span>
        {label}
        {extra}
      </button>
    )
  }
  const iconClass = 'w-[calc(17px*var(--mm,1))] h-[calc(17px*var(--mm,1))]'
  return (
    <div
      role="tablist"
      aria-label={t('navMenuModeAria')}
      className="shrink-0 inline-flex gap-0.5 rounded-xl p-1 h-[calc(46px*var(--mm,1))] bg-surface-high"
    >
      {tab('member', 'Alt+1', (
        <Svg className={iconClass}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
        </Svg>
      ), t('navMenuModeMember'))}
      {tab('admin', 'Alt+2', (
        <Svg className={iconClass}>
          <path d="M12 3 5 6v5.4c0 4.3 2.9 8.1 7 9.6 4.1-1.5 7-5.3 7-9.6V6l-7-3Z" />
          <path d="m9.4 11.9 1.9 1.9 3.5-3.8" />
        </Svg>
      ), t('navMenuModeAdmin'), todo > 0 && (
        <span
          aria-label={`${t('adminTodoSummary')} ${todo}`}
          className={`min-w-[1.4em] rounded-full px-1.5 text-center text-[length:calc(11.5px*var(--mm,1))] font-bold leading-[1.6] text-white ${
            urgent ? 'bg-[var(--amber)]' : 'bg-brand'
          }`}
        >
          {todo}
        </span>
      ))}
    </div>
  )
}

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
  const desktopAdmin = isDesktop && isAdminUser
  const [mode, setMode] = useState<MenuMode>(() => safeStorage.get(ADMIN_OPEN_KEY) === '1' ? 'admin' : 'member')
  const adminMode = desktopAdmin && mode === 'admin'
  const switchMode = (next: MenuMode) => {
    setMode(next)
    safeStorage.set(ADMIN_OPEN_KEY, next === 'admin' ? '1' : '0') // 저장 실패해도 이번 세션 전환은 동작한다
  }

  // 배지는 메뉴를 열 때마다 새로 — 주보를 올리고 돌아오면 숫자가 바로 줄어야 한다 (persist 제외, main.tsx)
  const { data: status } = useQuery({
    queryKey: adminKeys.menuStatus(),
    queryFn: fetchMenuStatus,
    enabled: desktopAdmin,
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
  const badges = Object.values(status?.badges ?? {})

  useEffect(() => {
    if (!desktopAdmin) return
    // 관리 탭을 누르는 순간 빈 프레임이 없도록 청크를 미리 받는다
    void AdminMenu.preload()
    // Alt+1 메뉴 · Alt+2 관리 — 검색창에 포커스가 있어도 동작 (Alt 조합은 글자 입력이 아니다)
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const next: MenuMode | null = e.code === 'Digit1' ? 'member' : e.code === 'Digit2' ? 'admin' : null
      if (!next) return
      e.preventDefault()
      setMode(next)
      safeStorage.set(ADMIN_OPEN_KEY, next === 'admin' ? '1' : '0')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [desktopAdmin])

  const modeSwitch = desktopAdmin ? (
    <ModeSwitch
      mode={mode}
      onChange={switchMode}
      todo={badges.length}
      urgent={badges.some(b => b.tone === 'urgent')}
      onWarmAdmin={() => void AdminMenu.preload()}
    />
  ) : undefined

  // PC: 목회자 홈은 큰 카드 대신 푸터 한 줄의 링크로. 관리 도구는 맨 위 '관리' 탭으로 옮겼다
  const desktopExtra = isDesktop && showPastor ? (
    <>
      <span aria-hidden className="mx-1 h-4 w-px bg-border-light dark:bg-border-dark" />
      <Link to="/pastor" className={footerLinkClass}>
        <span className="material-icons-outlined text-[18px] text-ink-muted">dashboard</span>
        <span>{t('navPastorHome')}</span>
      </Link>
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
        {/* 관리자 PC: 메뉴/관리 탭 중 한쪽만 그린다 — 두 화면을 위아래로 쌓으면 산만했다 */}
        {adminMode ? (
          <AdminMenu panelOnly leading={modeSwitch} />
        ) : (
          <NavigationMenu isDesktop={isDesktop} searchLeading={modeSwitch} />
        )}

        <div className="border-t border-border-light dark:border-border-dark" />

        {isDesktop ? (
          <SettingsMenu isLoggedIn={isLoggedIn} onLogout={onLogout} extra={desktopExtra} />
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
