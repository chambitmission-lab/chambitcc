import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { clearPersistedCache } from './config/persister'
import NewHeader from './components/layout/NewHeader/NewHeader'
import NewFooter from './components/layout/NewFooter/NewFooter'
import PWAInstallButton from './components/common/PWAInstallButton'
import { TitleUnlockHost } from './components/titles/TitleUnlockHost'
import { menuRouteLoaders, schedulePreloadOnIdle } from './utils/routePreload'
// 즉시 진입 가능성이 높은 페이지는 eager import 유지
import NewHome from './pages/Home/NewHome'
import Login from './pages/Auth/Login'

// 보조/관리/대형 페이지는 lazy로 분리 → 메인 번들 축소
// 햄버거 메뉴 페이지는 routePreload의 로더를 공유해 프리로드 청크를 재사용
const Home = lazy(() => import('./pages/Home/Home'))
const About = lazy(menuRouteLoaders['/about'])
const TV = lazy(() => import('./pages/TV/TV'))
const Education = lazy(() => import('./pages/Education/Education'))
const Mission = lazy(menuRouteLoaders['/mission'])
const Ministry = lazy(menuRouteLoaders['/ministry'])
const News = lazy(menuRouteLoaders['/news'])
const Participate = lazy(() => import('./pages/Participate/Participate'))
const Online = lazy(() => import('./pages/Online/Online'))
const Culture = lazy(menuRouteLoaders['/culture'])
const Worship = lazy(menuRouteLoaders['/worship'])
const Sermon = lazy(menuRouteLoaders['/sermon'])
const Register = lazy(() => import('./pages/Auth/Register'))
const Profile = lazy(menuRouteLoaders['/profile'])
const AccountSettings = lazy(menuRouteLoaders['/account'])
const NotificationManagement = lazy(
  () => import('./pages/Admin/NotificationManagement'),
)
const DailyVerseManagement = lazy(
  () => import('./pages/Admin/DailyVerseManagement'),
)
const BulletinManagement = lazy(
  () => import('./pages/Admin/BulletinManagement'),
)
const PushNotificationManagement = lazy(() =>
  import('./pages/Admin/PushNotificationManagement').then((m) => ({
    default: m.PushNotificationManagement,
  })),
)
const EventManagement = lazy(() => import('./pages/Admin/EventManagement'))
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'))
const GroupManagement = lazy(() => import('./pages/Admin/GroupManagement'))
const EventCalendar = lazy(menuRouteLoaders['/events'])
const EventDetail = lazy(() => import('./pages/Events/EventDetail'))
const MyGroups = lazy(menuRouteLoaders['/groups'])
const GroupDetail = lazy(() => import('./pages/Groups/GroupDetail'))
const PrayerFocus = lazy(() => import('./pages/PrayerFocus'))
const BibleStudy = lazy(menuRouteLoaders['/bible'])
const Genealogy = lazy(() => import('./pages/Bible/Genealogy/Genealogy'))
const PlanList = lazy(() => import('./pages/Bible/Plans/PlanList'))
const PlanDetail = lazy(() => import('./pages/Bible/Plans/PlanDetail'))
const RoomList = lazy(() => import('./pages/Rooms/RoomList'))
const RoomHome = lazy(() => import('./pages/Rooms/RoomHome'))
const JoinRoom = lazy(() => import('./pages/Rooms/JoinRoom'))
const BibleWordbook = lazy(() => import('./pages/Bible/Wordbook/WordbookPage'))
const BiblePlanManagement = lazy(() => import('./pages/Admin/BiblePlanManagement'))
const BibleCommentaryManagement = lazy(() => import('./pages/Admin/BibleCommentaryManagement'))
const AnsweredPrayers = lazy(menuRouteLoaders['/answered-prayers'])
const Thanks = lazy(() => import('./pages/Thanks/Thanks'))
const Garden = lazy(menuRouteLoaders['/garden'])
const Bluemarble = lazy(menuRouteLoaders['/bluemarble'])
const RabbitGallery = lazy(() => import('./pages/Bluemarble/RabbitGallery'))
const WeeklyStory = lazy(() => import('./pages/WeeklyStory/WeeklyStory'))
const Growth = lazy(() => import('./pages/Growth/Growth'))
const SituationBible = lazy(() => import('./pages/Bible/SituationBible'))
const PhotoVerse = lazy(() => import('./pages/Bible/PhotoVerse/PhotoVerse'))
const MeditationPage = lazy(() => import('./pages/Bible/Meditation/MeditationPage'))
const VerseAlarmPage = lazy(() => import('./pages/Bible/VerseAlarm/VerseAlarmPage'))
const SituationManagement = lazy(() => import('./pages/Admin/SituationManagement'))
const CultureManagement = lazy(() => import('./pages/Admin/CultureManagement'))

