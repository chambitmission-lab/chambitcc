import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { fetchAdminMenuStatus, type AdminMenuBadge } from '../../../../api/admin'
import { adminKeys } from '../../../../hooks/queryKeys'
import { sessionStore } from '../../../../utils/tokenStore'
import { safeStorage } from '../../../../utils/safeStorage'
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
  const parsed = safeStorage.getJson(RECENT_KEY)
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((p): p is string => typeof p === 'string')
    .filter(p => ALL_ITEMS.some(i => i.path === p))
    .slice(0, RECENT_MAX)
}

/* 저장 실패는 메뉴 동작에 영향 없음 */
const pushRecent = (path: string) => {
  const next = [path, ...readRecent().filter(p => p !== path)].slice(0, RECENT_MAX)
  safeStorage.setJson(RECENT_KEY, next)
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
// 전체 메뉴의 관리 탭: 왼쪽 빠른 작업 목록(할 일 배지) + 오른쪽 즐겨찾기 칩 · 이름만 있는 4칸 목록.
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
  const parsed = safeStorage.getJson(favoritesKey())
  // 처음 쓰는 관리자는 '최근 사용' 기록으로 채워 준다 — 빈 줄로 시작하지 않게
  if (parsed === undefined) return readRecent()
  return Array.isArray(parsed) ? parsed.filter((p): p is string => ALL_ITEMS.some(i => i.path === p)) : []
}

