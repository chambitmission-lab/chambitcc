import NavigationMenu from './NavigationMenu'
import SettingsMenu from './SettingsMenu'
import { Link } from 'react-router-dom'
import { lazyModal } from '../../../../utils/lazyModal'
import { isPastor } from '../../../../utils/access'
// 관리자 메뉴(아이콘 세트 포함 18KB)는 관리자에게만 — 엔트리에서 분리
const AdminMenu = lazyModal(() => import('./AdminMenu'))

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

        {/* 목회자 영역 — 목회자(is_pastor)에게만. 관리자 메뉴와 별개 권한이다 */}
        {isLoggedIn && isPastor() && (
          <div className="px-4 pt-4 lg:px-6">
            <Link
              to="/pastor"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] hover:border-brand transition-colors"
            >
              <span className="material-icons-outlined text-[22px] text-brand">dashboard</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-bold text-ink-strong">목회자 홈</span>
                <span className="block text-[11.5px] text-gray-500 dark:text-white/50">
                  맡겨진 기도 · 돌봄이 필요한 성도 · 이번 주 교회
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
      </div>
    </div>
  )
}

export default MobileMenu
