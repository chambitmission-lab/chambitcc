import { useLanguage } from '../../../contexts/LanguageContext'

interface BibleTabsProps {
  activeTab: 'read' | 'search'
  onTabChange: (tab: 'read' | 'search') => void
}

const BibleTabs = ({ activeTab, onTabChange }: BibleTabsProps) => {
  const { language } = useLanguage()
  
  const texts = {
    ko: { read: '읽기', search: '검색' },
    en: { read: 'Read', search: 'Search' }
  }
  
  const t = texts[language]
  
  return (
    <div className="bible-tabs">
      {/* 세그먼트 컨트롤 — 하나의 트랙 안에서 활성 탭만 하이라이트되어 현재 상태를 직관적으로 보여준다 */}
      <div className="bible-tabs__track" role="tablist" aria-label={t.read + ' / ' + t.search}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'read'}
          className={`bible-tab ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => onTabChange('read')}
        >
          <span className="material-icons-round">menu_book</span>
          {t.read}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'search'}
          className={`bible-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onTabChange('search')}
        >
          <span className="material-icons-round">search</span>
          {t.search}
        </button>
      </div>
    </div>
  )
}

export default BibleTabs
