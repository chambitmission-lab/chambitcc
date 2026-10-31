import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { NAV_ICONS, Svg } from './NavIcons'
import { useIntercessionSummary } from '../../../../hooks/useIntercession'
import type { Translation } from '../../../../locales'
import { NAV_CATALOG, navEntries, type NavEntry } from '../../navCatalog'
import { openCommandPalette, preloadCommandPalette } from '../../../command/commandEvents'
import { preloadRoute } from '../../../../utils/routePreload'
import { sessionStore } from '../../../../utils/tokenStore'
import { safeStorage } from '../../../../utils/safeStorage'

// 항목에 손이 닿는 순간 그 화면의 청크·데이터를 띄운다. 메뉴가 열릴 때 전체를 순차로 받고 있지만
// 뒤쪽 항목은 아직 차례가 안 왔을 수 있다 — 모바일은 호버가 없으니 pointerdown(탭 시작)에 건다.
// 이미 받았거나 받는 중이면 preloadRoute 가 그대로 돌려주므로 중복 요청은 없다.
const warmOnTouch = (path: string) => ({
  onPointerEnter: () => void preloadRoute(path),
  onPointerDown: () => void preloadRoute(path),
})

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
  { titleKey: 'navGroupCommunity', items: navEntries(['/today', '/companion', '/groups', '/classes', '/mission', '/survey', '/news']) },
]

// 게임·이벤트성 메뉴 — 구조는 같게 두고 아이콘 색으로만 톤을 분리한다
const ACTIVITY_ITEMS = navEntries(['/garden', '/bluemarble', '/bible/typing', '/handwriting', '/answered-prayers', '/intercession'])

// PC(lg+) 메가 메뉴 — "자주 찾는" 카드(시선의 출발점) + 이름만 있는 4칸 목록 + 상단 메뉴 찾기.
// 전엔 23개 항목이 전부 "아이콘 칩 + 이름 + 설명" 같은 무게라 회색 글자 벽처럼 읽혔다.
// 설명은 카드와 검색 결과에만 두고, 목록 행은 호버/포커스 때 말풍선으로만 보인다. 브랜드 강조도 카드 한 곳뿐.
// 모바일 묶음(MENU_SECTIONS)은 그대로 둔다 — 4열 아이콘 런처라 사정이 다르다.
//
// "자주 찾는" 카드는 성도가 직접 고른다(목록·검색 결과의 ☆). 처음엔 누구나 먼저 찾는 예배·성경·일정.
// 고른 메뉴도 목록 제자리에 ★로 남긴다 — 고정할 때마다 목록이 당겨지면 손이 위치를 못 외운다.
const DEFAULT_FEATURED = ['/worship', '/bible', '/events']
/* 카드 칸이 4칸 목록보다 길어지지 않을 만큼. 4장부터는 설명 줄을 접은 낮은 카드로 그린다 */
const FEATURED_MAX = 6

const DESKTOP_SECTIONS: NavSection[] = [
  { titleKey: 'navTopChurch', items: navEntries(['/about', '/greeting', '/visit', '/people', '/organization', '/history']) },
  { titleKey: 'navTopWord', items: navEntries(['/worship', '/bible', '/sermon', '/ministry', '/education']) },
  { titleKey: 'navTopTogether', items: navEntries(['/news', '/events', '/seats', '/culture', '/mission', '/survey']) },
  { titleKey: 'navGroupMyFaith', items: navEntries(['/today', '/companion', '/groups', '/classes', '/garden', '/bluemarble', '/bible/typing', '/handwriting', '/answered-prayers', '/intercession']) },
]

const IconSearch = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
)

// 검색 비교용 — 대소문자·띄어쓰기 무시 ("오시는 길" = "오시는길")
const norm = (v: string) => v.toLowerCase().replace(/\s+/g, '')

/* 서버 없이 이 기기에만 — 같은 PC 를 가족이 같이 써도 섞이지 않게 계정별 키(비로그인은 빈 이름) */
const featuredKey = () => `navMenu:favorites:${sessionStore.get('username') ?? ''}`