import './App.css'
import './styles/common.css'

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  const queryClient = useQueryClient()

  // 앱 시작 시 캐시 일관성 확인 (장시간 후 재접속 대응)
  useEffect(() => {
    const checkCacheConsistency = () => {
      const currentUsername = localStorage.getItem('user_username')
      const lastCachedUsername = localStorage.getItem('last_cached_username')
      const lastAppOpenTime = localStorage.getItem('last_app_open_time')
      const now = Date.now()

      // 사용자가 변경되었거나 처음 실행인 경우
      if (currentUsername !== lastCachedUsername) {
        console.log('User changed or first run, clearing cache')
        clearPersistedCache()
        queryClient.clear()

        // 현재 사용자 기록
        if (currentUsername) {
          localStorage.setItem('last_cached_username', currentUsername)
        } else {
          localStorage.removeItem('last_cached_username')
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
            queryKey: ['prayers'],
            refetchType: 'active', // 현재 활성화된 쿼리만 즉시 refetch
          })
        }
      }

      // 현재 시간 기록
      localStorage.setItem('last_app_open_time', now.toString())
    }

    checkCacheConsistency()
  }, [queryClient])

  // 첫 화면 렌더 후 유휴 시간에 메뉴 페이지 청크를 미리 받아 메뉴 진입 딜레이 제거
  useEffect(() => {
    schedulePreloadOnIdle()
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <NewHeader />
          <main className="main-content">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<NewHome />} />
                <Route path="/old-home" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/tv" element={<TV />} />
                <Route path="/education" element={<Education />} />
                <Route path="/mission" element={<Mission />} />
                <Route path="/ministry" element={<Ministry />} />
                <Route path="/news" element={<News />} />
                <Route path="/participate" element={<Participate />} />
                <Route path="/online" element={<Online />} />
                <Route path="/culture" element={<Culture />} />
                <Route path="/worship" element={<Worship />} />
                <Route path="/sermon" element={<Sermon />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/account" element={<AccountSettings />} />
                <Route path="/admin/notifications" element={<NotificationManagement />} />
                <Route path="/admin/daily-verse" element={<DailyVerseManagement />} />
                <Route path="/admin/bulletins" element={<BulletinManagement />} />
                <Route path="/admin/push" element={<PushNotificationManagement />} />
                <Route path="/admin/events" element={<EventManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/groups" element={<GroupManagement />} />
                <Route path="/admin/bible-plans" element={<BiblePlanManagement />} />
                <Route path="/admin/bible-commentaries" element={<BibleCommentaryManagement />} />
                <Route path="/admin/situations" element={<SituationManagement />} />
                <Route path="/admin/culture" element={<CultureManagement />} />
                <Route path="/events" element={<EventCalendar />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/groups" element={<MyGroups />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/prayer-focus" element={<PrayerFocus />} />
                <Route path="/answered-prayers" element={<AnsweredPrayers />} />
                <Route path="/thanks" element={<Thanks />} />
                <Route path="/bible" element={<BibleStudy />} />
                <Route path="/bible/genealogy" element={<Genealogy />} />
                <Route path="/bible/plans" element={<PlanList />} />
                <Route path="/bible/plans/:planId" element={<PlanDetail />} />
                <Route path="/rooms" element={<RoomList />} />
                <Route path="/rooms/:roomId" element={<RoomHome />} />
                <Route path="/join/:code" element={<JoinRoom />} />
                <Route path="/bible/wordbook" element={<BibleWordbook />} />
                <Route path="/bible/situation" element={<SituationBible />} />
                <Route path="/bible/photo-verse" element={<PhotoVerse />} />
                <Route path="/bible/meditation" element={<MeditationPage />} />
                <Route path="/bible/alarm" element={<VerseAlarmPage />} />
                <Route path="/bible/:bookNumber/:chapter" element={<BibleStudy />} />
                <Route path="/garden" element={<Garden />} />
                <Route path="/bluemarble" element={<Bluemarble />} />
                <Route path="/bluemarble/rabbit" element={<RabbitGallery />} />
                <Route path="/weekly-story" element={<WeeklyStory />} />
                <Route path="/growth" element={<Growth />} />
                {/* Catch-all route - 모든 매칭되지 않는 경로를 홈으로 리다이렉트 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <NewFooter />
          {/* PWA 설치 버튼 */}
          <PWAInstallButton />
          {/* 성경 칭호 해금 팝업 호스트 — 읽기 후 새 칭호를 축하 */}
          <TitleUnlockHost />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