/* 저장 실패해도 이번 세션 동안은 동작한다 */
const writeFavorites = (paths: string[]) => {
  safeStorage.setJson(favoritesKey(), paths)
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
  item, label, desc, badge, pinned, onTogglePin, tipRight = false, active = false,
}: {
  item: AdminItem; label: string; desc: string; badge?: AdminMenuBadge; pinned: boolean; onTogglePin: () => void
  /** 맨 오른쪽 칸 — 말풍선을 오른쪽 끝에 맞춰 메뉴 밖으로 잘리지 않게 */
  tipRight?: boolean
  /** 검색 결과에서 ↑↓ 로 고른 행 — Enter 가 여는 곳 */
  active?: boolean
}) => {
  const { t } = useLanguage()
  const Icon = ADMIN_ICONS[item.key]
  return (
    <div className="group relative">
      <Link
        to={item.path}
        onClick={() => pushRecent(item.path)}
        className={`flex items-center gap-3 rounded-lg pl-3 py-2.5 transition-colors duration-150 hover:bg-[var(--brand-soft)] focus-visible:bg-[var(--brand-soft)] outline-none ${active ? 'bg-[var(--brand-soft)]' : ''} ${
          pinned ? 'pr-8' : 'pr-3 group-hover:pr-8 group-focus-within:pr-8'
        }`}
      >
        <span className="shrink-0 text-ink-muted group-hover:text-brand transition-colors [&_svg]:w-[calc(18px*var(--mm,1))] [&_svg]:h-[calc(18px*var(--mm,1))]">
          <Icon />
        </span>
        <span className={`min-w-0 truncate text-[length:calc(15px*var(--mm,1))] leading-tight text-ink-strong group-hover:text-brand transition-colors ${badge ? 'font-bold' : 'font-medium'}`}>
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

/* 목록 묶음 — 2개짜리 회원·그룹은 현황·통계 아래에 붙여 4칸으로 줄인다(칸이 적을수록 덜 산만하고,
   그만큼 말씀·콘텐츠 두 줄 칸이 넓어져 "비로그인 홈(랜딩) 편집" 같은 긴 이름이 안 잘린다) */
const DESKTOP_COLUMNS: AdminGroup[][] = [
  [ADMIN_GROUPS[0], ADMIN_GROUPS[4]],
  [ADMIN_GROUPS[1]],
  [ADMIN_GROUPS[2]],
  [ADMIN_GROUPS[3]],
]

/* 빠른 작업 행 아이콘 — 할 일 등급 색(관리자 홈과 같은 규칙), 할 일이 없으면 브랜드 */
const ICON_TONE: Record<AdminMenuBadge['tone'], string> = {
  urgent: 'text-[var(--amber)]',
  warn: 'text-brand',
  info: 'text-ink-muted',
}

const AdminDesktopPanel = ({ leading }: { leading?: ReactNode }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState(readFavorites)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  // 메뉴를 열 때 MobileMenu 가 같은 키로 새로 받아 둔다(탭 숫자) — 탭을 오갈 때마다 다시 부르지 않게
  // 여기선 캐시를 그대로 쓴다. persist 제외(main.tsx) — 복원된 옛 배지가 먼저 뜨면 헷갈린다
  const { data: status } = useQuery({
    queryKey: adminKeys.menuStatus(),
    queryFn: fetchAdminMenuStatus,
    staleTime: 30_000,
  })
  const badges = status?.badges ?? {}
  const todoCount = Object.keys(badges).length
  const urgent = Object.values(badges).some(b => b.tone === 'urgent')

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

  // 메뉴 찾기와 같은 손버릇 — ↑↓ 로 고르고 Enter 로 연다
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown' && hits.length) {
      e.preventDefault()
      setCursor(c => (c + 1) % hits.length)
    } else if (e.key === 'ArrowUp' && hits.length) {
      e.preventDefault()
      setCursor(c => (c - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter' && hits.length) {
      e.preventDefault()
      const hit = hits[Math.min(cursor, hits.length - 1)]
      pushRecent(hit.path)
      navigate(hit.path)
    } else if (e.key === 'Escape' && query) {
      setQuery('')
    }
  }

  const row = (item: AdminItem, tipRight = false, active = false) => (
    <ToolRow
      key={item.path}
      item={item}
      label={t(item.key)}
      desc={desc(item)}
      badge={badges[item.path]}
      pinned={favorites.includes(item.path)}
      onTogglePin={() => togglePin(item.path)}
      tipRight={tipRight}
      active={active}
    />
  )
  const favoriteItems = favorites
    .map(path => ALL_ITEMS.find(i => i.path === path))
    .filter((i): i is AdminItem => !!i)

  return (
    <div className="px-7 pt-6 pb-7">
      {/* 검색 줄 — 메뉴 탭과 같은 높이·자리(탭을 바꿔도 위가 안 흔들린다) */}
      <div className="flex items-center gap-3">
        {leading}
        <label className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl px-3.5 h-[calc(46px*var(--mm,1))] bg-surface-high border border-transparent focus-within:border-brand transition-colors">
          <IconSearch className="w-[calc(19px*var(--mm,1))] h-[calc(19px*var(--mm,1))] text-ink-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            onKeyDown={onKeyDown}
            placeholder={t('adminSearchPlaceholder')}
            aria-label={t('adminSearchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent outline-none text-[length:calc(15.5px*var(--mm,1))] text-ink-strong placeholder:text-ink-muted"
          />
        </label>
      </div>

      {q ? (
        <div className="mt-3 min-h-[calc(220px*var(--mm,1))]">
          {hits.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-6">{hits.map((item, i) => row(item, i % 4 === 3, i === cursor))}</div>
          ) : (
            <p className="py-12 text-center text-[length:calc(15px*var(--mm,1))] text-ink-muted">
              “{query.trim()}” — {t('adminSearchEmpty')}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] gap-x-10 items-start">
          {/* 빠른 작업 — 매주 하는 등록 일. 파란 카드 6장 대신 회색 면 한 장 안의 목록으로.
              순서는 고정(손이 위치를 외운다), 할 일이 걸린 행만 흰 면으로 떠오른다 */}
          <aside className="rounded-2xl bg-surface-high p-3">
            <div className="flex items-baseline justify-between gap-2 px-2.5 pt-1 pb-3">
              <h4 className="whitespace-nowrap text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">{t('adminQuickTitle')}</h4>
              {/* 현황을 받기 전엔 비워 둔다 — '할 일 없음'이 먼저 떴다가 숫자로 바뀌면 헷갈린다 */}
              {status && (
                <span className={`whitespace-nowrap text-[length:calc(12.5px*var(--mm,1))] font-semibold ${
                  todoCount === 0 ? 'text-ink-muted' : urgent ? 'text-[var(--amber)]' : 'text-brand'
                }`}>
                  {todoCount > 0 ? `${t('adminTodoSummary')} ${todoCount}` : t('adminTodoDone')}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {QUICK_ACTIONS.map(action => {
                const Icon = ADMIN_ICONS[action.icon]
                const badge = badges[action.badgeKey]
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    title={t(action.descKey)}
                    className={`group flex gap-3 rounded-xl px-3 transition-colors ${
                      badge
                        ? 'items-start py-3 bg-background-light dark:bg-card-dark shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]'
                        : 'items-center py-2.5 hover:bg-background-light dark:hover:bg-card-dark'
                    } [&_svg]:w-[calc(20px*var(--mm,1))] [&_svg]:h-[calc(20px*var(--mm,1))]`}
                  >
                    <span className={`shrink-0 ${badge ? `mt-px ${ICON_TONE[badge.tone]}` : 'text-brand'}`}><Icon /></span>
                    {/* 할 일이 걸린 행은 두 줄 — 이름이 '주보 올리…'로 잘리지 않고, 무엇이 밀렸는지 문장으로 보인다 */}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[length:calc(15px*var(--mm,1))] leading-tight text-ink-strong group-hover:text-brand transition-colors ${badge ? 'font-bold' : 'font-medium'}`}>
                        {t(action.labelKey)}
                      </span>
                      {badge && (
                        <span className="mt-1.5 inline-flex"><Badge badge={badge} full /></span>
                      )}
                    </span>
                    {badge && (
                      <span aria-hidden className="shrink-0 self-center text-ink-muted group-hover:text-brand transition-colors [&_svg]:!w-4 [&_svg]:!h-4 [&_svg]:-rotate-90">
                        <IconChevron />
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </aside>

          <div className="min-w-0">
            {/* 즐겨찾기 — 내가 고른 도구만. 제목과 같은 줄에 칩으로(세로 자리를 덜 먹게) */}
            <div className="flex flex-wrap items-center gap-2.5 min-h-[calc(40px*var(--mm,1))] pb-6 border-b border-border-light dark:border-border-dark">
              <h4 className="mr-1 flex items-center gap-1 text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">
                <span className="text-[var(--amber-icon)]"><IconStar filled /></span>
                {t('adminFavorites')}
              </h4>
              {favoriteItems.length > 0 ? (
                favoriteItems.map(item => {
                  const Icon = ADMIN_ICONS[item.key]
                  const badge = badges[item.path]
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => pushRecent(item.path)}
                      className="group inline-flex items-center gap-2 rounded-full pl-3 pr-3.5 py-1.5 border border-border-light dark:border-border-dark transition-colors hover:border-brand hover:bg-[var(--brand-soft)] [&_svg]:w-[calc(17px*var(--mm,1))] [&_svg]:h-[calc(17px*var(--mm,1))]"
                    >
                      <span className="text-ink-muted group-hover:text-brand transition-colors"><Icon /></span>
                      <span className="text-[length:calc(14.5px*var(--mm,1))] font-semibold text-ink-strong group-hover:text-brand transition-colors">{t(item.key)}</span>
                      {badge && <Badge badge={badge} />}
                    </Link>
                  )
                })
              ) : (
                <p className="text-[length:calc(13.5px*var(--mm,1))] text-ink-muted">{t('adminFavoritesEmpty')}</p>
              )}
            </div>

            {/* 전체 — 제목 진하게+밑줄. 14개짜리 말씀·콘텐츠는 두 줄로 펴고 폭도 그만큼 더 준다 */}
            <div className="mt-6 grid grid-cols-[minmax(0,0.95fr)_minmax(0,2.5fr)_minmax(0,1.1fr)_minmax(0,0.95fr)] gap-x-8 items-start">
              {DESKTOP_COLUMNS.map((groups, ci) => (
                <div key={groups[0].titleKey} className="min-w-0 flex flex-col gap-7">
                  {groups.map(group => {
                    const wide = group.items.length > 8
                    return (
                      <div key={group.titleKey}>
                        <h4 className="mx-3 mb-2 pb-2.5 flex items-baseline justify-between border-b border-border-light dark:border-border-dark text-[length:calc(14.5px*var(--mm,1))] font-bold text-ink-strong">
                          {t(group.titleKey)}
                          <span className="text-[length:calc(12.5px*var(--mm,1))] font-medium text-ink-muted">{group.items.length}</span>
                        </h4>
                        <div className={wide ? 'grid grid-cols-2 gap-x-4' : ''}>
                          {group.items.map(item => row(item, ci === DESKTOP_COLUMNS.length - 1))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * panelOnly — PC 전체 메뉴의 '관리' 탭 화면. 메뉴/관리 전환은 MobileMenu 가 같은 OPEN_KEY 로 한다
 * (이 파일은 lazy 청크라 상수를 import 하지 않고 키 문자열을 양쪽에 둔다). leading = 검색창 왼쪽 탭.
 */
const AdminMenu = ({ panelOnly = false, leading }: { panelOnly?: boolean; leading?: ReactNode }) => {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(() => safeStorage.get(OPEN_KEY) === '1')
  const [recent] = useState(readRecent)

  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)
    // 저장 실패해도 이번 세션 토글은 동작한다
    safeStorage.set(OPEN_KEY, next ? '1' : '0')
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

  if (panelOnly) return <AdminDesktopPanel leading={leading} />

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
