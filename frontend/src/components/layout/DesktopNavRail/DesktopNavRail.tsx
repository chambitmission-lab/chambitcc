import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLanguage } from '../../../contexts/LanguageContext'
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
  if (HIDDEN_PATHS.includes(pathname)) return false
  // 랜딩(비로그인 홈·/welcome 미리보기)은 제품 소개 화면 — 앱 크롬 없이 전체 폭을 쓴다.
  // 로그인 판정은 App.tsx의 홈 분기와 같은 기준(localStorage 토큰)을 쓴다.
  if (pathname === '/welcome') return false
  if (pathname === '/' && !localStorage.getItem('access_token')) return false
  return true
}

const RailSpinner = () => (
  <span className="w-[22px] h-[22px] rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
)

// 나누기 다이얼 인사 — 모바일 홈 FAB(BottomNavigation)과 같은 문구 로테이션
const DIAL_GREETING_KEYS = [
  'railShareGreeting1',
  'railShareGreeting2',
  'railShareGreeting3',
  'railShareGreeting4',
] as const

// 아이콘만 보이는 폭(lg~xl 미만)에서 "이게 무슨 메뉴인지"를 알려주는 호버 툴팁.
// 색은 반전 토큰(--text-strong 배경 / --surface-container 글자)이라 라이트·다크 모두 대응.
//   right: 내비 항목 — 라벨이 나오는 xl부터는 숨긴다
//   top  : 라벨이 아예 없는 유틸 버튼 — 모든 폭에서 보인다
const RailTip = ({
  label,
  placement = 'right',
}: {
  label: string
  placement?: 'right' | 'top'
}) => (
  <span
    role="tooltip"
    className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[var(--text-strong)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--surface-container)] shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
      placement === 'right'
        ? 'left-[calc(100%_+_10px)] top-1/2 -translate-y-1/2 xl:hidden'
        : 'bottom-[calc(100%_+_8px)] left-1/2 -translate-x-1/2'
    }`}
  >
    {label}
  </span>
)

const DesktopNavRail = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { requireAuth, requireAuthWithRedirect, isLoggedIn } = useAuth()
  // lazy 청크를 받는 중인 목적지 경로 — 해당 아이콘 자리에 스피너
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  // 나누기 스피드 다이얼 — 모바일 홈 FAB과 같은 3액션(기도·감사·말씀 카드)을 팝오버로
  const [dialOpen, setDialOpen] = useState(false)
  const [dialNonce, setDialNonce] = useState(0)
  const visible = useDesktopRailVisible()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

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
  const isGroupsActive = pathname.startsWith('/groups')
  const isGrowthActive = pathname === '/growth'
  const isProfileActive = pathname === '/profile'

  // 하단 도크와 같은 스트로크 1.8 아이콘 언어 유지. 활성 항목만 굵게 (인스타 문법)
  const itemClass = (active: boolean) =>
    `group relative flex items-center justify-center xl:justify-start gap-3.5 h-12 rounded-xl px-0 xl:px-3 active:scale-[0.97] transition-[color,background-color,transform] duration-150 ${
      active
        ? 'text-brand bg-[var(--brand-soft)]'
        : 'text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)]'
    }`
  const ActiveBar = () => (
    <span
      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-brand"
      aria-hidden
    />
  )

  const labelClass = (active: boolean) =>
    `hidden xl:inline text-[15px] whitespace-nowrap ${active ? 'font-bold' : 'font-semibold'}`

  return (
    <aside
      // 라이트: 흰 레일 vs 회색 캔버스(--app-canvas)의 톤 차이가 이미 구획을 세우므로
      // 세로 헤어라인을 뺀다 — 헤더(흰 크롬)와 이어져 좌상단이 하나의 ㄱ자 흰 면으로 읽힌다.
      // 다크는 레일·캔버스가 같은 색이라 헤어라인이 유일한 구분선이므로 유지.
      className="hidden lg:flex fixed left-0 top-14 bottom-0 z-40 w-[76px] xl:w-[248px] flex-col bg-white dark:bg-background-dark border-r-0 dark:border-r dark:border-white/[0.06] px-3 xl:px-4 pt-6 pb-5"
      aria-label={t('railAria')}
    >
      <nav className="flex flex-col gap-1">
        {/* 홈 — 홈에서 다시 누르면 최상단 스크롤 */}
        <button
          onClick={handleHomeClick}
          aria-label={t('home')}
          aria-current={isHomeActive ? 'page' : undefined}
          className={itemClass(isHomeActive)}
        >
          {isHomeActive && <ActiveBar />}
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
          <span className={labelClass(isHomeActive)}>{t('home')}</span>
          <RailTip label={t('home')} />
        </button>

        {/* 성경 */}
        <button
          onClick={() => void goLazy('/bible')}
          onMouseEnter={() => void preloadRoute('/bible')}
          aria-label={t('bible')}
          aria-current={isBibleActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible'}
          className={itemClass(isBibleActive)}
        >
          {isBibleActive && <ActiveBar />}
          {pendingPath === '/bible' ? (
            <RailSpinner />
          ) : (
            <span className="material-icons-outlined text-[26px] shrink-0">menu_book</span>
          )}
          <span className={labelClass(isBibleActive)}>{t('bible')}</span>
          <RailTip label={t('bible')} />
        </button>

        {/* 집중 기도 — 하단 도크와 동일한 스톱워치 아이콘 */}
        <button
          onClick={() => void goLazy('/prayer-focus')}
          onMouseEnter={() => void preloadRoute('/prayer-focus')}
          aria-label={t('railPrayerFocus')}
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
          <span className={labelClass(false)}>{t('railPrayerFocus')}</span>
          <RailTip label={t('railPrayerFocus')} />
        </button>

        {/* 말씀 사진 카드 만들기 */}
        <button
          onClick={() => void goLazy('/bible/photo-verse')}
          onMouseEnter={() => void preloadRoute('/bible/photo-verse')}
          aria-label={t('railShareVerseCard')}
          aria-current={isVerseCardActive ? 'page' : undefined}
          aria-busy={pendingPath === '/bible/photo-verse'}
          className={itemClass(isVerseCardActive)}
        >
          {isVerseCardActive && <ActiveBar />}
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
          <span className={labelClass(isVerseCardActive)}>{t('railVerseCard')}</span>
          <RailTip label={t('railVerseCard')} />
        </button>

        {/* 모임 — 소그룹 체크인·릴레이·기도 나눔 */}
        <button
          onClick={() => void goLazy('/groups')}
          onMouseEnter={() => void preloadRoute('/groups')}
          aria-label={t('railGroups')}
          aria-current={isGroupsActive ? 'page' : undefined}
          aria-busy={pendingPath === '/groups'}
          className={itemClass(isGroupsActive)}
        >
          {isGroupsActive && <ActiveBar />}
          {pendingPath === '/groups' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isGroupsActive ? 2.2 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="8.5" r="3.2" />
              <path d="M3.2 19.5v-.5a5.8 5.8 0 0 1 11.6 0v.5" />
              <path d="M15.4 5.9a3.2 3.2 0 1 1 .9 6.3" />
              <path d="M17 13.6a5.8 5.8 0 0 1 3.8 5.4v.5" />
            </svg>
          )}
          <span className={labelClass(isGroupsActive)}>{t('railGroups')}</span>
          <RailTip label={t('railGroups')} />
        </button>

        {/* 신앙 여정 — 스트릭·타임라인·통계 (성장 페이지) */}
        <button
          onClick={() => void goLazy('/growth')}
          onMouseEnter={() => void preloadRoute('/growth')}
          aria-label={t('railGrowth')}
          aria-current={isGrowthActive ? 'page' : undefined}
          aria-busy={pendingPath === '/growth'}
          className={itemClass(isGrowthActive)}
        >
          {isGrowthActive && <ActiveBar />}
          {pendingPath === '/growth' ? (
            <RailSpinner />
          ) : (
            <svg
              className="w-[26px] h-[26px] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isGrowthActive ? 2.2 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21.5v-8.5" />
              <path d="M12 13c0-3.6 2.7-6.1 6.7-6.1-.2 3.9-2.9 6.1-6.7 6.1Z" />
              <path d="M12 10.3c0-2.9-2.2-4.9-5.4-4.9.2 3.1 2.3 4.9 5.4 4.9" />
            </svg>
          )}
          <span className={labelClass(isGrowthActive)}>{t('railGrowth')}</span>
          <RailTip label={t('railGrowth')} />
        </button>

        {/* 프로필 */}
        <button
          onClick={handleProfileClick}
          onMouseEnter={() => void preloadRoute('/profile')}
          aria-label={t('profile')}
          aria-current={isProfileActive ? 'page' : undefined}
          aria-busy={pendingPath === '/profile'}
          className={itemClass(isProfileActive)}
        >
          {isProfileActive && <ActiveBar />}
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
          <span className={labelClass(isProfileActive)}>{t('profile')}</span>
          <RailTip label={t('profile')} />
        </button>
      </nav>

      {/* 나눔 액션 — X/인스타 데스크톱 문법의 단일 주 CTA. 누르면 모바일 홈 FAB과
          같은 3액션 스피드 다이얼(기도·감사·말씀 카드)이 팝오버로 열린다.
          두 버튼을 세로로 쌓던 이전 형태보다 위계가 분명하고 확장에도 유리하다 */}
      <div className="mt-6 relative flex flex-col items-center xl:items-stretch">
        {dialOpen && (
          <>
            {/* 바깥 클릭으로 닫기 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDialOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              aria-label={t('railShareMenuAria')}
              className="absolute z-50 bottom-[calc(100%_+_10px)] left-0 w-[236px] xl:right-0 xl:w-auto feed-card rounded-2xl p-2 shadow-xl origin-bottom-left xl:origin-bottom"
              style={{ animation: 'scale-in 0.16s ease-out both' }}
            >
              {/* 모바일 FAB과 같은 다정한 인사 — 열 때마다 로테이션 */}
              <p className="px-2.5 pt-1.5 pb-1 text-[11.5px] text-ink-muted">
                {t(DIAL_GREETING_KEYS[dialNonce % DIAL_GREETING_KEYS.length])}
              </p>
              {[
                {
                  key: 'prayer',
                  emoji: '🙏',
                  label: t('railSharePrayer'),
                  tint: 'bg-[var(--brand-soft-strong)]',
                  onClick: handleComposeClick,
                },
                {
                  key: 'thanks',
                  emoji: '🌼',
                  label: t('railShareThanks'),
                  tint: 'bg-[rgba(236,95,143,0.12)]',
                  onClick: handleThanksClick,
                },
                {
                  key: 'verse-card',
                  emoji: '💌',
                  label: t('railShareVerseCard'),
                  tint: 'bg-[rgba(234,179,8,0.14)]',
                  onClick: () => void goLazy('/bible/photo-verse'),
                },
              ].map((action, i) => (
                <button
                  key={action.key}
                  role="menuitem"
                  onClick={() => {
                    setDialOpen(false)
                    action.onClick()
                  }}
                  onMouseEnter={
                    action.key === 'verse-card'
                      ? () => void preloadRoute('/bible/photo-verse')
                      : undefined
                  }
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--brand-soft)] active:scale-[0.98] transition-[background-color,transform] duration-150"
                  style={{ animation: 'fade-in 0.22s ease-out both', animationDelay: `${i * 45}ms` }}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[17px] shrink-0 ${action.tint}`}
                    aria-hidden
                  >
                    {action.emoji}
                  </span>
                  <span className="text-[13.5px] font-semibold text-ink-strong whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => {
            setDialOpen((open) => {
              if (!open) setDialNonce((n) => n + 1)
              return !open
            })
          }}
          aria-label={t('railShare')}
          aria-haspopup="menu"
          aria-expanded={dialOpen}
          className="group relative brand-gradient w-12 h-12 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.96] transition-[box-shadow,transform] duration-150"
        >
          {/* 도크 FAB와 같은 스파클 얼굴 — 열리면 살짝 회전해 "펼쳐짐"을 알린다 */}
          <svg
            className={`w-6 h-6 shrink-0 transition-transform duration-200 ${dialOpen ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
            <path d="M17.8 4.6 C18.08 6.06 18.94 6.92 20.4 7.2 C18.94 7.48 18.08 8.34 17.8 9.8 C17.52 8.34 16.66 7.48 15.2 7.2 C16.66 6.92 17.52 6.06 17.8 4.6 Z" />
          </svg>
          <span className="hidden xl:inline text-[14.5px] font-bold whitespace-nowrap">
            {t('railShare')}
          </span>
          {!dialOpen && <RailTip label={t('railShare')} />}
        </button>
      </div>

      {/* 하단 유틸리티 — 헤더 우상단 액션(테마·알림·전체 메뉴)의 PC 대응물.
          모달/메뉴 패널은 NewHeader가 소유하므로 커스텀 이벤트로 열기만 요청한다 */}
      <div className="mt-auto pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col xl:flex-row items-center xl:justify-around gap-1 xl:gap-0">
        <button
          onClick={toggleTheme}
          aria-label={t('themeToggleAria')}
          className="group relative w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
          <RailTip
            label={theme === 'dark' ? t('railThemeToLight') : t('railThemeToDark')}
            placement="top"
          />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('chambit:open-notifications'))}
          aria-label={t('notificationsAria')}
          className="group relative w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-[9px] right-[9px] w-2 h-2 bg-brand rounded-full ring-2 ring-background-light dark:ring-background-dark" />
          )}
          <RailTip label={t('notificationsAria')} placement="top" />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('chambit:open-menu'))}
          aria-label={t('allMenu')}
          className="group relative w-11 h-11 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/75 hover:text-brand hover:bg-[var(--brand-soft)] active:scale-[0.94] transition-[color,background-color,transform] duration-150"
        >
          <span className="material-icons-outlined text-2xl leading-none inline-flex items-center justify-center w-6 h-6 overflow-hidden">
            more_vert
          </span>
          <RailTip label={t('allMenu')} placement="top" />
        </button>
      </div>
    </aside>
  )
}

export default DesktopNavRail