const readFeatured = (): string[] => {
  const parsed = safeStorage.getJson(featuredKey())
  if (parsed === undefined) return DEFAULT_FEATURED
  // 카탈로그에서 빠진 메뉴(경로가 바뀐 화면 등)는 조용히 버린다
  return Array.isArray(parsed)
    ? parsed.filter((p): p is string => typeof p === 'string' && NAV_CATALOG.some(i => i.path === p)).slice(0, FEATURED_MAX)
    : DEFAULT_FEATURED
}

/* PC 메가 메뉴·모바일 런처가 같은 저장값을 쓴다 — 한쪽에서 고르면 다른 쪽에도 그대로 */
const useFeatured = (visible: (item: NavEntry) => boolean) => {
  const [featured, setFeatured] = useState(readFeatured)

  const featuredItems = featured
    .map(path => NAV_CATALOG.find(i => i.path === path))
    .filter((i): i is NavEntry => !!i && visible(i))
  const full = featured.length >= FEATURED_MAX

  /* 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 메뉴가 열려 있는 동안은 그대로 동작한다 */
  const togglePin = (path: string) => {
    setFeatured(prev => {
      const next = prev.includes(path)
        ? prev.filter(p => p !== path)
        : prev.length < FEATURED_MAX ? [...prev, path] : prev
      safeStorage.setJson(featuredKey(), next)
      return next
    })
  }
  const pinOf = (path: string): PinProps => ({ pinned: featured.includes(path), full, onToggle: () => togglePin(path) })

  return { featuredItems, togglePin, pinOf }
}

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[calc(16px*var(--mm,1))] h-[calc(16px*var(--mm,1))]" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  </svg>
)

interface PinProps {
  pinned: boolean
  /** 이미 꽉 찼을 때 — 빈 ☆ 은 누를 수 없고 말풍선으로 이유를 알린다 */
  full: boolean
  onToggle: () => void
}

/* ☆ — 링크 안에 넣지 않는다(a 안의 button 은 무효 HTML). 부모(group relative) 오른쪽에 겹쳐 둔다.
   고정된 건 늘 보이고, 아닌 건 호버/포커스 때만 */
