import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const MENU_ITEMS = [
  { path: '/about', key: 'about' as const },
  { path: '/worship', key: 'worship' as const },
  { path: '/sermon', key: 'sermon' as const },
  { path: '/bible', key: 'bible' as const },
  { path: '/garden', key: 'garden' as const },
  { path: '/answered-prayers', key: 'answeredPrayers' as const },
  { path: '/events', key: 'events' as const },
  { path: '/mission', key: 'missionStatus' as const },
  { path: '/ministry', key: 'ministry' as const },
  { path: '/news', key: 'news' as const }
]

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    <nav className="grid grid-cols-2 gap-2 p-3">
      {MENU_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="glow-menu-item px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white rounded-xl transition-all text-center relative min-h-[44px] flex items-center justify-center"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  )
}

export default NavigationMenu
