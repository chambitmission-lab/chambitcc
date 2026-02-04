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
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-t-xl transition-all relative ${
          activeTab === 'prayers'
            ? 'bg-surface-light dark:bg-surface-dark'
            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('prayers')}
      >
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          edit_note
        </span>
        <span className={`text-xs font-bold ${activeTab === 'prayers' ? 'text-gray-900 dark:text-white' : ''}`}>내 기도</span>
        <span className={`text-xs font-bold ${activeTab === 'prayers' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.prayers}
        </span>
        {activeTab === 'prayers' && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_20px_rgba(236,72,153,0.4)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm"></div>
          </>
        )}
      </button>
      
      <button
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-t-xl transition-all relative ${
          activeTab === 'praying'
            ? 'bg-surface-light dark:bg-surface-dark'
            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('praying')}
      >
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          volunteer_activism
        </span>
        <span className={`text-xs font-bold ${activeTab === 'praying' ? 'text-gray-900 dark:text-white' : ''}`}>기도중</span>
        <span className={`text-xs font-bold ${activeTab === 'praying' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.praying}
        </span>
        {activeTab === 'praying' && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_20px_rgba(236,72,153,0.4)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm"></div>
          </>
        )}
      </button>
      
      <button
        className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-t-xl transition-all relative ${
          activeTab === 'replies'
            ? 'bg-surface-light dark:bg-surface-dark'
            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('replies')}
      >
        <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
          chat_bubble
        </span>
        <span className={`text-xs font-bold ${activeTab === 'replies' ? 'text-gray-900 dark:text-white' : ''}`}>댓글</span>
        <span className={`text-xs font-bold ${activeTab === 'replies' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
          {counts.replies}
        </span>
        {activeTab === 'replies' && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_20px_rgba(236,72,153,0.4)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm"></div>
          </>
        )}
      </button>
    </div>
  )
}

export default ContentTabs
