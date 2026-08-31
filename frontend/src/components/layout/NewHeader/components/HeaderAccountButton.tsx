import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useMyIdentity } from '../../../../hooks/useProfile'
import { preloadRoute } from '../../../../utils/routePreload'

// PC(lg+) 우상단 계정 아바타 — 로그인 상태에서만 보인다.
// 같은 자리에 비로그인은 로그인/시작하기 CTA가 있으므로, 로그인하면 그 자리를
// "지금 누구로 들어와 있는지"를 보여주는 얼굴이 이어받는다(구글·인스타 문법).
// 누르면 곧장 내 프로필. 설정·로그아웃은 좌측 레일 하단 ⋮(전체 메뉴)가 이미 담당하므로
// 드롭다운을 또 만들지 않는다.
const HeaderAccountButton = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const { avatarUrl, displayName } = useMyIdentity()

  const isActive = pathname === '/profile'
  const initial = (displayName || '?').charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      onMouseEnter={() => void preloadRoute('/profile')}
      aria-label={displayName ? `${displayName} · ${t('profile')}` : t('profile')}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative hidden lg:flex h-9 w-9 items-center justify-center rounded-full transition-[box-shadow,transform] duration-150 active:scale-[0.94] ${
        isActive
          ? 'ring-2 ring-brand ring-offset-2 ring-offset-[var(--desktop-chrome)]'
          : 'ring-1 ring-black/[0.08] dark:ring-white/15 hover:ring-2 hover:ring-brand hover:ring-offset-2 hover:ring-offset-[var(--desktop-chrome)]'
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

      {/* 호버 툴팁 — 레일 툴팁과 같은 반전 토큰 */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-[calc(100%_+_8px)] z-50 whitespace-nowrap rounded-lg bg-[var(--text-strong)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--surface-container)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {displayName || t('profile')}
      </span>
    </button>
  )
}

export default HeaderAccountButton
