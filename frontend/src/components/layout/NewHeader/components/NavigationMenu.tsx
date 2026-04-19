import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const MENU_ITEMS = [
  { path: '/about', key: 'about' as const },
  { path: '/worship', key: 'worship' as const },
  { path: '/sermon', key: 'sermon' as const },
  { path: '/bible', key: 'bible' as const },
  { path: '/garden', label: '🌸 나의 정원' },
  { path: '/answered-prayers', label: '✨ 응답의 전당' },
  { path: '/events', key: 'events' as const },
  { path: '/mission', label: '🌍 선교 현황' },
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
          {'label' in item ? item.label : t(item.key)}
        </Link>
      ))}
    </nav>
  )
}

export default NavigationMenu
