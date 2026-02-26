import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { clearPersistedCache } from './config/persister'
import NewHeader from './components/layout/NewHeader/NewHeader'
import NewFooter from './components/layout/NewFooter/NewFooter'
import PWAInstallButton from './components/common/PWAInstallButton'
import Home from './pages/Home/Home'
import NewHome from './pages/Home/NewHome'
import About from './pages/About/About'
import TV from './pages/TV/TV'
import Education from './pages/Education/Education'
import Mission from './pages/Mission/Mission'
import Ministry from './pages/Ministry/Ministry'
import News from './pages/News/News'
import Participate from './pages/Participate/Participate'
import Online from './pages/Online/Online'
import Culture from './pages/Culture/Culture'
import Worship from './pages/Worship/Worship'
import Sermon from './pages/Sermon/Sermon'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import NotificationManagement from './pages/Admin/NotificationManagement'
import DailyVerseManagement from './pages/Admin/DailyVerseManagement'
import BulletinManagement from './pages/Admin/BulletinManagement'
import { PushNotificationManagement } from './pages/Admin/PushNotificationManagement'
import EventManagement from './pages/Admin/EventManagement'
import UserManagement from './pages/Admin/UserManagement'
import Profile from './pages/Profile/Profile'
import EventCalendar from './pages/Events/EventCalendar'
import EventDetail from './pages/Events/EventDetail'
import PrayerFocus from './pages/PrayerFocus'
import BibleStudy from './pages/Bible/BibleStudy'
import './App.css'
import './styles/common.css'

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
            refetchType: 'active' // 현재 활성화된 쿼리만 즉시 refetch
          })
        }
      }
      
      // 현재 시간 기록
      localStorage.setItem('last_app_open_time', now.toString())
    }
    
    checkCacheConsistency()
  }, [queryClient])

  return (
    <ThemeProvider>
      <Router>
        <div className="app min-h-screen">
          <NewHeader />
          <main className="main-content">
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
              <Route path="/admin/notifications" element={<NotificationManagement />} />
              <Route path="/admin/daily-verse" element={<DailyVerseManagement />} />
              <Route path="/admin/bulletins" element={<BulletinManagement />} />
              <Route path="/admin/push" element={<PushNotificationManagement />} />
              <Route path="/admin/events" element={<EventManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/events" element={<EventCalendar />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/prayer-focus" element={<PrayerFocus />} />
              <Route path="/bible" element={<BibleStudy />} />
              {/* Catch-all route - 모든 매칭되지 않는 경로를 홈으로 리다이렉트 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <NewFooter />
          {/* PWA 설치 버튼 */}
          <PWAInstallButton />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
