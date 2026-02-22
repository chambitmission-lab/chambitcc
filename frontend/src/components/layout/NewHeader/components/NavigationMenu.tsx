import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const MENU_ITEMS = [
  { path: '/about', key: 'about' },
  { path: '/worship', key: 'worship' },
  { path: '/sermon', key: 'sermon' },
  { path: '/events', key: 'events' },
  { path: '/ministry', key: 'ministry' },
  { path: '/news', key: 'news' }
]

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    <nav className="flex overflow-x-auto scrollbar-hide py-3 px-4 gap-3">
      {MENU_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="glow-menu-item flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-full transition-all whitespace-nowrap relative"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  )
}

export default NavigationMenu
