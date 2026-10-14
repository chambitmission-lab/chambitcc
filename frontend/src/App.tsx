import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { clearPersistedCache } from './config/persister'
import NewHeader from './components/layout/NewHeader/NewHeader'
import { useDesktopRailVisible } from './components/layout/DesktopNavRail/useDesktopRailVisible'
import { useMediaQuery } from './hooks/useMediaQuery'
// PC 전용 좌측 레일(lg+) — 모바일은 받을 이유가 없으므로 lazy + matchMedia 게이트
const DesktopNavRail = lazy(() => import('./components/layout/DesktopNavRail/DesktopNavRail'))
import ErrorBoundary from './components/common/ErrorBoundary'
import NewFooter from './components/layout/NewFooter/NewFooter'
import PWAInstallButton from './components/common/PWAInstallButton'
import PullToRefresh from './components/common/PullToRefresh'
import ScrollRestoration from './components/common/ScrollRestoration'
import OpenFromQuery from './components/common/OpenFromQuery'
import { TitleUnlockHost } from './components/titles/TitleUnlockHost'
import { ConfirmDialogHost } from './components/common/ConfirmDialog'
// 챗봇 위젯(24KB + CSS 24KB + 아바타 7장)은 첫 페인트에 필요 없다 — 엔트리에서 떼고
// App 첫 렌더 때 받기 시작해 한 왕복 뒤 FAB 이 나타난다
const ChatbotWidget = lazy(() => import('./components/chatbot/ChatbotWidget'))
// ⌘K 팔레트는 열 때만 필요 — lazy 로 분리해 메인 번들에서 제외 (트리거 호버 시 프리로드)
const CommandPalette = lazy(() => import('./components/command/CommandPalette'))
import { schedulePreloadOnIdle } from './utils/routePreload'
import { healPushSubscription } from './utils/pushNotification'
import { checkForAppUpdate } from './utils/appVersion'
import { isAuthenticated, getCurrentUser } from './utils/auth'
import { useFeedTextScale } from './utils/feedTextScale'
import { usePageZoomRequest, zoomsWithTextScale } from './utils/textScaleRoutes'
import RouteDataPrefetch from './components/common/RouteDataPrefetch'
import { sessionStore } from './utils/tokenStore'

// 라우트는 영역별 파일(routes/*)에 lazy 선언과 함께 모아 둔다 — 새 화면은 해당 영역 파일에만 추가
import { homeRoutes } from './routes/homeRoutes'
import { churchRoutes } from './routes/churchRoutes'
import { communityRoutes } from './routes/communityRoutes'
import { bibleRoutes } from './routes/bibleRoutes'
import { pastorRoutes } from './routes/pastorRoutes'
import { adminRoutes } from './routes/adminRoutes'
import { devRoutes } from './routes/devRoutes'

import './App.css'
import './styles/common.css'
import { prayerKeys } from './hooks/usePrayersQuery'
import { safeStorage } from './utils/safeStorage'

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

// PC 전역 좌측 레일이 보이는 라우트에선 본문을 레일 폭만큼 밀어낸다 (lg+)
const MainContent = ({ children }: { children: ReactNode }) => {
  const railVisible = useDesktopRailVisible()
  const { pathname } = useLocation()
  const textScale = useFeedTextScale()
  const pageZoom = usePageZoomRequest()
  // 2200px+ 대형 모니터 — 기본 글씨에서도 zoom 을 켜 빈 좌우 여백을 채운다(배율은 common.css --wide-zoom)
  const wideScreen = useMediaQuery('(min-width: 2200px)')
  // PC 글씨 크기 — 읽기·참여 화면은 페이지 전체를 zoom (common.css `[data-app-scale]`, lg+ 에서만).
  // /bible 허브처럼 주소로 갈리지 않는 화면은 페이지가 requestPageZoom 으로 켠다
  const appScale =
    (textScale !== 'base' || wideScreen) && (pageZoom || zoomsWithTextScale(pathname)) ? textScale : undefined
  return (
    <main
      // 배율 숫자(--az·--text-mul)는 <html data-text-scale> 이 준다 — 여기선 zoom 을 켤지만 정한다
      data-app-scale={appScale}
      className={`main-content ${railVisible ? 'lg:pl-[76px] xl:pl-[248px]' : ''}`}
    >
      {children}
    </main>
  )
}

