import NavigationMenu from './NavigationMenu'
import SettingsMenu from './SettingsMenu'
import AdminMenu from './AdminMenu'

interface MobileMenuProps {
  isAdminUser: boolean
  isLoggedIn: boolean
  onLogout: () => void
}

const MobileMenu = ({ isAdminUser, isLoggedIn, onLogout }: MobileMenuProps) => {
  return (
    <div
      className="
        absolute top-14 left-0 right-0 z-[60]
        bg-background-light dark:bg-background-dark
        border-b border-border-light dark:border-border-dark
        shadow-lg
        screen-cap-minus-header overflow-y-auto overscroll-contain
        lg:top-[4.25rem] lg:left-1/2 lg:right-auto lg:-ml-[470px]
        lg:w-[940px]
        lg:rounded-2xl lg:border lg:border-black/[0.06] lg:dark:border-white/[0.08]
        lg:shadow-2xl lg:!max-h-[calc(100vh-6rem)]
        lg:origin-top lg:animate-pop-in
      "
    >
      {/* 모바일: 폰 폭 컬럼 / lg+: 메가 메뉴 카드 폭 전체 사용 */}
      <div className="max-w-md mx-auto pb-4 lg:max-w-none lg:pb-5">
        {/* 2열 그리드 메뉴 */}
        <NavigationMenu />

        <div className="border-t border-border-light dark:border-border-dark" />

        {/* 관리자 메뉴 */}
        {isAdminUser && <AdminMenu />}

        {/* 설정 메뉴 */}
        <SettingsMenu isLoggedIn={isLoggedIn} onLogout={onLogout} />
      </div>
    </div>
  )
}

export default MobileMenu
