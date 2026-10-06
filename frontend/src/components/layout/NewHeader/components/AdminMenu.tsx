import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { fetchAdminMenuStatus, type AdminMenuBadge } from '../../../../api/admin'
import { sessionStore } from '../../../../utils/tokenStore'
import { ADMIN_ICONS, IconChevron, IconShield, type AdminIconKey } from './AdminIcons'
import { Svg } from './NavIcons'

type TranslationKey = keyof Translation

type AdminGroupKey =
  | 'adminGroupInsight' | 'adminGroupContent' | 'adminGroupComm'
  | 'adminGroupOps' | 'adminGroupMembers'

interface AdminItem {
  path: string
  key: AdminIconKey
}

interface AdminGroup {
  titleKey: AdminGroupKey
  items: AdminItem[]
}

// 업무 성격별로 묶어 스캔·탐색 시간을 줄인다
const ADMIN_GROUPS: AdminGroup[] = [
  {
    titleKey: 'adminGroupInsight',
    items: [
      { path: '/admin', key: 'adminNavDashboard' },
      { path: '/admin/care', key: 'adminNavCare' },
      { path: '/admin/bible-engagement', key: 'adminNavEngagement' }
    ]
  },
  {
    titleKey: 'adminGroupContent',
    items: [
      { path: '/welcome', key: 'adminNavLanding' },
      { path: '/admin/pastors', key: 'adminNavPastor' },
      { path: '/admin/people', key: 'adminNavPeople' },
      { path: '/admin/education', key: 'adminNavEducation' },
      { path: '/admin/news', key: 'adminNavNews' },
      { path: '/admin/daily-verse', key: 'adminNavVerse' },
      { path: '/admin/bulletins', key: 'adminNavBulletin' },
      { path: '/admin/offering', key: 'adminNavOffering' },
      { path: '/admin/weekly-prayers', key: 'adminNavWeeklyPrayer' },
      { path: '/admin/new-family', key: 'adminNavNewFamily' },
      { path: '/admin/event-albums', key: 'adminNavEventAlbum' },
      { path: '/admin/bible-plans', key: 'adminNavPlan' },
      { path: '/admin/bible-commentaries', key: 'adminNavCommentary' },
      { path: '/admin/situations', key: 'adminNavSituation' }
    ]
  },
  {
    titleKey: 'adminGroupComm',
    items: [
      { path: '/admin/notifications', key: 'adminNavNotice' },
      { path: '/admin/push', key: 'adminNavPush' },
      { path: '/admin/chatbot', key: 'adminNavChatbot' },
      { path: '/admin/surveys', key: 'adminNavSurvey' },
      { path: '/admin/intercession', key: 'adminNavIntercession' }
    ]
  },
  {
    titleKey: 'adminGroupOps',
    items: [
      { path: '/admin/events', key: 'adminNavEvent' },
      { path: '/admin/seats', key: 'adminNavSeats' },
      { path: '/admin/elections', key: 'adminNavElections' },
      { path: '/admin/culture', key: 'adminNavCulture' },
      { path: '/admin/organization', key: 'adminNavOrganization' }
    ]
  },
  {
    titleKey: 'adminGroupMembers',
    items: [
      { path: '/admin/users', key: 'adminNavUser' },
      { path: '/admin/groups', key: 'adminNavGroup' }
    ]
  }
]

const ALL_ITEMS = ADMIN_GROUPS.flatMap(g => g.items)
const TOTAL_ITEMS = ALL_ITEMS.length

/* 16개 도구를 매번 훑지 않도록 최근에 연 4개를 맨 위에 올려둔다 */
const RECENT_KEY = 'adminMenu:recent'
const OPEN_KEY = 'adminMenu:open'
const RECENT_MAX = 4

const readRecent = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((p): p is string => typeof p === 'string')
      .filter(p => ALL_ITEMS.some(i => i.path === p))
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

const pushRecent = (path: string) => {
  try {
    const next = [path, ...readRecent().filter(p => p !== path)].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* 저장 실패는 메뉴 동작에 영향 없음 */
  }
}

const SectionTitle = ({ children }: { children: string }) => (
  <h4 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted lg:px-3 lg:normal-case lg:tracking-normal lg:text-[length:calc(13.5px*var(--mm,1))] lg:font-bold">
    {children}
  </h4>
)

/* 전체 메뉴와 같은 런처 셀 — 상자를 없애고 아이콘이 위계를 만든다.
   accent=true면 브랜드 블루로 강조한다(최근 사용·현황 진입점). */
