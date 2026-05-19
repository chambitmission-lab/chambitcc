import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

type MenuItem =
  | { path: string; key: 'about' | 'worship' | 'sermon' | 'bible' | 'garden' | 'answeredPrayers' | 'events' | 'missionStatus' | 'ministry' | 'news' | 'myGroups' }
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
  { path: '/groups', key: 'myGroups' },
  { path: '/mission', key: 'missionStatus' },
  { path: '/ministry', key: 'ministry' },
  { path: '/news', key: 'news' }
]

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    <nav className="grid grid-cols-2 gap-2.5 p-3">
      {MENU_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="
            group relative overflow-hidden
            px-3 py-3.5 rounded-2xl min-h-[52px]
            flex items-center justify-center
            bg-white/80 dark:bg-card-dark
            border border-gray-200/70 dark:border-white/[0.08]
            shadow-sm
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
            text-[14px] font-semibold tracking-[-0.015em] text-gray-900 dark:text-white
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-purple-400/40 dark:hover:border-purple-400/35
            hover:shadow-[0_0_18px_rgba(168,85,247,0.18),0_4px_16px_rgba(0,0,0,0.10)]
            dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_rgba(168,85,247,0.28),0_8px_24px_rgba(236,72,153,0.10)]
          "
        >
          {/* 다크 카드 표면 미세 그라데이션 */}
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
          {/* 호버 시 purple→pink 워시 (saturated 글로우 한 겹) */}
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 dark:from-purple-500/15 dark:to-pink-500/10" />
          <span className="relative z-10 truncate">
            {'key' in item ? t(item.key) : item.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}

export default NavigationMenu
