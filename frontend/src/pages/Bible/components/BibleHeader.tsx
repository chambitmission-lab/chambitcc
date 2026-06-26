import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'

const BibleHeader = () => {
  const { language } = useLanguage()

  const title = language === 'ko' ? '성경 공부' : 'Bible Study'
  const genealogyLabel = language === 'ko' ? '가계도' : 'Genealogy'
  const plansLabel = language === 'ko' ? '읽기 플랜' : 'Plans'

  return (
    <div className="bible-study-header flex items-center justify-between">
      <h1 className="bible-study-title">
        <span className="material-icons-round">auto_stories</span>
        {title}
      </h1>
      <div className="flex items-center gap-1.5">
        <Link to="/bible/plans" className="bible-head-chip">
          <span className="material-icons-round" style={{ fontSize: 16 }}>
            event_available
          </span>
          {plansLabel}
        </Link>
        <Link to="/bible/genealogy" className="bible-head-chip">
          <span className="material-icons-round" style={{ fontSize: 16 }}>
            account_tree
          </span>
          {genealogyLabel}
        </Link>
      </div>
    </div>
  )
}

export default BibleHeader