const AdminLauncherItem = ({
  item,
  label,
  accent = false,
}: {
  item: AdminItem
  label: string
  accent?: boolean
}) => {
  const Icon = ADMIN_ICONS[item.key]
  return (
    <Link
      to={item.path}
      onClick={() => pushRecent(item.path)}
      className="
        group flex flex-col items-center gap-1.5
        rounded-2xl px-1 py-2.5
        transition-colors duration-150
        hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)]
        lg:flex-row lg:gap-3 lg:px-3 lg:py-2 lg:rounded-xl
      "
    >
      <span
        className={`
          flex items-center justify-center w-11 h-11 rounded-2xl shrink-0
          transition-colors duration-150
          lg:w-[calc(38px*var(--mm,1))] lg:h-[calc(38px*var(--mm,1))] lg:rounded-xl
          ${accent
            ? 'bg-[var(--brand-soft)] text-brand group-hover:bg-[var(--brand-soft-strong)]'
            : 'bg-surface-high text-ink group-hover:text-brand'}
        `}
      >
        <Icon />
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-center text-ink lg:text-left lg:text-[length:calc(15px*var(--mm,1))] lg:truncate lg:group-hover:text-brand">
        {label}
      </span>
    </Link>
  )
}

// ── PC 관리 도구 패널 ──────────────────────────────────────
// 빠른 작업(등록 창 바로 열기) + 개인 즐겨찾기 + 이름만 있는 6칸 목록 + 할 일 배지.
// 예전 5열 아이콘 칩 격자는 29개가 같은 무게라 한눈에 안 들어왔고, '최근 사용'은 매번 순서가
// 바뀌어 손이 위치를 못 외웠다 → 직접 고정하는 즐겨찾기로 바꿨다. 모바일 런처는 그대로다.

/* 목록 화면을 거치지 않고 등록 창까지 — 관리 화면이 ?new=1 을 받아 composer 를 연다
   (hooks/useOpenComposerFromUrl). 푸시는 화면 자체가 작성 폼이라 파라미터가 없다 */
const QUICK_ACTIONS: Array<{ to: string; badgeKey: string; labelKey: TranslationKey; icon: AdminIconKey; descKey: TranslationKey }> = [
  { to: '/admin/bulletins?new=1', badgeKey: '/admin/bulletins', labelKey: 'adminQuickBulletin', icon: 'adminNavBulletin', descKey: 'adminNavBulletinDesc' },
  { to: '/admin/weekly-prayers?new=1', badgeKey: '/admin/weekly-prayers', labelKey: 'adminQuickWeeklyPrayer', icon: 'adminNavWeeklyPrayer', descKey: 'adminNavWeeklyPrayerDesc' },
  { to: '/admin/push', badgeKey: '/admin/push', labelKey: 'adminQuickPush', icon: 'adminNavPush', descKey: 'adminNavPushDesc' },
  { to: '/admin/events?new=1', badgeKey: '/admin/events', labelKey: 'adminQuickEvent', icon: 'adminNavEvent', descKey: 'adminNavEventDesc' },
  { to: '/admin/event-albums?new=1', badgeKey: '/admin/event-albums', labelKey: 'adminQuickAlbum', icon: 'adminNavEventAlbum', descKey: 'adminNavEventAlbumDesc' },
  { to: '/admin/notifications?new=1', badgeKey: '/admin/notifications', labelKey: 'adminQuickNotice', icon: 'adminNavNotice', descKey: 'adminNavNoticeDesc' },
]

/* 즐겨찾기는 계정별 — 같은 PC 를 여러 관리자가 써도 섞이지 않게 username 을 키에 넣는다 */
const favoritesKey = () => `adminMenu:favorites:${sessionStore.get('username') ?? ''}`

const readFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(favoritesKey())
    // 처음 쓰는 관리자는 '최근 사용' 기록으로 채워 준다 — 빈 줄로 시작하지 않게
    if (raw === null) return readRecent()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((p): p is string => ALL_ITEMS.some(i => i.path === p)) : []
  } catch {
    return []
  }
}

const writeFavorites = (paths: string[]) => {
  try {
    localStorage.setItem(favoritesKey(), JSON.stringify(paths))
  } catch {
    /* 저장 실패해도 이번 세션 동안은 동작한다 */
  }
}

// 관리자 홈 액션 카드와 같은 등급·색 (AdminDashboard.tsx TONE_*)
const BADGE_TONE: Record<AdminMenuBadge['tone'], string> = {
  urgent: 'bg-[var(--amber-soft)] text-[var(--amber)]',
  warn: 'bg-[var(--brand-soft)] text-brand',
  info: 'bg-surface-high text-ink-muted',
}

