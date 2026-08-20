import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { ADMIN_ICONS, IconChevron, IconShield, type AdminIconKey } from './AdminIcons'

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
      { path: '/admin/daily-verse', key: 'adminNavVerse' },
      { path: '/admin/bulletins', key: 'adminNavBulletin' },
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
      { path: '/admin/push', key: 'adminNavPush' }
    ]
  },
  {
    titleKey: 'adminGroupOps',
    items: [
      { path: '/admin/events', key: 'adminNavEvent' },
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
  <h4 className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
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
      "
    >
      <span
        className={`
          flex items-center justify-center w-11 h-11 rounded-2xl
          transition-colors duration-150
          ${accent
            ? 'bg-[var(--brand-soft)] text-brand group-hover:bg-[var(--brand-soft-strong)]'
            : 'bg-surface-high text-ink group-hover:text-brand'}
        `}
      >
        <Icon />
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-center text-ink">
        {label}
      </span>
    </Link>
  )
}

const AdminMenu = () => {
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
          <span className="text-[13.5px] font-semibold text-ink-strong tracking-[-0.01em]">
            {t('adminMenu')}
          </span>
          <span className="text-[11px] text-ink-muted leading-tight">
            {TOTAL_ITEMS}{t('adminMenuHint')}
          </span>
        </span>
        <IconChevron
          className={`ml-auto w-[18px] h-[18px] text-ink-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-4 animate-pop-in">
          {recentItems.length > 0 && (
            <div>
              <SectionTitle>{t('adminGroupRecent')}</SectionTitle>
              <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-8">
                {recentItems.map(item => (
                  <AdminLauncherItem key={`recent-${item.path}`} item={item} label={t(item.key)} accent />
                ))}
              </div>
            </div>
          )}

          {ADMIN_GROUPS.map(group => (
            <div key={group.titleKey}>
              <SectionTitle>{t(group.titleKey)}</SectionTitle>
              <div className="grid grid-cols-4 gap-0.5 lg:grid-cols-8">
                {group.items.map(item => (
                  <AdminLauncherItem key={item.path} item={item} label={t(item.key)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border-light dark:border-border-dark mt-3"></div>
    </div>
  )
}

export default AdminMenu
