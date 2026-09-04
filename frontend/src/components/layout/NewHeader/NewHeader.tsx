import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useNotifications, useNotificationStream } from '../../../hooks/useNotifications'
import { preloadMenuRoutes } from '../../../utils/routePreload'
// 알림 모달은 종을 눌러야 열린다 — lazy 로 분리해 첫 로드에서 제외
const NotificationModal = lazy(() => import('../../common/NotificationModal'))
import Logo from './components/Logo'
// PC(lg+) 전용 메뉴 — framer-motion(layoutId 투영 엔진 ~120KB)을 끌고 오므로
// 엔트리 청크에서 떼어 lg 이상 화면에서만 내려받는다. 모바일 사용자는 영영 받지 않는다.
// (vite.config.ts manualChunks 의 "lazy 전용 패키지" 규칙을 지키는 유일한 방법)
const DesktopNav = lazy(() => import('./components/DesktopNav'))

const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}
import { SearchCapsule } from '../../command/SearchTrigger'
import HeaderActions from './components/HeaderActions'
import HeaderAccountCluster from './components/HeaderAccountCluster'
import MobileMenu from './components/MobileMenu'
import { useDesktopRailVisible } from '../DesktopNavRail/useDesktopRailVisible'
import { useMenuState } from './hooks/useMenuState'
import { useHeaderScrolled } from './hooks/useHeaderScrolled'
import { useAuthState } from './hooks/useAuthState'
import { useLogout } from './hooks/useLogout'
import './NewHeader.css'

