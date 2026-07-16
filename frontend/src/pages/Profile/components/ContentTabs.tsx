import { useLanguage } from '../../../contexts/LanguageContext'
import type { ProfileTab } from '../../../types/profile'
import {
  PenLineIcon,
  HandHeartIcon,
  CommentIcon,
  BookOpenIcon,
} from '../../../components/icons/ActionIcons'

interface ContentTabsProps {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  counts: {
    prayers: number
    praying: number
    replies: number
    notes: number
  }
}

const ContentTabs = ({ activeTab, onTabChange, counts }: ContentTabsProps) => {
  const { t } = useLanguage()

  const tabs = [
    { key: 'prayers', Icon: PenLineIcon, labelKey: 'myPrayers', count: counts.prayers },
    { key: 'praying', Icon: HandHeartIcon, labelKey: 'prayingFor', count: counts.praying },
    { key: 'replies', Icon: CommentIcon, labelKey: 'myReplies', count: counts.replies },
    { key: 'notes', Icon: BookOpenIcon, labelKey: 'meditationNotes', count: counts.notes },
  ] as const

  return (
    <div className="flex gap-1.5 px-4 pb-3 mt-1 border-b border-border-light dark:border-border-dark">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-t-xl
              transition-all relative
              ${isActive
                ? 'bg-white/70 dark:bg-card-dark/80'
                : 'bg-transparent text-gray-500 dark:text-white/55 hover:bg-gray-100/60 dark:hover:bg-white/[0.03]'
              }
            `}
          >
            <tab.Icon
              size={20}
              className={isActive ? 'text-brand' : undefined}
            />
            <span
              className={`text-[11px] font-semibold tracking-[-0.01em] ${
                isActive ? 'text-gray-900 dark:text-white' : ''
              }`}
            >
              {t(tab.labelKey)}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'
              }`}
            >
              {tab.count}
            </span>
            {isActive && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand rounded-full shadow-[0_0_10px_var(--brand-glow)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand rounded-full blur-sm" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ContentTabs
