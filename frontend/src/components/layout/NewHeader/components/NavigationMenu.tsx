import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { NAV_ICONS } from './NavIcons'
import { useIntercessionSummary } from '../../../../hooks/useIntercession'
import type { Translation } from '../../../../locales'
import { navEntries, type NavEntry } from '../../navCatalog'

// 항목의 이름·설명·아이콘은 layout/navCatalog.ts 한 곳 — 여기선 묶음과 순서만 고른다.

interface NavSection {
  titleKey: keyof Translation
  items: NavEntry[]
}

// 모바일 런처 — 사용자 유형별 동선: 새가족(교회 안내) → 콘텐츠 → 교인 커뮤니티 순
const MENU_SECTIONS: NavSection[] = [
  {
    titleKey: 'navGroupChurch',
    items: navEntries([
      '/about', '/greeting', '/visit', '/people', '/organization', '/history',
      '/worship', '/education', '/events', '/seats', '/culture',
    ]),
  },
  { titleKey: 'navGroupContent', items: navEntries(['/sermon', '/bible', '/ministry']) },
  { titleKey: 'navGroupCommunity', items: navEntries(['/groups', '/classes', '/mission', '/survey', '/news']) },
]

// 게임·이벤트성 메뉴 — 구조는 같게 두고 아이콘 색으로만 톤을 분리한다
const ACTIVITY_ITEMS = navEntries(['/garden', '/bluemarble', '/answered-prayers', '/intercession'])

// PC(lg+) 메가 메뉴 전용 묶음 — 헤더 4축(교회 · 예배·말씀 · 함께)에 '나의 신앙'을 더해 4칸을 고르게 나눈다.
// 모바일 묶음(MENU_SECTIONS)은 그대로 둔다: 모바일은 4열 아이콘 그리드라 한 섹션이 길어도 몇 줄이면 끝나지만,
// PC는 한 칸에 세로로 쌓여서 '교회 안내' 한 칸만 11줄이 되고 나머지 칸은 비어 버렸다.
// 각 행에 한 줄 설명을 붙여 헤더 드롭다운(DesktopNav)과 같은 "아이콘 + 이름 + 설명" 문법을 쓴다.
const DESKTOP_SECTIONS: NavSection[] = [
  { titleKey: 'navTopChurch', items: navEntries(['/about', '/greeting', '/visit', '/people', '/organization', '/history']) },
  { titleKey: 'navTopWord', items: navEntries(['/worship', '/sermon', '/bible', '/ministry', '/education']) },
  { titleKey: 'navTopTogether', items: navEntries(['/events', '/news', '/seats', '/culture', '/mission', '/survey']) },
  { titleKey: 'navGroupMyFaith', items: navEntries(['/groups', '/classes', '/garden', '/bluemarble', '/answered-prayers', '/intercession']) },
]

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
    {children}
  </h3>
)

/* PC 행 — 아이콘 칩 + 이름 + 한 줄 설명. 글씨는 헤더 '가' 배율(--mm, NewHeader.css .mega-menu)을 곱한다 */
const DesktopItem = ({ item, label, desc }: { item: NavEntry; label: string; desc: string }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      to={item.path}
      className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]"
    >
      <span
        className={`flex items-center justify-center w-[calc(42px*var(--mm,1))] h-[calc(42px*var(--mm,1))] rounded-xl shrink-0 transition-colors duration-150 ${
          item.accent
            ? 'bg-[var(--brand-soft)] text-brand group-hover:bg-[var(--brand-soft-strong)]'
            : 'bg-surface-high text-ink group-hover:text-brand'
        }`}
      >
        {Icon && <Icon className="w-[calc(22px*var(--mm,1))] h-[calc(22px*var(--mm,1))]" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[length:calc(16px*var(--mm,1))] font-semibold leading-tight text-ink-strong group-hover:text-brand transition-colors">
          {label}
        </span>
        <span className="block mt-1 text-[length:calc(13.5px*var(--mm,1))] leading-snug text-ink-muted truncate">
          {desc}
        </span>
      </span>
    </Link>
  )
}

/* 카드 테두리를 걷어낸 런처 셀 — 아이콘이 위계를 만들고
   빈 자리는 상자가 아니라 여백으로 읽힌다.
   accent=true면 칩 배경·아이콘이 브랜드 블루로 바뀐다(신앙 액티비티). */
const LauncherItem = ({
  item,
  label,
  accent = false,
}: {
  item: NavEntry
  label: string
  accent?: boolean
}) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      to={item.path}
      className="
        group flex flex-col items-center gap-1.5
        rounded-2xl px-1 py-2.5
        transition-colors duration-150
        hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]
      "
    >
      <span
        className={`
          flex items-center justify-center w-11 h-11 rounded-2xl shrink-0
          transition-colors duration-150
          ${accent
            ? 'bg-[var(--brand-soft)] text-brand group-hover:bg-[var(--brand-soft-strong)]'
            : 'bg-surface-high text-ink group-hover:text-brand'}
        `}
      >
        {Icon && <Icon />}
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-center text-ink">
        {label}
      </span>
    </Link>
  )
}

// isDesktop: PC 그리드와 모바일 런처를 둘 다 그리고 CSS 로 한쪽만 숨기면 Link·아이콘이 두 벌씩
// 만들어진다 — 메뉴가 열리는 프레임에 청크 프리로드까지 같이 도는 시점이라 한쪽만 그린다.
const NavigationMenu = ({ isDesktop }: { isDesktop: boolean }) => {
  const { t } = useLanguage()
  // 누군가의 기도는 운영자가 연 뒤에만 메뉴에 보인다 (그 전엔 광고 전 기능)
  const { data: intercession } = useIntercessionSummary()
  const visible = (item: NavEntry) => item.path !== '/intercession' || intercession?.open

  if (isDesktop) {
    /* lg+: 4칸 메가 메뉴 — 칸마다 5~6줄로 고르게, 행마다 한 줄 설명 */
    return (
      <nav className="grid grid-cols-4 gap-x-5 items-start px-5 pt-6 pb-4">
        {DESKTOP_SECTIONS.map(section => (
          <div key={section.titleKey} className="min-w-0">
            <h3 className="px-3 pb-2 text-[length:calc(14px*var(--mm,1))] font-bold text-ink-muted">
              {t(section.titleKey)}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.items.filter(visible).map(item => (
                <DesktopItem key={item.path} item={item} label={t(item.labelKey)} desc={t(item.descKey)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  const activityItems = ACTIVITY_ITEMS.filter(visible)
  /* 모바일: 섹션 세로 스택 + 4열 아이콘 그리드 (런처) */
  return (
    <nav className="p-3 space-y-5">
      {MENU_SECTIONS.map(section => (
        <div key={section.titleKey}>
          <SectionTitle>{t(section.titleKey)}</SectionTitle>
          <div className="grid grid-cols-4 gap-0.5">
            {section.items.map(item => (
              <LauncherItem key={item.path} item={item} label={t(item.labelKey)} />
            ))}
          </div>
        </div>
      ))}

      {/* 신앙 액티비티 — 구조는 위와 동일하고 아이콘만 브랜드 블루로 강조한다.
          OS마다 다르게 그려지는 이모지 대신 직접 그린 아이콘을 쓴다. */}
      <div>
        <SectionTitle>{t('navGroupActivity')}</SectionTitle>
        <div className="grid grid-cols-4 gap-0.5">
          {activityItems.map(item => (
            <LauncherItem key={item.path} item={item} label={t(item.labelKey)} accent />
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NavigationMenu