const NewHeader = () => {
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  
  // Custom hooks
  const { isMenuOpen, setIsMenuOpen, menuRef } = useMenuState()
  const { isLoggedIn, isAdminUser, setIsLoggedIn, setIsAdminUser } = useAuthState()
  const { handleLogout } = useLogout(setIsLoggedIn, setIsAdminUser, () => setIsMenuOpen(false))
  
  // React Query로 알림 개수 조회 (첫 페이지 기준 전체 unread_count)
  const { data } = useNotifications()
  const unreadCount = data?.pages[0]?.unread_count ?? 0

  // SSE 실시간 알림 스트림 — 새 공지/개인 알림 시 뱃지·목록 즉시 갱신 (폴링 대체)
  useNotificationStream(isLoggedIn)

  // 본문(main-content)은 좌측 레일만큼 밀린 영역의 가운데에 정렬되므로,
  // 헤더 인라인 메뉴도 같은 축(50% + 레일폭/2)에 맞춰야 위아래 중심이 일치한다
  const railVisible = useDesktopRailVisible()

  // 하단 경계선: 맨 위에선 지우고(헤더·레일이 한 덩어리 흰 크롬으로 읽힌다),
  // 스크롤이 시작되면 헤어라인 + 미세 그림자로 층을 세운다
  const scrolled = useHeaderScrolled()

  // PC(lg+)에선 우상단 액션을 좌측 레일 하단으로 옮겼다 (DesktopNavRail 유틸리티).
  // 알림 모달·전체 메뉴 패널의 소유권은 헤더에 남기고, 레일은 열기만 요청한다.
  // (열린 뒤엔 백드롭/모달이 레일을 덮으므로 토글 경합이 생기지 않는다)
  useEffect(() => {
    const openNotifications = () => setIsNotificationOpen(true)
    const openMenu = () => setIsMenuOpen(true)
    window.addEventListener('chambit:open-notifications', openNotifications)
    window.addEventListener('chambit:open-menu', openMenu)
    return () => {
      window.removeEventListener('chambit:open-notifications', openNotifications)
      window.removeEventListener('chambit:open-menu', openMenu)
    }
  }, [setIsMenuOpen])

  // 메뉴를 여는 순간 = 곧 이동한다는 신호 → 메뉴 페이지 청크를 미리 로드
  // (이미 받은 청크는 스킵되므로 유휴 프리로드와 중복돼도 비용 없음)
  useEffect(() => {
    if (isMenuOpen) void preloadMenuRoutes()
  }, [isMenuOpen])

  return (
    <>
      {/* Backdrop Blur Overlay — 하단 dock(z-100)까지 덮도록 dock보다 위 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[101]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 메뉴가 열리면 헤더(와 그 안의 드롭다운 메뉴)를 하단 dock(z-100) 위,
          모달류(z-110+) 아래로 올린다 — 평소 z-60을 유지해야 모달이 헤더를 덮을 수 있음 */}
      <header
        className={`fixed top-0 left-0 right-0 ${
          isMenuOpen ? 'z-[105]' : 'z-[60]'
        } max-lg:bg-white/85 max-lg:dark:bg-background-dark/85 lg:bg-[var(--desktop-chrome-blur)] backdrop-blur-xl border-b transition-[border-color,box-shadow] duration-200 ${
          scrolled || isMenuOpen
            ? 'border-black/[0.045] dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none'
            : 'border-transparent shadow-none'
        }`}
        ref={menuRef}
      >
        {/* lg+: 데스크톱 앱바 — 로고는 좌상단(좌측 레일과 정렬), 액션은 우상단 */}
        <div className="relative max-w-md mx-auto px-4 h-14 flex items-center justify-between lg:max-w-none lg:px-5">
          <Logo />
          {/* PC 전용 인라인 메뉴 — 본문 중심축(50% + 레일폭/2: lg 38px, xl 124px)에 절대 배치해
              페이지 콘텐츠와 세로 중심선이 일치하게 한다. 레일이 숨는 화면에선 화면 정중앙. */}
          <div
            className={`hidden lg:flex absolute inset-y-0 items-center gap-2 -translate-x-1/2 ${
              railVisible ? 'left-[calc(50%+38px)] xl:left-[calc(50%+124px)]' : 'left-1/2'
            }`}
          >
            {isDesktop && (
              <Suspense fallback={null}>
                <DesktopNav />
              </Suspense>
            )}
            {/* ⌘K 검색 캡슐 — 메뉴·설교·성구·참비를 한 입력창에서 */}
            <SearchCapsule />
            {/* 전체 메뉴 버튼은 뺐다 — 4축 드롭다운이 교회 안내 페이지를 전부 담고,
                개인 메뉴·관리자·설정은 좌측 레일 하단 ⋮ 가 같은 패널을 연다 */}
          </div>
          {/* 비로그인 PC — 레일엔 로그인 진입이 없으니 우상단에 랜딩과 같은 두 갈래 CTA를 둔다 */}
          {railVisible && !isLoggedIn && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-9 px-3.5 rounded-full text-[13.5px] font-semibold text-gray-600 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
              >
                {t('navCtaLogin')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="brand-gradient h-9 px-4 rounded-full text-[13.5px] font-bold text-white shadow-[0_4px_12px_-4px_var(--brand-glow)] active:scale-[0.97] transition-transform"
              >
                {t('navCtaNewHere')}
              </button>
            </div>
          )}
          {/* 로그인 PC — 비로그인 CTA가 있던 그 자리를 알림 + 계정 아바타가 이어받는다.
              (레일 하단 유틸리티엔 "내가 누구인지" 보여주는 자리가 없었다) */}
          {railVisible && isLoggedIn && (
            <HeaderAccountCluster
              unreadCount={unreadCount}
              onNotificationClick={() => setIsNotificationOpen(true)}
            />
          )}
          {/* 우상단 액션 — 레일이 보이는 PC에선 레일 하단 유틸리티가 대신한다 */}
          <div className={railVisible ? 'lg:hidden' : ''}>
            <HeaderActions
              unreadCount={unreadCount}
              isMenuOpen={isMenuOpen}
              onNotificationClick={() => setIsNotificationOpen(true)}
              onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <MobileMenu 
            isAdminUser={isAdminUser}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        )}
      </header>

      {/* Notification Modal — 열릴 때만 마운트(모달 자체도 !isOpen 이면 null 을 반환한다) */}
      {isNotificationOpen && (
        <Suspense fallback={null}>
          <NotificationModal
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </Suspense>
      )}
    </>
  )
}

export default NewHeader