const DOT_TONE: Record<AdminMenuBadge['tone'], string> = {
  urgent: 'bg-[var(--amber)]',
  warn: 'bg-brand',
  info: 'bg-ink-muted',
}

/* 좁은 목록 행에선 숫자만 글자로 — '미등록' 같은 말은 점으로 줄여 이름이 잘리지 않게 한다
   (전체 문구는 빠른 작업 카드·말풍선이 보여 준다) */
const Badge = ({ badge, full = false }: { badge: AdminMenuBadge; full?: boolean }) =>
  !full && !/^\d+$/.test(badge.short) ? (
    <span aria-label={badge.text} className={`shrink-0 w-[7px] h-[7px] rounded-full ${DOT_TONE[badge.tone]}`} />
  ) : (
    <span className={`shrink-0 rounded-full px-1.5 py-px text-[length:calc(11.5px*var(--mm,1))] font-bold leading-tight whitespace-nowrap ${BADGE_TONE[badge.tone]}`}>
      {full ? badge.text : badge.short}
    </span>
  )

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
  </svg>
)

const IconSearch = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
)

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, '')

/* 목록 행 — 단색 아이콘 + 이름 + (할 일 배지) + ☆. 설명은 호버 0.3초 뒤 말풍선.
   ☆ 은 링크 안에 넣지 않는다(a 안의 button 은 무효 HTML) — 형제로 겹쳐 둔다 */
const ToolRow = ({
  item, label, desc, badge, pinned, onTogglePin, tipRight = false,
}: {
  item: AdminItem; label: string; desc: string; badge?: AdminMenuBadge; pinned: boolean; onTogglePin: () => void
  /** 맨 오른쪽 칸 — 말풍선을 오른쪽 끝에 맞춰 메뉴 밖으로 잘리지 않게 */
  tipRight?: boolean
}) => {
  const { t } = useLanguage()
  const Icon = ADMIN_ICONS[item.key]
  return (
    <div className="group relative">
      <Link
        to={item.path}
        onClick={() => pushRecent(item.path)}
        className={`flex items-center gap-2.5 rounded-lg pl-2.5 py-2 transition-colors duration-150 hover:bg-[var(--brand-soft)] focus-visible:bg-[var(--brand-soft)] outline-none ${
          pinned ? 'pr-8' : 'pr-2.5 group-hover:pr-8 group-focus-within:pr-8'
        }`}
      >
        <span className="shrink-0 text-ink-muted group-hover:text-brand transition-colors [&_svg]:w-[calc(18px*var(--mm,1))] [&_svg]:h-[calc(18px*var(--mm,1))]">
          <Icon />
        </span>
        <span className="min-w-0 truncate text-[length:calc(15px*var(--mm,1))] font-medium leading-tight text-ink-strong group-hover:text-brand transition-colors">
          {label}
        </span>
        {badge && <Badge badge={badge} />}
      </Link>
      <button
        type="button"
        onClick={onTogglePin}
        aria-pressed={pinned}
        aria-label={t(pinned ? 'adminFavoriteRemove' : 'adminFavoriteAdd')}
        title={t(pinned ? 'adminFavoriteRemove' : 'adminFavoriteAdd')}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-opacity ${
          pinned
            ? 'text-[var(--amber-icon)] opacity-100'
            : 'text-ink-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--amber-icon)]'
        }`}
      >
        <IconStar filled={pinned} />
      </button>
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute top-full z-10 mt-0.5 ${tipRight ? 'right-2' : 'left-2'}
          rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap
          bg-gray-900 text-white dark:bg-white dark:text-gray-900
          text-[length:calc(12.5px*var(--mm,1))] leading-snug
          opacity-0 translate-y-0.5 transition duration-150
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-300
        `}
      >
        {desc}{badge ? ` · ${badge.text}` : ''}
      </span>
    </div>
  )
}