const PinButton = ({ pinned, full, onToggle, className = '' }: PinProps & { className?: string }) => {
  const { t } = useLanguage()
  const label = t(pinned ? 'navMenuPinRemove' : full ? 'navMenuPinFull' : 'navMenuPinAdd')
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!pinned && full}
      aria-pressed={pinned}
      aria-label={label}
      title={label}
      className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-md transition-opacity disabled:cursor-not-allowed ${
        pinned
          ? 'text-[var(--amber-icon)] opacity-100'
          : 'text-ink-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 enabled:hover:text-[var(--amber-icon)] disabled:group-hover:opacity-40'
      } ${className}`}
    >
      <IconStar filled={pinned} />
    </button>
  )
}

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
    {children}
  </h3>
)

/* 자주 찾는 카드 — PC 메뉴 안에서 유일하게 브랜드 색 면을 쓰는 곳.
   글씨는 헤더 '가' 배율(--mm, NewHeader.css .mega-menu)을 곱한다 */
const FeaturedCard = ({
  item, label, desc, compact, onUnpin,
}: { item: NavEntry; label: string; desc: string; compact: boolean; onUnpin: () => void }) => {
  const { t } = useLanguage()
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <div className="group relative">
      <Link
        to={item.path}
        {...warmOnTouch(item.path)}
        className={`flex items-center rounded-2xl bg-[var(--brand-soft)] transition-colors duration-150 hover:bg-[var(--brand-soft-strong)] ${
          compact ? 'gap-3 pl-3 pr-9 py-2.5' : 'gap-3.5 pl-4 pr-9 py-3.5'
        }`}
      >
        <span className={`flex items-center justify-center rounded-xl shrink-0 bg-background-light dark:bg-background-dark text-brand ${
          compact ? 'w-[calc(36px*var(--mm,1))] h-[calc(36px*var(--mm,1))]' : 'w-[calc(44px*var(--mm,1))] h-[calc(44px*var(--mm,1))]'
        }`}>
          {Icon && <Icon className={compact ? 'w-[calc(19px*var(--mm,1))] h-[calc(19px*var(--mm,1))]' : 'w-[calc(22px*var(--mm,1))] h-[calc(22px*var(--mm,1))]'} />}
        </span>
        <span className="min-w-0">
          <span className={`block font-bold leading-tight text-ink-strong group-hover:text-brand transition-colors ${
            compact ? 'truncate text-[length:calc(15.5px*var(--mm,1))]' : 'text-[length:calc(17px*var(--mm,1))]'
          }`}>
            {label}
          </span>
          {!compact && (
            <span className="block mt-1 text-[length:calc(13.5px*var(--mm,1))] leading-snug text-ink-muted line-clamp-2 break-keep">
              {desc}
            </span>
          )}
        </span>
      </Link>
      {/* 카드에선 ★ 대신 호버 때만 × — 늘 떠 있으면 브랜드 면 위 노란 별들이 시선을 뺏는다 */}
      <button
        type="button"
        onClick={onUnpin}
        aria-label={t('navMenuPinRemove')}
        title={t('navMenuPinRemove')}
        className="absolute right-2 top-2 p-1 rounded-md text-ink-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink-strong transition-opacity"
      >
        <svg viewBox="0 0 24 24" className="w-[calc(14px*var(--mm,1))] h-[calc(14px*var(--mm,1))]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}

/* 목록 행 — 작은 단색 아이콘 + 이름만. 설명은 호버(0.3초 뒤)/키보드 포커스 때 아래 말풍선으로 */
const DesktopItem = ({
  item, label, desc, tipRight = false, pin,
}: { item: NavEntry; label: string; desc: string; tipRight?: boolean; pin: PinProps }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <div className="group relative">
    <Link
      to={item.path}
      {...warmOnTouch(item.path)}
      className={`flex items-center gap-2.5 rounded-lg pl-3 py-2 transition-colors duration-150 hover:bg-[var(--brand-soft)] focus-visible:bg-[var(--brand-soft)] outline-none ${
        pin.pinned ? 'pr-8' : 'pr-3 group-hover:pr-8 group-focus-within:pr-8'
      }`}
    >
      <span className="shrink-0 text-ink-muted group-hover:text-brand transition-colors">
        {Icon && <Icon className="w-[calc(18px*var(--mm,1))] h-[calc(18px*var(--mm,1))]" />}
      </span>
      <span className="min-w-0 truncate text-[length:calc(15.5px*var(--mm,1))] font-medium leading-tight text-ink-strong group-hover:text-brand transition-colors">
        {label}
      </span>
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute top-full z-10 mt-0.5 ${tipRight ? 'right-2' : 'left-2'}
          rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap
          bg-gray-900 text-white dark:bg-white dark:text-gray-900
          text-[length:calc(12.5px*var(--mm,1))] leading-snug
          opacity-0 translate-y-0.5 transition duration-150
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-300
          group-has-[a:focus-visible]:opacity-100 group-has-[a:focus-visible]:translate-y-0
        `}
      >
        {desc}
      </span>
    </Link>
    <PinButton {...pin} className="right-1.5" />
    </div>
  )
}

/* 검색 결과 행 — 찾을 땐 설명까지 보여야 맞는 항목인지 안다 */
const SearchResultItem = ({
  item, label, desc, active, onHover, pin,
}: { item: NavEntry; label: string; desc: string; active: boolean; onHover: () => void; pin: PinProps }) => {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <div className="group relative" onMouseEnter={onHover}>
    <Link
      to={item.path}
      {...warmOnTouch(item.path)}
      className={`flex items-center gap-3 rounded-xl pl-3 pr-9 py-2.5 transition-colors ${active ? 'bg-[var(--brand-soft)]' : 'hover:bg-[var(--brand-soft)]'}`}
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
    <PinButton {...pin} className="right-2" />
    </div>
  )
}

