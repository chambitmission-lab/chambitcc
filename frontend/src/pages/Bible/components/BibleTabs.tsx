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
      <button
        className={`bible-tab ${activeTab === 'read' ? 'active' : ''}`}
        onClick={() => onTabChange('read')}
      >
        <span className="material-icons-round">menu_book</span>
        {t.read}
      </button>
      <button
        className={`bible-tab ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
      >
        <span className="material-icons-round">search</span>
        {t.search}
      </button>
    </div>
  )
}

export default BibleTabs
