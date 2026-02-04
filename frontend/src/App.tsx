import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { getBasePath } from './config/basename'
import NewHeader from './components/layout/NewHeader/NewHeader'
import NewFooter from './components/layout/NewFooter/NewFooter'
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
import Profile from './pages/Profile/Profile'
import './App.css'
import './styles/common.css'

function App() {
  return (
    <ThemeProvider>
      <Router basename={getBasePath()}>
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
            </Routes>
          </main>
          <NewFooter />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
