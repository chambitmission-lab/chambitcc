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
      {/* 활성 탭 아이콘의 보라→핑크 그라데이션 (SVG stroke는 bg-clip-text가 안 되므로 defs 참조) */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="profile-tab-icon-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
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
              style={isActive ? { stroke: 'url(#profile-tab-icon-grad)' } : undefined}
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
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_20px_rgba(236,72,153,0.4)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ContentTabs
