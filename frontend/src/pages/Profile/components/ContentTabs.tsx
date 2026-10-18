import { useLanguage } from '../../../contexts/LanguageContext'
import type { ProfileTab } from '../../../types/profile'
import './PrayerNotebook.css'

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

// 기도 수첩 머리말 — 고른 탭에 맞춘 손글씨 제목 + 한 줄 요약, 오른쪽(모바일은 아래)에 잉크 칩 탭
const TABS = [
  { key: 'prayers', tabKey: 'notebookTabPrayers', titleKey: 'notebookTitlePrayers', subKey: 'notebookSubPrayers' },
  { key: 'praying', tabKey: 'notebookTabPraying', titleKey: 'notebookTitlePraying', subKey: 'notebookSubPraying' },
  { key: 'replies', tabKey: 'notebookTabReplies', titleKey: 'notebookTitleReplies', subKey: 'notebookSubReplies' },
  { key: 'notes', tabKey: 'notebookTabNotes', titleKey: 'notebookTitleNotes', subKey: 'notebookSubNotes' },
] as const

const ContentTabs = ({ activeTab, onTabChange, counts }: ContentTabsProps) => {
  const { t } = useLanguage()
  const active = TABS.find((tab) => tab.key === activeTab) ?? TABS[0]

  return (
    <div className="nb-head">
      <div className="min-w-0">
        <h3 className="nb-head-title">{t(active.titleKey)}</h3>
        <p className="nb-head-sub">{t(active.subKey).replace('{n}', String(counts[active.key]))}</p>
      </div>
      <div className="nb-chips" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className="nb-chip"
          >
            {t(tab.tabKey)}
            <span className="nb-chip-count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ContentTabs
