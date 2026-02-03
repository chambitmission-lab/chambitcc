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
    <div className="content-tabs">
      <button
        className={`tab-button ${activeTab === 'prayers' ? 'active' : ''}`}
        onClick={() => onTabChange('prayers')}
      >
        <span className="tab-icon">📝</span>
        <span className="tab-text">내가 작성한 기도</span>
        <span className="tab-count">{counts.prayers}</span>
      </button>
      
      <button
        className={`tab-button ${activeTab === 'praying' ? 'active' : ''}`}
        onClick={() => onTabChange('praying')}
      >
        <span className="tab-icon">🙏</span>
        <span className="tab-text">내가 기도중</span>
        <span className="tab-count">{counts.praying}</span>
      </button>
      
      <button
        className={`tab-button ${activeTab === 'replies' ? 'active' : ''}`}
        onClick={() => onTabChange('replies')}
      >
        <span className="tab-icon">💬</span>
        <span className="tab-text">내 댓글</span>
        <span className="tab-count">{counts.replies}</span>
      </button>
    </div>
  )
}

export default ContentTabs
