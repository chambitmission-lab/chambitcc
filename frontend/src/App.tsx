import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { clearPersistedCache } from './config/persister'
import NewHeader from './components/layout/NewHeader/NewHeader'
import DesktopNavRail, {
  useDesktopRailVisible,
} from './components/layout/DesktopNavRail/DesktopNavRail'
import ErrorBoundary from './components/common/ErrorBoundary'
import NewFooter from './components/layout/NewFooter/NewFooter'
import PWAInstallButton from './components/common/PWAInstallButton'
import PullToRefresh from './components/common/PullToRefresh'
import ScrollRestoration from './components/common/ScrollRestoration'
import { TitleUnlockHost } from './components/titles/TitleUnlockHost'
import { ConfirmDialogHost } from './components/common/ConfirmDialog'
import ChatbotWidget from './components/chatbot/ChatbotWidget'
// ⌘K 팔레트는 열 때만 필요 — lazy 로 분리해 메인 번들에서 제외 (트리거 호버 시 프리로드)
const CommandPalette = lazy(() => import('./components/command/CommandPalette'))
import { menuRouteLoaders, schedulePreloadOnIdle } from './utils/routePreload'
import { healPushSubscription } from './utils/pushNotification'
import { checkForAppUpdate } from './utils/appVersion'
import { isAuthenticated, getCurrentUser } from './utils/auth'
// 즉시 진입 가능성이 높은 페이지는 eager import 유지
import NewHome from './pages/Home/NewHome'
import Login from './pages/Auth/Login'

// 보조/관리/대형 페이지는 lazy로 분리 → 메인 번들 축소
// 햄버거 메뉴 페이지는 routePreload의 로더를 공유해 프리로드 청크를 재사용
const Home = lazy(() => import('./pages/Home/Home'))
// 비로그인 첫 화면 — 로그인 교인의 메인 번들에서 떼어내되, 비로그인이면 모듈 로드 즉시
// 청크를 받아둬서 라우트 진입 시 폭포수(메인 → 랜딩) 없이 바로 그린다.
const loadLanding = () => import('./pages/Landing/Landing')
const Landing = lazy(loadLanding)
if (!localStorage.getItem('access_token')) void loadLanding()
// dev 전용 — 업적 모달 미리보기 (프로덕션 번들에는 라우트 자체가 빠짐)
const AchievementModalPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/Profile/components/AchievementModalPreview'))
  : null
// dev 전용 — 구절 공유 시트 미리보기 (백엔드 없이 포맷/카드를 확인)
const VerseSharePreview = import.meta.env.DEV
  ? lazy(() => import('./pages/Bible/components/VerseSharePreview'))
  : null
// dev 전용 — 프로필 헤더 미리보기 (아바타 후광/칭호 칩 구도 확인)
// dev 전용 — 홈 묵상 카드 미리보기 (백엔드 없이 목 데이터로 레이아웃 확인)
const MeditationCardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/Home/components/DailyMeditationCardPreview'))
  : null
// dev 전용 — 오디오북 재생 배경/애니메이션 시안 비교
const AudioBgPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/Bible/components/AudioBgPreview'))
  : null
const ProfileHeaderPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/Profile/components/ProfileHeaderPreview'))
  : null
