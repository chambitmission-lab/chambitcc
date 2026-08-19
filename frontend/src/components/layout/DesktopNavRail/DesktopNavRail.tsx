import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../contexts/ThemeContext'
import { useNotifications } from '../../../hooks/useNotifications'
import { preloadRoute, isRoutePreloaded } from '../../../utils/routePreload'

// PC 전용 좌측 내비 레일 (lg+) — 모바일 하단 도크(BottomNavigation)의 데스크톱 대응물.
// 홈 전용 컴포넌트였다가 전역 레이아웃으로 승격: 모든 페이지에서 App.tsx가 렌더링한다.
// lg에선 아이콘만, xl부터 라벨이 함께 보인다 (인스타그램 데스크톱 문법).
// 자주 가는 핵심 목적지만 담고, 예배·설교·일정 등 안내 페이지는 헤더 인라인 메뉴(DesktopNav)가 담당한다.

// 몰입형·인증 화면에선 레일을 숨긴다 (본문 오프셋도 함께 빠져야 하므로 훅을 공유)
const HIDDEN_PATHS = ['/login', '/register', '/prayer-focus', '/prayer-topics/screen']

export const useDesktopRailVisible = (): boolean => {
  const { pathname } = useLocation()
  return !HIDDEN_PATHS.includes(pathname)
}

const RailSpinner = () => (
  <span className="w-[22px] h-[22px] rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
)

