import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useMyIdentity } from '../../../../hooks/useProfile'
import { preloadRoute } from '../../../../utils/routePreload'

interface HeaderAccountClusterProps {
  unreadCount: number
  onNotificationClick: () => void
}

// 호버 툴팁 — 레일 툴팁(RailTip)과 같은 반전 토큰. 헤더 아래로 떨어지므로 top 배치.
const Tip = ({ label, align = 'center' }: { label: string; align?: 'center' | 'right' }) => (
  <span
    role="tooltip"
    className={`pointer-events-none absolute top-[calc(100%_+_8px)] z-50 whitespace-nowrap rounded-lg bg-[var(--text-strong)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--surface-container)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
      align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
    }`}
  >
    {label}
  </span>
)

// PC(lg+) 우상단 계정 클러스터 — 로그인 상태에서만 보인다.
// 비로그인 CTA(로그인/시작하기)가 있던 그 자리를 로그인하면 알림 + 얼굴이 이어받는다.
// 알림을 레일 하단에서 여기로 올린 이유: 알림은 "내 것"이라 계정 옆이 제자리고,
// 시선이 가장 먼저 닿는 우상단이어야 뱃지가 제 역할을 한다(구글·인스타 문법).
// 테마 토글과 ⋮(전체 메뉴)는 사이트 설정이라 레일 하단에 그대로 둔다.
const HeaderAccountCluster = ({ unreadCount, onNotificationClick }: HeaderAccountClusterProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const { avatarUrl, displayName } = useMyIdentity()

  const isActive = pathname === '/profile'
  const initial = (displayName || '?').charAt(0).toUpperCase()

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      {/* 알림 */}
      <button
        type="button"
        onClick={onNotificationClick}
        aria-label={t('notificationsAria')}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-[var(--brand-soft)] hover:text-brand active:scale-[0.94] transition-[color,background-color,transform] duration-150 dark:text-white/75"
      >
        <span className="material-icons-outlined inline-flex h-6 w-6 items-center justify-center overflow-hidden text-2xl leading-none">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full bg-brand ring-2 ring-[var(--desktop-chrome)]" />
        )}
        <Tip label={t('notificationsAria')} />
      </button>

      {/* 계정 — 지금 누구로 들어와 있는지. 누르면 곧장 내 프로필.
          설정·로그아웃은 레일 하단 ⋮(전체 메뉴)가 이미 담당하므로 드롭다운은 만들지 않는다 */}
      <button
        type="button"
        onClick={() => navigate('/profile')}
        onMouseEnter={() => void preloadRoute('/profile')}
        aria-label={displayName ? `${displayName} · ${t('profile')}` : t('profile')}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative ml-0.5 flex h-9 w-9 items-center justify-center rounded-full transition-[box-shadow,transform] duration-150 active:scale-[0.94] ${
          isActive
            ? 'ring-2 ring-brand ring-offset-2 ring-offset-[var(--desktop-chrome)]'
            : 'ring-1 ring-black/[0.08] hover:ring-2 hover:ring-brand hover:ring-offset-2 hover:ring-offset-[var(--desktop-chrome)] dark:ring-white/15'
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-9 w-9 rounded-full bg-gray-100 object-cover dark:bg-card-dark"
          />
        ) : (
          // 사진 미등록 — 이름 첫 글자 (프로필 화면의 이니셜 아바타와 같은 규칙)
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[14px] font-bold text-gray-500 dark:bg-card-dark dark:text-white/80">
            {initial}
          </span>
        )}
        <Tip label={displayName || t('profile')} align="right" />
      </button>
    </div>
  )
}

export default HeaderAccountCluster
