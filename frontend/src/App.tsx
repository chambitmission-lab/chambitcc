import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
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
import Profile from './pages/Profile/Profile'
import EventCalendar from './pages/Events/EventCalendar'
import EventDetail from './pages/Events/EventDetail'
import './App.css'
import './styles/common.css'

function App() {
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
              <Route path="/events" element={<EventCalendar />} />
              <Route path="/events/:id" element={<EventDetail />} />
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