const About = lazy(menuRouteLoaders['/about'])
const Greeting = lazy(menuRouteLoaders['/greeting'])
const Visit = lazy(menuRouteLoaders['/visit'])
const Organization = lazy(menuRouteLoaders['/organization'])
const History = lazy(menuRouteLoaders['/history'])
const TV = lazy(() => import('./pages/TV/TV'))
const Education = lazy(menuRouteLoaders['/education'])
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
const NewFamilyManagement = lazy(
  () => import('./pages/Admin/NewFamilyManagement'),
)
const EventAlbumManagement = lazy(
  () => import('./pages/Admin/EventAlbumManagement'),
)
const PushNotificationManagement = lazy(() =>
  import('./pages/Admin/PushNotificationManagement').then((m) => ({
    default: m.PushNotificationManagement,
  })),
)
const NewsManagement = lazy(() => import('./pages/Admin/NewsManagement'))
const PastorManagement = lazy(() => import('./pages/Admin/PastorManagement'))
const EducationManagement = lazy(() => import('./pages/Admin/EducationManagement'))
const OfferingManagement = lazy(() => import('./pages/Admin/OfferingManagement'))
const EventManagement = lazy(() => import('./pages/Admin/EventManagement'))
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'))
const GroupManagement = lazy(() => import('./pages/Admin/GroupManagement'))
const EventCalendar = lazy(menuRouteLoaders['/events'])
const EventDetail = lazy(() => import('./pages/Events/EventDetail'))
const MyGroups = lazy(menuRouteLoaders['/groups'])
const GroupDetail = lazy(() => import('./pages/Groups/GroupDetail'))
const JoinGroup = lazy(() => import('./pages/Groups/JoinGroup'))
const PrayerFocus = lazy(menuRouteLoaders['/prayer-focus'])
const BibleStudy = lazy(menuRouteLoaders['/bible'])
const Genealogy = lazy(() => import('./pages/Bible/Genealogy/Genealogy'))
const PlanList = lazy(() => import('./pages/Bible/Plans/PlanList'))
const PlanDetail = lazy(() => import('./pages/Bible/Plans/PlanDetail'))
const JoinPlan = lazy(() => import('./pages/Bible/Plans/JoinPlan'))
const ClassList = lazy(menuRouteLoaders['/classes'])
const ClassHome = lazy(() => import('./pages/ClassRoom/ClassHome'))
const JoinClass = lazy(() => import('./pages/ClassRoom/JoinClass'))
const ClassReport = lazy(() => import('./pages/ClassRoom/ClassReport'))
const ClassAttendance = lazy(() => import('./pages/ClassRoom/ClassAttendance'))
const ClassAlbum = lazy(() => import('./pages/ClassRoom/ClassAlbum'))
const RoomList = lazy(() => import('./pages/Rooms/RoomList'))
const RoomHome = lazy(() => import('./pages/Rooms/RoomHome'))
const JoinRoom = lazy(() => import('./pages/Rooms/JoinRoom'))
const CapsuleList = lazy(() => import('./pages/Capsule/CapsuleList'))
const CapsuleCreate = lazy(() => import('./pages/Capsule/CapsuleCreate'))
const CapsuleOpen = lazy(() => import('./pages/Capsule/CapsuleOpen'))
const CapsuleInvite = lazy(() => import('./pages/Capsule/CapsuleInvite'))
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
const BibleStoryMap = lazy(() => import('./pages/Bible/Story/StoryMap'))
const BibleStoryEpisode = lazy(() => import('./pages/Bible/Story/StoryEpisode'))
const PhotoVerse = lazy(() => import('./pages/Bible/PhotoVerse/PhotoVerse'))
const MeditationPage = lazy(() => import('./pages/Bible/Meditation/MeditationPage'))
const VerseAlarmPage = lazy(() => import('./pages/Bible/VerseAlarm/VerseAlarmPage'))
const SituationManagement = lazy(() => import('./pages/Admin/SituationManagement'))
const CultureManagement = lazy(() => import('./pages/Admin/CultureManagement'))
const OrganizationManagement = lazy(() => import('./pages/Admin/OrganizationManagement'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const CareRadar = lazy(() => import('./pages/Admin/CareRadar'))
const BibleEngagementManagement = lazy(() => import('./pages/Admin/BibleEngagementManagement'))
const WeeklyPrayerManagement = lazy(() => import('./pages/Admin/WeeklyPrayerManagement'))
const ChatbotManagement = lazy(() => import('./pages/Admin/ChatbotManagement'))
const WeeklyPrayerTopics = lazy(() => import('./pages/Prayer/WeeklyPrayerTopics'))
const WeeklyPrayerScreen = lazy(() => import('./pages/Prayer/WeeklyPrayerScreen'))

import './App.css'
import './styles/common.css'

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

// PC 전역 좌측 레일이 보이는 라우트에선 본문을 레일 폭만큼 밀어낸다 (lg+)
// 메인 분기 — 로그인 교인은 매일 쓰는 기도 피드 홈, 비로그인 방문자는 교회 소개 랜딩.
// (X·인스타그램 문법: 로그인 = 피드, 비로그인 = 소개 페이지)
// 비로그인이 피드를 구경하고 싶으면 랜딩의 "둘러보기" → /feed 로 간다.
const HomeGate = () => {
  return localStorage.getItem('access_token') ? <NewHome /> : <Landing />
}

const MainContent = ({ children }: { children: ReactNode }) => {
  const railVisible = useDesktopRailVisible()
  return (
    <main
      className={`main-content ${railVisible ? 'lg:pl-[76px] xl:pl-[248px]' : ''}`}
    >
      {children}
    </main>
  )
}

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
        <div className="app">
          <NewHeader />
          {/* PC 전용 전역 좌측 내비 레일 (lg+) — 몰입형·인증 화면에선 스스로 숨는다 */}
          <DesktopNavRail />
          <MainContent>
            {/* 루트 에러 경계: 페이지 렌더 에러나 재배포 후 lazy 청크 로드 실패 시
                앱 전체가 흰 화면이 되는 대신 새로고침 안내를 보여준다 */}
            <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomeGate />} />
                {/* 비로그인 둘러보기용 피드 직행 경로 (랜딩 CTA에서 진입) */}
                <Route path="/feed" element={<NewHome />} />
                {/* 로그인(관리자) 상태에서도 비로그인 랜딩을 열어 카피를 편집·미리보기 */}
                <Route path="/welcome" element={<Landing />} />
                <Route path="/old-home" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/greeting" element={<Greeting />} />
                <Route path="/visit" element={<Visit />} />
                <Route path="/organization" element={<Organization />} />
                <Route path="/history" element={<History />} />
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
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/care" element={<CareRadar />} />
                <Route path="/admin/notifications" element={<NotificationManagement />} />
                <Route path="/admin/daily-verse" element={<DailyVerseManagement />} />
                <Route path="/admin/bulletins" element={<BulletinManagement />} />
                <Route path="/admin/news" element={<NewsManagement />} />
                <Route path="/admin/new-family" element={<NewFamilyManagement />} />
                <Route path="/admin/event-albums" element={<EventAlbumManagement />} />
                <Route path="/admin/push" element={<PushNotificationManagement />} />
                <Route path="/admin/events" element={<EventManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/groups" element={<GroupManagement />} />
                <Route path="/admin/bible-plans" element={<BiblePlanManagement />} />
                <Route path="/admin/bible-commentaries" element={<BibleCommentaryManagement />} />
                <Route path="/admin/situations" element={<SituationManagement />} />
                <Route path="/admin/chatbot" element={<ChatbotManagement />} />
                <Route path="/admin/culture" element={<CultureManagement />} />
                <Route path="/admin/organization" element={<OrganizationManagement />} />
                <Route path="/admin/pastors" element={<PastorManagement />} />
                <Route path="/admin/education" element={<EducationManagement />} />
                <Route path="/admin/offering" element={<OfferingManagement />} />
                <Route path="/admin/bible-engagement" element={<BibleEngagementManagement />} />
                <Route path="/events" element={<EventCalendar />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/groups" element={<MyGroups />} />
                <Route path="/groups/join/:code" element={<JoinGroup />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/prayer-focus" element={<PrayerFocus />} />
                <Route path="/prayer-topics" element={<WeeklyPrayerTopics />} />
                <Route path="/prayer-topics/screen" element={<WeeklyPrayerScreen />} />
                <Route path="/admin/weekly-prayers" element={<WeeklyPrayerManagement />} />
                <Route path="/answered-prayers" element={<AnsweredPrayers />} />
                <Route path="/thanks" element={<Thanks />} />
                <Route path="/bible" element={<BibleStudy />} />
                <Route path="/bible/genealogy" element={<Genealogy />} />
                <Route path="/bible/plans" element={<PlanList />} />
                {/* 정적 경로를 :planId 보다 먼저 — 나만의 플랜 초대 링크 랜딩 */}
                <Route path="/bible/plans/join/:code" element={<JoinPlan />} />
                <Route path="/bible/plans/:planId" element={<PlanDetail />} />
                <Route path="/classes" element={<ClassList />} />
                <Route path="/classes/join/:code" element={<JoinClass />} />
                <Route path="/classes/:classId" element={<ClassHome />} />
                <Route path="/classes/:classId/report" element={<ClassReport />} />
                <Route path="/classes/:classId/attendance" element={<ClassAttendance />} />
                <Route path="/classes/:classId/album" element={<ClassAlbum />} />
                <Route path="/rooms" element={<RoomList />} />
                <Route path="/rooms/:roomId" element={<RoomHome />} />
                <Route path="/join/:code" element={<JoinRoom />} />
                <Route path="/capsule" element={<CapsuleList />} />
                <Route path="/capsule/new" element={<CapsuleCreate />} />
                <Route path="/capsule/invite/:code" element={<CapsuleInvite />} />
                <Route path="/capsule/:id" element={<CapsuleOpen />} />
                <Route path="/bible/wordbook" element={<BibleWordbook />} />
                <Route path="/bible/situation" element={<SituationBible />} />
                <Route path="/bible/story" element={<BibleStoryMap />} />
                <Route path="/bible/story/:episodeId" element={<BibleStoryEpisode />} />
                <Route path="/bible/photo-verse" element={<PhotoVerse />} />
                <Route path="/bible/meditation" element={<MeditationPage />} />
                <Route path="/bible/alarm" element={<VerseAlarmPage />} />
                <Route path="/bible/:bookNumber/:chapter" element={<BibleStudy />} />
                <Route path="/garden" element={<Garden />} />
                <Route path="/bluemarble" element={<Bluemarble />} />
                <Route path="/bluemarble/rabbit" element={<RabbitGallery />} />
                <Route path="/weekly-story" element={<WeeklyStory />} />
                <Route path="/growth" element={<Growth />} />
                {AchievementModalPreview && (
                  <Route path="/dev/achievements" element={<AchievementModalPreview />} />
                )}
                {VerseSharePreview && (
                  <Route path="/dev/verse-share" element={<VerseSharePreview />} />
                )}
                {ProfileHeaderPreview && (
                  <Route path="/dev/profile-header" element={<ProfileHeaderPreview />} />
                )}
                {MeditationCardPreview && (
                  <Route path="/dev/meditation-card" element={<MeditationCardPreview />} />
                )}
                {AudioBgPreview && (
                  <Route path="/dev/audio-bg" element={<AudioBgPreview />} />
                )}
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
          <ChatbotWidget />
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
