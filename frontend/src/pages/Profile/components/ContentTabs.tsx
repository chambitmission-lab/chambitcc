import type { ProfileTab } from '../../../types/profile'

interface ContentTabsProps {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  counts: {
    prayers: number
    praying: number
    replies: number
  }
}

const ContentTabs = ({ activeTab, onTabChange, counts }: ContentTabsProps) => {
  return (
    <div className="flex gap-2 px-4 pb-4 border-b border-border-light dark:border-border-dark">
      <button
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
          activeTab === 'prayers'
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30'
            : 'bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('prayers')}
      >
        <span className="text-xl">📝</span>
        <span className="text-xs font-bold">내 기도</span>
        <span className={`text-xs font-bold ${activeTab === 'prayers' ? 'text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.prayers}
        </span>
      </button>
      
      <button
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
          activeTab === 'praying'
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30'
            : 'bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('praying')}
      >
        <span className="text-xl">🙏</span>
        <span className="text-xs font-bold">기도중</span>
        <span className={`text-xs font-bold ${activeTab === 'praying' ? 'text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.praying}
        </span>
      </button>
      
      <button
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
          activeTab === 'replies'
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30'
            : 'bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('replies')}
      >
        <span className="text-xl">💬</span>
        <span className="text-xs font-bold">댓글</span>
        <span className={`text-xs font-bold ${activeTab === 'replies' ? 'text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.replies}
        </span>
      </button>
    </div>
  )
}

export default ContentTabs