function App() {
  const queryClient = useQueryClient()
  const isLg = useMediaQuery('(min-width: 1024px)')

  // 앱 시작 시 캐시 일관성 확인 (장시간 후 재접속 대응)
  useEffect(() => {
    const checkCacheConsistency = () => {
      const currentUsername = sessionStore.get('username')
      const lastCachedUsername = safeStorage.get('last_cached_username')
      const lastAppOpenTime = safeStorage.get('last_app_open_time')
      const now = Date.now()

      // 사용자가 변경되었거나 처음 실행인 경우
      if (currentUsername !== lastCachedUsername) {
        console.log('User changed or first run, clearing cache')
        clearPersistedCache()
        queryClient.clear()

        // 현재 사용자 기록
        if (currentUsername) {
          safeStorage.set('last_cached_username', currentUsername)
        } else {
          safeStorage.remove('last_cached_username')
        }
      }
      // 같은 사용자지만 30분 이상 지났으면 기도 목록 캐시만 무효화
      else if (lastAppOpenTime) {
        const timeSinceLastOpen = now - parseInt(lastAppOpenTime)
        const THIRTY_MINUTES = 1000 * 60 * 30

        if (timeSinceLastOpen > THIRTY_MINUTES) {
          console.log('App reopened after 30+ minutes, invalidating prayer caches')
          // 기도 목록 캐시만 무효화 (백그라운드에서 새로 가져옴)
          queryClient.invalidateQueries({
            queryKey: prayerKeys.all,
            refetchType: 'active', // 현재 활성화된 쿼리만 즉시 refetch
          })
        }
      }

      // 현재 시간 기록
      safeStorage.set('last_app_open_time', now.toString())
    }

    checkCacheConsistency()
  }, [queryClient])

  // 첫 화면 렌더 후 유휴 시간에 메뉴 페이지 청크를 미리 받아 메뉴 진입 딜레이 제거
  useEffect(() => {
    schedulePreloadOnIdle()
  }, [])

  // 앱 시작·포그라운드 복귀 시 자가 점검 2가지:
  // - 새 버전 감지: 설치형 PWA는 옛 번들이 며칠씩 살아남으므로 version.json 을
  //   비교해 다르면 스스로 새로고침 (재설치 없이 항상 최신 코드 보장)
  // - 푸시 구독 자가 치유: 켜둔 알림이 endpoint 만료 등으로 어긋나면 조용히 재구독
  //   (로그인 시점 1회 복원 restorePushSubscriptionForUser 실패를 보완하는 재시도 경로)
  useEffect(() => {
    const selfCheck = () => {
      void checkForAppUpdate()
      if (!isAuthenticated()) return
      void healPushSubscription(getCurrentUser().username)
    }

    selfCheck()

    // PWA는 새로고침 없이 메모리에서 복귀하는 경우가 많아 visibilitychange로도 검사
    // (검사 빈도는 각 함수 내부에서 제한됨: 버전 1분·푸시 1시간)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') selfCheck()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <ScrollRestoration />
        {/* ?open=notifications 등 URL 로 전역 UI 열기 (푸시 클릭 → 알림함) */}
        <OpenFromQuery />
        {/* lazy 청크와 나란히 라우트 데이터를 미리 받는다 (Suspense 바깥이라 청크를 기다리지 않는다) */}
        <RouteDataPrefetch />
        <div className="app">
          <NewHeader />
          {/* PC 전용 전역 좌측 내비 레일 (lg+) — 몰입형·인증 화면에선 스스로 숨는다.
              lg 미만에선 마운트조차 하지 않아 레일 청크를 내려받지 않는다 */}
          {isLg && (
            <Suspense fallback={null}>
              <DesktopNavRail />
            </Suspense>
          )}
          <MainContent>
            {/* 루트 에러 경계: 페이지 렌더 에러나 재배포 후 lazy 청크 로드 실패 시
                앱 전체가 흰 화면이 되는 대신 새로고침 안내를 보여준다 */}
            <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {homeRoutes}
                {churchRoutes}
                {communityRoutes}
                {bibleRoutes}
                {pastorRoutes}
                {adminRoutes}
                {devRoutes}
                {/* Catch-all route - 모든 매칭되지 않는 경로를 홈으로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </MainContent>
          <NewFooter />
          {/* 커스텀 당겨서 새로고침 — 전체 리로드 대신 활성 쿼리만 refetch */}
          <PullToRefresh />
          {/* PWA 설치 버튼 */}
          <PWAInstallButton />
          {/* 성경 칭호 해금 팝업 호스트 — 읽기 후 새 칭호를 축하 */}
          <TitleUnlockHost />
          {/* 공통 확인/안내 모달 호스트 — 브라우저 기본 confirm()/alert() 대체 */}
          <ConfirmDialogHost />
          {/* 규칙 기반 교회 챗봇 "참빛 말씀비서" — 전역 플로팅 위젯 */}
          <Suspense fallback={null}><ChatbotWidget /></Suspense>
          {/* ⌘K 무엇이든 찾기 — 메뉴·설교·성구·참비 */}
          <Suspense fallback={null}><CommandPalette /></Suspense>
          {/* 방문자 집계는 Cloudflare Pages 의 Web Analytics(대시보드 토글)가
              빌드 산출물에 비컨을 자동 주입하는 방식으로 대체 — 코드 불필요. */}
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
