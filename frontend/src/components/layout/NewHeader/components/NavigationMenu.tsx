import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { NAV_ICONS, type NavIconKey } from './NavIcons'

interface NavItem {
  path: string
  key: NavIconKey
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
      { path: '/history', key: 'history' },
      { path: '/worship', key: 'worship' },
      { path: '/events', key: 'events' },
      { path: '/culture', key: 'culture' }
    ]
  },
  {
    titleKey: 'navGroupContent',
    items: [
      { path: '/sermon', key: 'sermon' },
      { path: '/bible', key: 'bible' },
      { path: '/ministry', key: 'ministry' }
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
const ACTIVITY_ITEMS = [
  { path: '/garden', key: 'garden' },
  { path: '/bluemarble', key: 'bluemarble' },
  { path: '/answered-prayers', key: 'answeredPrayers' }
] as const

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
    {children}
  </h3>
)

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    <nav className="p-3 space-y-5">
      {MENU_SECTIONS.map(section => (
        <div key={section.titleKey}>
          <SectionTitle>{t(section.titleKey)}</SectionTitle>
          {/* 카드 테두리를 걷어낸 4열 런처 — 아이콘이 위계를 만들고
              빈 자리는 상자가 아니라 여백으로 읽힌다 */}
          <div className="grid grid-cols-4 gap-0.5">
            {section.items.map(item => {
              const Icon = NAV_ICONS[item.key]
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="
                    group flex flex-col items-center gap-1.5
                    rounded-2xl px-1 py-2.5
                    transition-colors duration-150
                    hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]
                  "
                >
                  <span
                    className="
                      flex items-center justify-center w-11 h-11 rounded-2xl
                      bg-surface-high text-ink
                      group-hover:text-brand transition-colors duration-150
                    "
                  >
                    <Icon />
                  </span>
                  <span className="text-[11.5px] font-medium leading-tight text-center text-ink">
                    {t(item.key)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* 신앙 액티비티 — 여기만 브랜드 틴트 카드로 남겨 탐색 메뉴와 구분한다 */}
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
                  text-[12px] font-semibold tracking-[-0.01em] text-ink-strong
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:border-brand
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