const DesktopMegaMenu = ({ visible, searchLeading }: { visible: (item: NavEntry) => boolean; searchLeading?: ReactNode }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const { featuredItems, togglePin, pinOf } = useFeatured(visible)
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
      {/* 메뉴 찾기 — 20개 넘는 항목은 훑기보다 치는 게 빠르다. 메뉴에 없으면 ⌘K 팔레트로 이어준다.
          관리자는 왼쪽에 메뉴/관리 탭(searchLeading)이 붙는다 — 관리 탭도 같은 자리에 같은 줄이라 전환해도 안 흔들린다 */}
      <div className="flex items-center gap-3">
        {searchLeading}
        <label className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl px-3.5 h-[calc(46px*var(--mm,1))] bg-surface-high border border-transparent focus-within:border-brand transition-colors">
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
      </div>

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
                  pin={pinOf(item.path)}
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
          {/* 자주 찾는 — 내가 고른 메뉴. 처음엔 예배·성경·일정(누구나 가장 먼저 찾는다) */}
          <div className="min-w-0">
            <h3 className="px-1 pb-2.5 text-[length:calc(14.5px*var(--mm,1))] font-bold text-brand">
              {t('navMenuFeatured')}
            </h3>
            {featuredItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {featuredItems.map(item => (
                  <FeaturedCard
                    key={item.path}
                    item={item}
                    label={t(item.labelKey)}
                    desc={t(item.descKey)}
                    compact={featuredItems.length > 3}
                    onUnpin={() => togglePin(item.path)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-5 text-[length:calc(13.5px*var(--mm,1))] leading-relaxed text-ink-muted break-keep">
                {t('navMenuPinEmpty')}
              </p>
            )}
            {/* 바꿀 수 있다는 걸 모르면 기본 3장만 보고 지나간다 — 카드 아래 한 줄로만 알린다 */}
            {featuredItems.length > 0 && (
              <p className="mt-2.5 px-1 flex items-center gap-1 text-[length:calc(12.5px*var(--mm,1))] text-ink-muted">
                <span className="text-[var(--amber-icon)]"><IconStar filled={false} /></span>
                {t('navMenuPinHint')}
              </p>
            )}
          </div>

          {/* 4칸 목록 — 제목은 진하게 + 밑줄로 칸이 한 묶음으로 읽히게 */}
          <nav className="grid grid-cols-4 gap-x-4 items-start">
            {DESKTOP_SECTIONS.map((section, si) => (
              <div key={section.titleKey} className="min-w-0">
                <h3 className="mx-3 mb-1.5 pb-2 border-b border-border-light dark:border-border-dark text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">
                  {t(section.titleKey)}
                </h3>
                <div className="flex flex-col">
                  {section.items.filter(visible).map(item => (
                    <DesktopItem
                      key={item.path}
                      item={item}
                      label={t(item.labelKey)}
                      desc={t(item.descKey)}
                      // 맨 오른쪽 칸은 말풍선을 오른쪽 끝에 맞춘다 — 메뉴 밖으로 잘리지 않게
                      tipRight={si === DESKTOP_SECTIONS.length - 1}
                      pin={pinOf(item.path)}
                    />
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
   accent=true면 칩 배경·아이콘이 브랜드 블루로 바뀐다(신앙 액티비티).
   pin 을 넘기면 편집 중 — 링크 대신 버튼이 되어 탭 한 번에 자주 찾는 메뉴로 넣고 뺀다. */
const LauncherItem = ({
  item,
  label,
  accent = false,
  pin,
}: {
  item: NavEntry
  label: string
  accent?: boolean
  pin?: PinProps
}) => {
  const { t } = useLanguage()
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  const cell = `
    group relative flex flex-col items-center gap-1.5
    rounded-2xl px-1 py-2.5
    transition-colors duration-150
    hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]
  `
  const body = (
    <>
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
    </>
  )

  if (pin) {
    const disabled = !pin.pinned && pin.full
    return (
      <button
        type="button"
        onClick={pin.onToggle}
        disabled={disabled}
        aria-pressed={pin.pinned}
        aria-label={`${label} — ${t(pin.pinned ? 'navMenuPinRemove' : disabled ? 'navMenuPinFull' : 'navMenuPinAdd')}`}
        className={`${cell} disabled:opacity-40`}
      >
        {body}
        {/* 아이콘 칩 오른쪽 위 모서리 — 고른 건 노란 ★, 아닌 건 빈 ☆ */}
        <span className={`absolute top-1 right-[calc(50%-30px)] flex items-center justify-center w-[22px] h-[22px] rounded-full bg-background-light dark:bg-card-dark shadow-sm ${
          pin.pinned ? 'text-[var(--amber-icon)]' : 'text-ink-muted'
        }`}>
          <IconStar filled={pin.pinned} />
        </span>
      </button>
    )
  }

  return (
    <Link to={item.path} {...warmOnTouch(item.path)} className={cell}>
      {body}
    </Link>
  )
}

/* 모바일 런처 — 맨 위 "자주 찾는" 줄 + 기존 묶음. 터치엔 호버가 없어 ☆ 을 늘 띄우면 런처가 지저분해진다
   → 제목 옆 [편집]을 눌렀을 때만 모든 칸에 ☆ 이 붙고, 탭이 이동 대신 넣기/빼기가 된다 */
const MobileLauncher = ({ visible }: { visible: (item: NavEntry) => boolean }) => {
  const { t } = useLanguage()
  const { featuredItems, pinOf } = useFeatured(visible)
  const [editing, setEditing] = useState(false)
  const pinFor = (item: NavEntry) => (editing ? pinOf(item.path) : undefined)

  const activityItems = ACTIVITY_ITEMS.filter(visible)
  return (
    <nav className="p-3 space-y-5">
      <div>
        <div className="flex items-center justify-between pr-1">
          <h3 className="px-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand">
            {t('navMenuFeatured')}
          </h3>
          <button
            type="button"
            onClick={() => setEditing(e => !e)}
            aria-pressed={editing}
            className={`-mt-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
              editing ? 'bg-brand text-white' : 'text-ink-muted active:bg-surface-high'
            }`}
          >
            {t(editing ? 'navMenuEditDone' : 'navMenuEdit')}
          </button>
        </div>
        {editing && (
          <p className="px-1.5 pb-2 text-[12px] text-ink-muted break-keep">{t('navMenuPinHintMobile')}</p>
        )}
        {featuredItems.length > 0 ? (
          <div className="grid grid-cols-4 gap-0.5">
            {featuredItems.map(item => (
              <LauncherItem key={item.path} item={item} label={t(item.labelKey)} accent pin={pinFor(item)} />
            ))}
          </div>
        ) : (
          <p className="mx-1 rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-4 text-[12.5px] leading-relaxed text-ink-muted break-keep">
            {t('navMenuPinEmptyMobile')}
          </p>
        )}
      </div>

      {MENU_SECTIONS.map(section => (
        <div key={section.titleKey}>
          <SectionTitle>{t(section.titleKey)}</SectionTitle>
          <div className="grid grid-cols-4 gap-0.5">
            {section.items.map(item => (
              <LauncherItem key={item.path} item={item} label={t(item.labelKey)} pin={pinFor(item)} />
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
            <LauncherItem key={item.path} item={item} label={t(item.labelKey)} accent pin={pinFor(item)} />
          ))}
        </div>
      </div>
    </nav>
  )
}

// isDesktop: PC 그리드와 모바일 런처를 둘 다 그리고 CSS 로 한쪽만 숨기면 Link·아이콘이 두 벌씩
// 만들어진다 — 메뉴가 열리는 프레임에 청크 프리로드까지 같이 도는 시점이라 한쪽만 그린다.
const NavigationMenu = ({ isDesktop, searchLeading }: { isDesktop: boolean; searchLeading?: ReactNode }) => {
  // 누군가의 기도는 운영자가 연 뒤에만 메뉴에 보인다 (그 전엔 광고 전 기능)
  const { data: intercession } = useIntercessionSummary()
  const visible = (item: NavEntry) => item.path !== '/intercession' || !!intercession?.open

  if (isDesktop) return <DesktopMegaMenu visible={visible} searchLeading={searchLeading} />
  /* 모바일: 섹션 세로 스택 + 4열 아이콘 그리드 (런처) */
  return <MobileLauncher visible={visible} />
}

export default NavigationMenu
