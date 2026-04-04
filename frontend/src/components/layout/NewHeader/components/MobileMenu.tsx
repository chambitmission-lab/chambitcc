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
    <div className="absolute top-14 left-0 right-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark shadow-lg overflow-hidden z-[60]">
      <div className="max-w-md mx-auto">
        {/* 가로 스크롤 메뉴 */}
        <NavigationMenu />
        
        <div className="border-t border-border-light dark:border-border-dark"></div>
        
        {/* 관리자 메뉴 */}
        {isAdminUser && <AdminMenu />}
        
        {/* 설정 메뉴 */}
        <SettingsMenu isLoggedIn={isLoggedIn} onLogout={onLogout} />
      </div>
    </div>
  )
}

export default MobileMenu
