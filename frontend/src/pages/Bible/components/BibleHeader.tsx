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
        <Link
          to="/bible/plans"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_12px_-4px_rgba(168,85,247,0.55)] hover:shadow-[0_6px_16px_-4px_rgba(236,72,153,0.6)] transition-all"
        >
          <span className="material-icons-round" style={{ fontSize: 16 }}>
            event_available
          </span>
          {plansLabel}
        </Link>
        <Link
          to="/bible/genealogy"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 hover:bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 dark:hover:bg-purple-500/25 transition-all"
        >
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