const AdminDesktopPanel = () => {
  const { t } = useLanguage()
  const [favorites, setFavorites] = useState(readFavorites)
  const [query, setQuery] = useState('')
  // 배지는 메뉴를 열 때마다 새로 — 주보를 올리고 돌아오면 '미등록'이 바로 사라져야 한다.
  // persist 제외(main.tsx) — 복원된 옛 배지가 먼저 떴다가 바뀌면 오히려 헷갈린다
  const { data: status } = useQuery({
    queryKey: ['adminMenuStatus'],
    queryFn: fetchAdminMenuStatus,
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
  const badges = status?.badges ?? {}

  const togglePin = (path: string) => {
    setFavorites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
      writeFavorites(next)
      return next
    })
  }

  const q = norm(query)
  const desc = (item: AdminItem) => t(`${item.key}Desc` as TranslationKey)
  const hits = q
    ? ADMIN_GROUPS.flatMap(g => g.items.filter(item =>
      norm(t(item.key) + desc(item) + t(g.titleKey)).includes(q)))
    : []
  const row = (item: AdminItem, tipRight = false) => (
    <ToolRow
      key={item.path}
      item={item}
      label={t(item.key)}
      desc={desc(item)}
      badge={badges[item.path]}
      pinned={favorites.includes(item.path)}
      onTogglePin={() => togglePin(item.path)}
      tipRight={tipRight}
    />
  )
  const favoriteItems = favorites
    .map(path => ALL_ITEMS.find(i => i.path === path))
    .filter((i): i is AdminItem => !!i)

  return (
    <div className="mx-5 mb-5 pt-4 border-t border-border-light dark:border-border-dark animate-pop-in">
      <label className="flex items-center gap-2.5 rounded-xl px-3.5 h-[calc(44px*var(--mm,1))] bg-surface-high border border-transparent focus-within:border-brand transition-colors">
        <IconSearch className="w-[calc(18px*var(--mm,1))] h-[calc(18px*var(--mm,1))] text-ink-muted shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape' && query) setQuery('') }}
          placeholder={t('adminSearchPlaceholder')}
          aria-label={t('adminSearchPlaceholder')}
          className="flex-1 min-w-0 bg-transparent outline-none text-[length:calc(15px*var(--mm,1))] text-ink-strong placeholder:text-ink-muted"
        />
      </label>

      {q ? (
        <div className="mt-3 min-h-[calc(160px*var(--mm,1))]">
          {hits.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-4">{hits.map((item, i) => row(item, i % 4 === 3))}</div>
          ) : (
            <p className="py-10 text-center text-[length:calc(15px*var(--mm,1))] text-ink-muted">
              “{query.trim()}” — {t('adminSearchEmpty')}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* 빠른 작업 — 매주 하는 등록 일을 한 번에. 할 일 배지가 있으면 설명 대신 배지를 보인다 */}
          <h4 className="mt-5 mb-2.5 px-1 text-[length:calc(14.5px*var(--mm,1))] font-bold text-brand">{t('adminQuickTitle')}</h4>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_ACTIONS.map(action => {
              const Icon = ADMIN_ICONS[action.icon]
              const badge = badges[action.badgeKey]
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex flex-col items-start gap-2.5 rounded-2xl p-3.5 bg-[var(--brand-soft)] transition-colors hover:bg-[var(--brand-soft-strong)]"
                >
                  <span className="flex items-center justify-center w-[calc(36px*var(--mm,1))] h-[calc(36px*var(--mm,1))] rounded-xl bg-background-light dark:bg-background-dark text-brand [&_svg]:w-[calc(19px*var(--mm,1))] [&_svg]:h-[calc(19px*var(--mm,1))]">
                    <Icon />
                  </span>
                  <span className="min-w-0 w-full">
                    <span className="block text-[length:calc(15px*var(--mm,1))] font-bold leading-tight text-ink-strong group-hover:text-brand transition-colors truncate">
                      {t(action.labelKey)}
                    </span>
                    <span className="block mt-1 min-h-[1.25em]">
                      {badge ? (
                        <Badge badge={badge} full />
                      ) : (
                        <span className="block text-[length:calc(12.5px*var(--mm,1))] leading-snug text-ink-muted truncate">{t(action.descKey)}</span>
                      )}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>

          {/* 즐겨찾기 — 내가 고른 도구만. 순서는 고정한 순서 그대로(손이 위치를 외우게) */}
          <h4 className="mt-5 mb-2 px-1 text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong"><span className="text-[var(--amber-icon)]">★</span> {t('adminFavorites')}</h4>
          {favoriteItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {favoriteItems.map(item => {
                const Icon = ADMIN_ICONS[item.key]
                const badge = badges[item.path]
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => pushRecent(item.path)}
                    className="group inline-flex items-center gap-2 rounded-xl pl-3 pr-3.5 py-2 bg-surface-high transition-colors hover:bg-[var(--brand-soft)] [&_svg]:w-[calc(17px*var(--mm,1))] [&_svg]:h-[calc(17px*var(--mm,1))]"
                  >
                    <span className="text-ink-muted group-hover:text-brand transition-colors"><Icon /></span>
                    <span className="text-[length:calc(15px*var(--mm,1))] font-semibold text-ink-strong group-hover:text-brand transition-colors">{t(item.key)}</span>
                    {badge && <Badge badge={badge} />}
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="px-1 text-[length:calc(13.5px*var(--mm,1))] text-ink-muted">{t('adminFavoritesEmpty')}</p>
          )}

          {/* 전체 — 제목 진하게+밑줄. 14개짜리 말씀·콘텐츠는 두 줄로 펴고 폭도 그만큼 더 준다
              ("비로그인 홈(랜딩) 편집" 같은 긴 이름이 잘리지 않게 — 짧은 칸은 좁게) */}
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-x-4 items-start">
            {ADMIN_GROUPS.map((group, gi) => {
              const wide = group.items.length > 8
              const last = gi === ADMIN_GROUPS.length - 1
              return (
                <div key={group.titleKey} className="min-w-0">
                  <h4 className="mx-2.5 mb-1.5 pb-2 flex items-baseline justify-between border-b border-border-light dark:border-border-dark text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">
                    {t(group.titleKey)}
                    <span className="text-[length:calc(12.5px*var(--mm,1))] font-medium text-ink-muted">{group.items.length}</span>
                  </h4>
                  <div className={wide ? 'grid grid-cols-2 gap-x-2' : ''}>{group.items.map(item => row(item, last))}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * panelOnly — PC 전체 메뉴용. 큰 파란 토글 카드 없이 도구 목록만 그린다(열고 닫기는 MobileMenu 푸터 링크가
 * 같은 OPEN_KEY 로 한다 — 이 파일은 lazy 청크라 상수를 import 하지 않고 키 문자열을 양쪽에 둔다).
 * 관리 도구는 보조 영역이라 본 메뉴보다 먼저 눈에 띄면 안 된다.
 */
const AdminMenu = ({ panelOnly = false }: { panelOnly?: boolean }) => {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(OPEN_KEY) === '1')
  const [recent] = useState(readRecent)

  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, next ? '1' : '0')
    } catch {
      /* 저장 실패해도 이번 세션 토글은 동작한다 */
    }
  }

  // 최근 항목이 하나뿐이면 줄만 늘어나므로 2개부터 노출한다
  const recentItems = recent.length >= 2
    ? recent.map(path => ALL_ITEMS.find(i => i.path === path)!).slice(0, RECENT_MAX)
    : []

  const panel = (
    <div className="mt-2 space-y-4 animate-pop-in">
      {recentItems.length > 0 && (
        <div>
          <SectionTitle>{t('adminGroupRecent')}</SectionTitle>
          <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-5 lg:gap-1">
            {recentItems.map(item => (
              <AdminLauncherItem key={`recent-${item.path}`} item={item} label={t(item.key)} accent />
            ))}
          </div>
        </div>
      )}

      {ADMIN_GROUPS.map(group => (
        <div key={group.titleKey}>
          <SectionTitle>{t(group.titleKey)}</SectionTitle>
          <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-5 lg:gap-1">
            {group.items.map(item => (
              <AdminLauncherItem key={item.path} item={item} label={t(item.key)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (panelOnly) return <AdminDesktopPanel />

  return (
    <div className="px-3 pt-3 pb-2 lg:px-5">
      {/* 섹션 토글 — 관리 권한임을 방패 아이콘으로 알린다 */}
      <button
        type="button"
        onClick={toggle}
        className="
          w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl
          bg-[var(--brand-soft)]
          transition-colors duration-150
          hover:bg-[var(--brand-soft-strong)]
        "
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--brand-soft-strong)] text-brand shrink-0">
          <IconShield className="w-5 h-5" />
        </span>
        <span className="flex flex-col items-start min-w-0">
          <span className="text-[13.5px] lg:text-[length:calc(16px*var(--mm,1))] font-semibold text-ink-strong tracking-[-0.01em]">
            {t('adminMenu')}
          </span>
          <span className="text-[11px] lg:text-[length:calc(13px*var(--mm,1))] lg:mt-0.5 text-ink-muted leading-tight">
            {TOTAL_ITEMS}{t('adminMenuHint')}
          </span>
        </span>
        <IconChevron
          className={`ml-auto w-[18px] h-[18px] text-ink-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && panel}

      <div className="border-t border-border-light dark:border-border-dark mt-3"></div>
    </div>
  )
}

export default AdminMenu
