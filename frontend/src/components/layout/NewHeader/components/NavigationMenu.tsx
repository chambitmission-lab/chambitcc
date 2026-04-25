import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

type MenuItem =
  | { path: string; key: 'about' | 'worship' | 'sermon' | 'bible' | 'garden' | 'answeredPrayers' | 'events' | 'missionStatus' | 'ministry' | 'news' }
  | { path: string; label: string }

const MENU_ITEMS: MenuItem[] = [
  { path: '/about', key: 'about' },
  { path: '/worship', key: 'worship' },
  { path: '/sermon', key: 'sermon' },
  { path: '/bible', key: 'bible' },
  { path: '/garden', key: 'garden' },
  { path: '/bluemarble', label: '🎲 바이블 퀘스트' },
  { path: '/answered-prayers', key: 'answeredPrayers' },
  { path: '/events', key: 'events' },
  { path: '/mission', key: 'missionStatus' },
  { path: '/ministry', key: 'ministry' },
  { path: '/news', key: 'news' }
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
          {'key' in item ? t(item.key) : item.label}
        </Link>
      ))}
    </nav>
  )
}

export default NavigationMenu
