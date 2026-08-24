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
      { path: '/greeting', key: 'greeting' },
      { path: '/visit', key: 'visit' },
      { path: '/organization', key: 'organization' },
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
      { path: '/classes', key: 'classNote' },
      { path: '/mission', key: 'missionStatus' },
      { path: '/news', key: 'news' }
    ]
  }
]

// 게임·이벤트성 메뉴 — 구조는 같게 두고 아이콘 색으로만 톤을 분리한다
const ACTIVITY_ITEMS: NavItem[] = [
  { path: '/garden', key: 'garden' },
  { path: '/bluemarble', key: 'bluemarble' },
  { path: '/answered-prayers', key: 'answeredPrayers' }
]

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted lg:px-2 lg:pb-2">
    {children}
  </h3>
)

/* 카드 테두리를 걷어낸 런처 셀 — 아이콘이 위계를 만들고
   빈 자리는 상자가 아니라 여백으로 읽힌다.
   accent=true면 칩 배경·아이콘이 브랜드 블루로 바뀐다(신앙 액티비티). */
const LauncherItem = ({
  item,
  label,
  accent = false,
}: {
  item: NavItem
  label: string
  accent?: boolean
}) => {
  const Icon = NAV_ICONS[item.key]
  return (
    <Link
      to={item.path}
      className="
        group flex flex-col items-center gap-1.5
        rounded-2xl px-1 py-2.5
        transition-colors duration-150
        hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]
        lg:flex-row lg:items-center lg:gap-3 lg:px-2 lg:py-2 lg:rounded-xl
      "
    >
      <span
        className={`
          flex items-center justify-center w-11 h-11 rounded-2xl shrink-0
          transition-colors duration-150
          lg:w-9 lg:h-9 lg:rounded-xl
          ${accent
            ? 'bg-[var(--brand-soft)] text-brand group-hover:bg-[var(--brand-soft-strong)]'
            : 'bg-surface-high text-ink group-hover:text-brand'}
        `}
      >
        <Icon />
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-center text-ink lg:text-[13.5px] lg:text-left lg:whitespace-nowrap lg:group-hover:text-brand lg:transition-colors">
        {label}
      </span>
    </Link>
  )
}

const NavigationMenu = () => {
  const { t } = useLanguage()

  return (
    // 모바일: 섹션 세로 스택 + 4열 아이콘 그리드 (런처)
    // lg+: 섹션을 4개 컬럼으로 나란히 놓는 메가 메뉴 — 각 컬럼 안에서는
    //      아이콘+라벨 가로 행으로 바꿔 데스크톱 스캔 속도를 높인다
    <nav className="p-3 space-y-5 lg:p-6 lg:pb-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:items-start">
      {MENU_SECTIONS.map(section => (
        <div key={section.titleKey}>
          <SectionTitle>{t(section.titleKey)}</SectionTitle>
          <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-1 lg:gap-0.5">
            {section.items.map(item => (
              <LauncherItem key={item.path} item={item} label={t(item.key)} />
            ))}
          </div>
        </div>
      ))}

      {/* 신앙 액티비티 — 구조는 위와 동일하고 아이콘만 브랜드 블루로 강조한다.
          OS마다 다르게 그려지는 이모지 대신 직접 그린 아이콘을 쓴다. */}
      <div>
        <SectionTitle>{t('navGroupActivity')}</SectionTitle>
        <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-1 lg:gap-0.5">
          {ACTIVITY_ITEMS.map(item => (
            <LauncherItem key={item.path} item={item} label={t(item.key)} accent />
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NavigationMenu
