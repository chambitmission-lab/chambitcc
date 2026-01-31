import { Link } from 'react-router-dom'
import './Navigation.css'

const Navigation = () => {
  const menuItems = [
    { path: '/about', label: '교회소개' },
    { path: '/tv', label: '참빛TV' },
    { path: '/education', label: '교육과 훈련' },
    { path: '/mission', label: '선교과 전도' },
    { path: '/ministry', label: '사역과 섬김' },
    { path: '/news', label: '교회소식' },
    { path: '/participate', label: '나눔과 참여' },
    { path: '/online', label: '온라인콘텐츠' },
    { path: '/culture', label: '문화교실' },
  ]

  return (
    <nav className="navigation">
      {menuItems.map((item) => (
        <Link key={item.path} to={item.path} className="nav-link">
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export default Navigation
