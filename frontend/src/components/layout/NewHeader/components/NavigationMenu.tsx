import { useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { NAV_ICONS, Svg } from './NavIcons'
import { useIntercessionSummary } from '../../../../hooks/useIntercession'
import type { Translation } from '../../../../locales'
import { NAV_CATALOG, navEntries, type NavEntry } from '../../navCatalog'
import { openCommandPalette, preloadCommandPalette } from '../../../command/commandEvents'

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

// PC(lg+) 메가 메뉴 — "자주 찾는" 큰 카드 3장(시선의 출발점) + 이름만 있는 4칸 목록 + 상단 메뉴 찾기.
// 전엔 23개 항목이 전부 "아이콘 칩 + 이름 + 설명" 같은 무게라 회색 글자 벽처럼 읽혔다.
// 설명은 카드와 검색 결과에만 두고, 목록 행은 호버/포커스 때 말풍선으로만 보인다. 브랜드 강조도 카드 한 곳뿐.
// 모바일 묶음(MENU_SECTIONS)은 그대로 둔다 — 4열 아이콘 런처라 사정이 다르다.
const DESKTOP_FEATURED = navEntries(['/worship', '/bible', '/events'])

const DESKTOP_SECTIONS: NavSection[] = [
  { titleKey: 'navTopChurch', items: navEntries(['/about', '/greeting', '/visit', '/people', '/organization', '/history']) },
  { titleKey: 'navTopWord', items: navEntries(['/sermon', '/ministry', '/education']) },
  { titleKey: 'navTopTogether', items: navEntries(['/news', '/seats', '/culture', '/mission', '/survey']) },
  { titleKey: 'navGroupMyFaith', items: navEntries(['/groups', '/classes', '/garden', '/bluemarble', '/answered-prayers', '/intercession']) },
]

const IconSearch = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
)

// 검색 비교용 — 대소문자·띄어쓰기 무시 ("오시는 길" = "오시는길")
const norm = (v: string) => v.toLowerCase().replace(/\s+/g, '')

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
    {children}
  </h3>
)

/* 자주 찾는 카드 — PC 메뉴 안에서 유일하게 브랜드 색 면을 쓰는 곳.
   글씨는 헤더 '가' 배율(--mm, NewHeader.css .mega-menu)을 곱한다 */
const FeaturedCard = ({ item, label, desc }: { item: NavEntry; label: string; desc: string }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      to={item.path}
      className="group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 bg-[var(--brand-soft)] transition-colors duration-150 hover:bg-[var(--brand-soft-strong)]"
    >
      <span className="flex items-center justify-center w-[calc(44px*var(--mm,1))] h-[calc(44px*var(--mm,1))] rounded-xl shrink-0 bg-background-light dark:bg-background-dark text-brand">
        {Icon && <Icon className="w-[calc(22px*var(--mm,1))] h-[calc(22px*var(--mm,1))]" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[length:calc(17px*var(--mm,1))] font-bold leading-tight text-ink-strong group-hover:text-brand transition-colors">
          {label}
        </span>
        <span className="block mt-1 text-[length:calc(13.5px*var(--mm,1))] leading-snug text-ink-muted line-clamp-2 break-keep">
          {desc}
        </span>
      </span>
    </Link>
  )
}

/* 목록 행 — 작은 단색 아이콘 + 이름만. 설명은 호버(0.3초 뒤)/키보드 포커스 때 아래 말풍선으로 */
const DesktopItem = ({ item, label, desc }: { item: NavEntry; label: string; desc: string }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      to={item.path}
      className="group relative flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-[var(--brand-soft)] focus-visible:bg-[var(--brand-soft)] outline-none"
    >
      <span className="shrink-0 text-ink-muted group-hover:text-brand transition-colors">
        {Icon && <Icon className="w-[calc(18px*var(--mm,1))] h-[calc(18px*var(--mm,1))]" />}
      </span>
      <span className="min-w-0 truncate text-[length:calc(15.5px*var(--mm,1))] font-medium leading-tight text-ink-strong group-hover:text-brand transition-colors">
        {label}
      </span>
      <span
        role="tooltip"
        className="
          pointer-events-none absolute left-2 top-full z-10 mt-0.5
          rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap
          bg-gray-900 text-white dark:bg-white dark:text-gray-900
          text-[length:calc(12.5px*var(--mm,1))] leading-snug
          opacity-0 translate-y-0.5 transition duration-150
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-300
          group-focus-visible:opacity-100 group-focus-visible:translate-y-0
        "
      >
        {desc}
      </span>
    </Link>
  )
}

