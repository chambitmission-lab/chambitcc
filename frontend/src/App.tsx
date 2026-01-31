import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/layout/Header/Header'
import Footer from './components/layout/Footer/Footer'
import Home from './pages/Home/Home'
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
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router basename={import.meta.env.PROD ? "/chambitcc/" : "/"}>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
