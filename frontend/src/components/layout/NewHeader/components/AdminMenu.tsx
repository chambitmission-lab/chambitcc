import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

type AdminItemKey =
  | 'notificationManagement' | 'dailyVerseManagement' | 'bulletinManagement'
  | 'eventManagement' | 'biblePlanManagement' | 'bibleCommentaryManagement'
  | 'situationManagement' | 'cultureManagement' | 'pushNotificationManagement'
  | 'userManagement' | 'groupManagement'

type AdminGroupKey =
  | 'adminGroupContent' | 'adminGroupComm' | 'adminGroupOps' | 'adminGroupMembers'

interface AdminItem {
  path: string
  key: AdminItemKey
}

interface AdminGroup {
  titleKey: AdminGroupKey
  items: AdminItem[]
}

// 업무 성격별로 묶어 스캔·탐색 시간을 줄인다
const ADMIN_GROUPS: AdminGroup[] = [
  {
    titleKey: 'adminGroupContent',
    items: [
      { path: '/admin/daily-verse', key: 'dailyVerseManagement' },
      { path: '/admin/bulletins', key: 'bulletinManagement' },
      { path: '/admin/bible-plans', key: 'biblePlanManagement' },
      { path: '/admin/bible-commentaries', key: 'bibleCommentaryManagement' },
      { path: '/admin/situations', key: 'situationManagement' }
    ]
  },
  {
    titleKey: 'adminGroupComm',
    items: [
      { path: '/admin/notifications', key: 'notificationManagement' },
      { path: '/admin/push', key: 'pushNotificationManagement' }
    ]
  },
  {
    titleKey: 'adminGroupOps',
    items: [
      { path: '/admin/events', key: 'eventManagement' },
      { path: '/admin/culture', key: 'cultureManagement' }
    ]
  },
  {
    titleKey: 'adminGroupMembers',
    items: [
      { path: '/admin/users', key: 'userManagement' },
      { path: '/admin/groups', key: 'groupManagement' }
    ]
  }
]

const TOTAL_ITEMS = ADMIN_GROUPS.reduce((n, g) => n + g.items.length, 0)

const AdminMenu = () => {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="px-3 pb-2">
      {/* 섹션 토글 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl
          bg-purple-50/70 dark:bg-purple-500/[0.08]
          border border-purple-300/40 dark:border-purple-400/20
          hover:bg-purple-50 dark:hover:bg-purple-500/15
          hover:border-purple-400/50 dark:hover:border-purple-400/35
          transition-all
        "
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold tracking-[0.08em] px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            ADMIN
          </span>
          <span className="text-[13.5px] font-semibold text-gray-900 dark:text-white tracking-[-0.01em]">
            {t('adminMenu')}
          </span>
          <span className="text-[12px] font-semibold text-purple-600/70 dark:text-purple-300/65">
            ({TOTAL_ITEMS})
          </span>
        </div>
        <span
          className={`material-icons-outlined text-[20px] text-gray-500 dark:text-white/55 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* 그룹별 2열 아이콘 카드 */}
      {isOpen && (
        <div className="mt-3 space-y-4">
          {ADMIN_GROUPS.map(group => (
            <div key={group.titleKey}>
              <h4 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-purple-600/70 dark:text-purple-300/55">
                {t(group.titleKey)}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map(item => {
                  const label = t(item.key)
                  const [icon, ...rest] = label.split(' ')
                  const text = rest.join(' ')
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="
                        group relative overflow-hidden flex items-center gap-2.5
                        px-3 py-3 rounded-xl min-h-[52px]
                        bg-white/80 dark:bg-card-dark
                        border border-gray-200/70 dark:border-white/[0.06]
                        shadow-sm
                        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]
                        transition-all duration-200
                        hover:-translate-y-0.5
                        hover:border-purple-400/35 dark:hover:border-purple-400/30
                        hover:shadow-[0_0_14px_rgba(168,85,247,0.15)]
                        dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(168,85,247,0.22)]
                      "
                    >
                      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-xl" />
                      <span className="relative z-10 text-[18px] leading-none shrink-0">{icon}</span>
                      <span className="relative z-10 text-[12.5px] font-semibold leading-tight text-gray-800 dark:text-white/85 tracking-[-0.01em]">
                        {text}
                      </span>
                    </Link>
                  )
                })}
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