/* 검색 결과 행 — 찾을 땐 설명까지 보여야 맞는 항목인지 안다 */
const SearchResultItem = ({
  item, label, desc, active, onHover,
}: { item: NavEntry; label: string; desc: string; active: boolean; onHover: () => void }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      to={item.path}
      onMouseEnter={onHover}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? 'bg-[var(--brand-soft)]' : 'hover:bg-[var(--brand-soft)]'}`}
    >
      <span className={`flex items-center justify-center w-[calc(36px*var(--mm,1))] h-[calc(36px*var(--mm,1))] rounded-lg shrink-0 bg-surface-high ${active ? 'text-brand' : 'text-ink'}`}>
        {Icon && <Icon className="w-[calc(19px*var(--mm,1))] h-[calc(19px*var(--mm,1))]" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-[length:calc(15.5px*var(--mm,1))] font-semibold leading-tight ${active ? 'text-brand' : 'text-ink-strong'}`}>
          {label}
        </span>
        <span className="block mt-0.5 text-[length:calc(13px*var(--mm,1))] text-ink-muted truncate">{desc}</span>
      </span>
    </Link>
  )
}

const DesktopMegaMenu = ({ visible }: { visible: (item: NavEntry) => boolean }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const q = norm(query)

  // 카탈로그 전체(주보·새가족 앨범 딥링크 포함)를 이름·설명으로 찾는다 — "주차"로 오시는길이 걸린다
  const results = q
    ? NAV_CATALOG.filter(visible).filter(item =>
      norm(t(item.labelKey)).includes(q) || norm(t(item.descKey)).includes(q))
    : []

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter 는 조합 확정용 — 이동으로 먹으면 마지막 글자가 빠진다
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setCursor(c => (c + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setCursor(c => (c - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && q) {
      e.preventDefault()
      const hit = results[Math.min(cursor, results.length - 1)]
      if (hit) navigate(hit.path)
      else openCommandPalette(query.trim())
    } else if (e.key === 'Escape' && query) {
      setQuery('')
    }
  }

  return (
    <div className="px-5 pt-5 pb-4">
      {/* 메뉴 찾기 — 20개 넘는 항목은 훑기보다 치는 게 빠르다. 메뉴에 없으면 ⌘K 팔레트로 이어준다 */}
      <label className="flex items-center gap-2.5 rounded-xl px-3.5 h-[calc(46px*var(--mm,1))] bg-surface-high border border-transparent focus-within:border-brand transition-colors">
        <IconSearch className="w-[calc(19px*var(--mm,1))] h-[calc(19px*var(--mm,1))] text-ink-muted shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => { setQuery(e.target.value); setCursor(0) }}
          onKeyDown={onKeyDown}
          onFocus={preloadCommandPalette}
          placeholder={t('navMenuSearchPlaceholder')}
          aria-label={t('navMenuSearchPlaceholder')}
          className="flex-1 min-w-0 bg-transparent outline-none text-[length:calc(15.5px*var(--mm,1))] text-ink-strong placeholder:text-ink-muted"
        />
      </label>

      {q ? (
        <div className="mt-3 min-h-[calc(220px*var(--mm,1))]">
          {results.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {results.map((item, i) => (
                <SearchResultItem
                  key={item.path}
                  item={item}
                  label={t(item.labelKey)}
                  desc={t(item.descKey)}
                  active={i === cursor}
                  onHover={() => setCursor(i)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-[length:calc(15px*var(--mm,1))] text-ink-muted">
                “{query.trim()}” — {t('navMenuNoResult')}
              </p>
              <button
                type="button"
                onClick={() => openCommandPalette(query.trim())}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[length:calc(14.5px*var(--mm,1))] font-semibold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <IconSearch className="w-4 h-4" />
                {t('navMenuSearchAll')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] gap-x-7">
          {/* 자주 찾는 — 예배 시간·성경·일정은 누구나 가장 먼저 찾는다 */}
          <div className="min-w-0">
            <h3 className="px-1 pb-2.5 text-[length:calc(14.5px*var(--mm,1))] font-bold text-brand">
              {t('navMenuFeatured')}
            </h3>
            <div className="flex flex-col gap-2">
              {DESKTOP_FEATURED.map(item => (
                <FeaturedCard key={item.path} item={item} label={t(item.labelKey)} desc={t(item.descKey)} />
              ))}
            </div>
          </div>

          {/* 4칸 목록 — 제목은 진하게 + 밑줄로 칸이 한 묶음으로 읽히게 */}
          <nav className="grid grid-cols-4 gap-x-4 items-start">
            {DESKTOP_SECTIONS.map(section => (
              <div key={section.titleKey} className="min-w-0">
                <h3 className="mx-3 mb-1.5 pb-2 border-b border-border-light dark:border-border-dark text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">
                  {t(section.titleKey)}
                </h3>
                <div className="flex flex-col">
                  {section.items.filter(visible).map(item => (
                    <DesktopItem key={item.path} item={item} label={t(item.labelKey)} desc={t(item.descKey)} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
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
  const visible = (item: NavEntry) => item.path !== '/intercession' || !!intercession?.open

  if (isDesktop) return <DesktopMegaMenu visible={visible} />


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