const DesktopNavRail = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect, isLoggedIn } = useAuth()
  // lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const visible = useDesktopRailVisible()
  const { theme, toggleTheme } = useTheme()

  // 알림 뱃지 — NewHeader와 같은 쿼리 키라 React Query가 요청을 공유한다
  const { data: notiData } = useNotifications()
  const unreadCount = notiData?.pages[0]?.unread_count ?? 0

  // 청크가 아직 안 왔으면 다운로드를 기다렸다가 이동한다 (startTransition 중엔
  // Suspense fallback이 뜨지 않아 "안 눌린 것처럼" 보이는 문제 방지).
  const goLazy = async (path: string) => {
    if (pathname === path) return
    if (isRoutePreloaded(path)) {
      navigate(path)
      return
    }
    setPendingPath(path)
    try {
      await preloadRoute(path)
    } finally {
      setPendingPath(null)
    }
    navigate(path)
  }

  if (!visible) return null

  const handleHomeClick = () => {
    if (pathname !== '/') {
      navigate('/')
      return
    }
    // 이미 홈이면 최상단으로 (루트 오버플로우 구조상 가능한 스크롤 요소 모두)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const root = document.getElementById('root')
    if (root) root.scrollTop = 0
  }

  const handleProfileClick = () => {
    // 비로그인이면 기존 경로 그대로 (토스트 후 /login)
    if (!isLoggedIn()) {
      requireAuthWithRedirect('/profile')
      return
    }
    void goLazy('/profile')
  }

  // 나눔 액션은 홈의 컴포저가 담당 — 어느 페이지에서든 홈으로 이동하며 state로 열어달라고 전달
  const handleComposeClick = () => {
    requireAuth(() =>
      navigate('/', { state: { openComposer: true }, replace: pathname === '/' }),
    )
  }
  const handleThanksClick = () => {
    requireAuth(() =>
      navigate('/', { state: { openThanks: true }, replace: pathname === '/' }),
    )
  }

  const isHomeActive = pathname === '/'
  const isVerseCardActive = pathname === '/bible/photo-verse'
  const isBibleActive = pathname.startsWith('/bible') && !isVerseCardActive
  const isProfileActive = pathname === '/profile'

  // 하단 도크와 같은 스트로크 1.8 아이콘 언어 유지. 활성 항목만 굵게 (인스타 문법)
  const itemClass = (active: boolean) =>
    `flex items-center justify-center xl:justify-start gap-3.5 h-12 rounded-xl px-0 xl:px-3 active:scale-[0.97] transition-[color,background-color,transform] duration-150 ${
      active
        ? 'text-ink-strong'
        : 'text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)]'
    }`
  const labelClass = (active: boolean) =>
    `hidden xl:inline text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-14 bottom-0 z-40 w-[76px] xl:w-[248px] flex-col bg-background-light dark:bg-background-dark border-r border-black/[0.05] dark:border-white/[0.06] px-3 xl:px-4 pt-6 pb-5"
      aria-label="주요 메뉴"
    >
      <nav className="flex flex-col gap-1">
        {/* 홈 — 홈에서 다시 누르면 최상단 스크롤 */}
        <button
          onClick={handleHomeClick}
          aria-label="홈"
          aria-current={isHomeActive ? 'page' : undefined}
          className={itemClass(isHomeActive)}
        >
          <svg
            className="w-[26px] h-[26px] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={isHomeActive ? 2.2 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
          </svg>
          <span className={labelClass(isHomeActive)}>홈</span>
        </button>

        {/* 성경 */}
        <button
          onClick={() => void goLazy('/bible')}
          onMouseEnter={() => void preloadRoute('/bible')}
          aria-label="성경"
          aria-current={isBibleActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible'}
          className={itemClass(isBibleActive)}
        >
          {pendingPath === '/bible' ? (
            <RailSpinner />
          ) : (
            <span className="material-icons-outlined text-[26px] shrink-0">menu_book</span>
          )}
          <span className={labelClass(isBibleActive)}>성경</span>
        </button>

        {/* 집중 기도 — 하단 도크와 동일한 스톱워치 아이콘 */}
        <button
          onClick={() => void goLazy('/prayer-focus')}
          onMouseEnter={() => void preloadRoute('/prayer-focus')}
          aria-label="집중 기도"
          aria-busy={pendingPath === '/prayer-focus'}
          className={itemClass(false)}
        >
          {pendingPath === '/prayer-focus' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 2.5h4" />
              <circle cx="12" cy="14" r="7.5" />
              <path d="M12 14l2.7-2.7" />
            </svg>
          )}
          <span className={labelClass(false)}>집중 기도</span>
        </button>

        {/* 말씀 사진 카드 만들기 */}
        <button
          onClick={() => void goLazy('/bible/photo-verse')}
          onMouseEnter={() => void preloadRoute('/bible/photo-verse')}
          aria-label="말씀 카드 만들기"
          aria-current={isVerseCardActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible/photo-verse'}
          className={itemClass(isVerseCardActive)}
        >
          {pendingPath === '/bible/photo-verse' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M4 17.5l4.8-4.8 3.2 3.2 3.5-3.5 4.5 4.5" />
            </svg>
          )}
          <span className={labelClass(isVerseCardActive)}>말씀 카드</span>
        </button>

        {/* 프로필 */}
        <button
          onClick={handleProfileClick}
          onMouseEnter={() => void preloadRoute('/profile')}
          aria-label="프로필"
          aria-current={isProfileActive ? 'page' : undefined}
          aria-busy={pendingPath === '/profile'}
          className={itemClass(isProfileActive)}
        >
          {pendingPath === '/profile' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          )}
          <span className={labelClass(isProfileActive)}>프로필</span>
        </button>
      </nav>

      {/* 나눔 액션 — 도크 FAB 다이얼을 펼친 형태. 주 액션(기도)만 브랜드 채움 */}
      <div className="mt-6 flex flex-col gap-2 items-center xl:items-stretch">
        <button
          onClick={handleComposeClick}
          aria-label="기도제목 나누기"
          className="brand-gradient w-12 h-12 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.96] transition-[box-shadow,transform] duration-150"
        >
          {/* 도크 FAB와 같은 스파클 얼굴 */}
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
            <path d="M17.8 4.6 C18.08 6.06 18.94 6.92 20.4 7.2 C18.94 7.48 18.08 8.34 17.8 9.8 C17.52 8.34 16.66 7.48 15.2 7.2 C16.66 6.92 17.52 6.06 17.8 4.6 Z" />
          </svg>
          <span className="hidden xl:inline text-[14.5px] font-bold whitespace-nowrap">
            기도제목 나누기
          </span>
        </button>

        <button
          onClick={handleThanksClick}
          aria-label="감사 한 줄 남기기"
          className="w-12 h-12 xl:w-auto xl:h-auto xl:px-4 xl:py-2.5 rounded-full flex items-center justify-center gap-2 border border-[var(--card-border)] text-gray-600 dark:text-white/75 hover:text-brand hover:border-brand hover:bg-[var(--brand-soft)] active:scale-[0.96] transition-[color,background-color,border-color,transform] duration-150"
        >
          <span className="text-[17px] leading-none" aria-hidden>
            🌼
          </span>
          <span className="hidden xl:inline text-[13.5px] font-bold whitespace-nowrap">
            감사 한 줄
          </span>
        </button>
      </div>

      {/* 하단 유틸리티 — 헤더 우상단 액션(테마·알림·전체 메뉴)의 PC 대응물.
          모달/메뉴 패널은 NewHeader가 소유하므로 커스텀 이벤트로 열기만 요청한다 */}
      <div className="mt-auto pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col xl:flex-row items-center xl:justify-around gap-1 xl:gap-0">
        <button
          onClick={toggleTheme}
          aria-label="테마 전환"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('chambit:open-notifications'))}
          aria-label="알림"
          className="relative w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-[9px] right-[9px] w-2 h-2 bg-brand rounded-full ring-2 ring-background-light dark:ring-background-dark" />
          )}
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('chambit:open-menu'))}
          aria-label="전체 메뉴"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            more_vert
          </span>
        </button>
      </div>
    </aside>
  )
}

export default DesktopNavRail
