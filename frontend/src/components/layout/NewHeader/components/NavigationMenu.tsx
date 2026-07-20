import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

type NavKey =
  | 'about' | 'worship' | 'sermon' | 'bible' | 'garden' | 'bluemarble'
  | 'answeredPrayers' | 'events' | 'missionStatus' | 'ministry' | 'news' | 'myGroups'
  | 'culture'

interface NavItem {
  path: string
  key: NavKey
}

interface NavSection {
  titleKey: 'navGroupChurch' | 'navGroupContent' | 'navGroupCommunity'
  items: NavItem[]
}

// 사용자 유형별 동선: 새가족(교회 안내) → 콘텐츠 → 교인 커뮤니티 순
const MENU_SECTIONS: NavSection[] = [
  {
    titleKey: 'navGroupChurch',
    items: [
      { path: '/about', key: 'about' },
      { path: '/worship', key: 'worship' },
      { path: '/events', key: 'events' },
      { path: '/culture', key: 'culture' }
    ]
  },
  {
    titleKey: 'navGroupContent',
    items: [
      // 설교·칼럼 메뉴 임시 숨김 (되살릴 때 아래 두 줄 주석 해제)
      // { path: '/sermon', key: 'sermon' },
      { path: '/bible', key: 'bible' }
      // { path: '/ministry', key: 'ministry' }
    ]
  },
  {
    titleKey: 'navGroupCommunity',
    items: [
      { path: '/groups', key: 'myGroups' },
      { path: '/mission', key: 'missionStatus' },
      { path: '/news', key: 'news' }
    ]
  }
]

// 게임·이벤트성 메뉴는 일반 탐색 메뉴와 톤을 분리해 배치
const ACTIVITY_ITEMS: NavItem[] = [
  { path: '/garden', key: 'garden' },
  { path: '/bluemarble', key: 'bluemarble' },
  { path: '/answered-prayers', key: 'answeredPrayers' }
]

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-white/40">
    {children}
  </h3>
)

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    <nav className="p-3 space-y-4">
      {MENU_SECTIONS.map(section => (
        <div key={section.titleKey}>
          <SectionTitle>{t(section.titleKey)}</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {section.items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="
                  group relative overflow-hidden
                  px-1.5 py-3 rounded-2xl min-h-[48px]
                  flex items-center justify-center text-center
                  bg-white/80 dark:bg-card-dark
                  border border-gray-200/70 dark:border-white/[0.08]
                  shadow-sm
                  dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
                  text-[13.5px] font-semibold tracking-[-0.015em] text-gray-900 dark:text-white
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[var(--brand-soft-strong)]
                  hover:shadow-[0_0_18px_var(--brand-glow),0_4px_16px_rgba(0,0,0,0.10)]
                  dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_var(--brand-glow),0_8px_24px_rgba(0,0,0,0.25)]
                "
              >
                {/* 다크 카드 표면 미세 그라데이션 */}
                <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
                {/* 호버 시 브랜드 블루 워시 */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl bg-[var(--brand-soft)]" />
                <span className="relative z-10 leading-tight">{t(item.key)}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 신앙 액티비티 — 아이콘 강조형 카드로 일반 메뉴와 구분 */}
      <div>
        <SectionTitle>{t('navGroupActivity')}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITY_ITEMS.map(item => {
            const [icon, ...rest] = t(item.key).split(' ')
            return (
              <Link
                key={item.path}
                to={item.path}
                className="
                  group relative overflow-hidden
                  px-2 py-3 rounded-2xl
                  flex flex-col items-center justify-center gap-1
                  bg-[var(--brand-soft)]
                  border border-[var(--brand-soft-strong)]
                  shadow-sm
                  text-[12px] font-semibold tracking-[-0.01em] text-gray-900 dark:text-white
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-brand
                  hover:shadow-[0_0_18px_var(--brand-glow),0_4px_16px_rgba(0,0,0,0.10)]
                  dark:hover:shadow-[0_0_22px_var(--brand-glow),0_8px_24px_rgba(0,0,0,0.25)]
                "
              >
                <span className="text-[20px] leading-none">{icon}</span>
                <span className="text-center leading-tight">{rest.join(' ')}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default NavigationMenu
