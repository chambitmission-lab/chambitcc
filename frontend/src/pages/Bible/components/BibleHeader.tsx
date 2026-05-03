import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'

const BibleHeader = () => {
  const { language } = useLanguage()

  const title = language === 'ko' ? '성경 공부' : 'Bible Study'
  const genealogyLabel = language === 'ko' ? '믿음의 가계도' : 'Genealogy'

  return (
    <div className="bible-study-header flex items-center justify-between">
      <h1 className="bible-study-title">
        <span className="material-icons-round">auto_stories</span>
        {title}
      </h1>
      <Link
        to="/bible/genealogy"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50 transition-colors"
      >
        <span className="material-icons-round" style={{ fontSize: 18 }}>
          account_tree
        </span>
        {genealogyLabel}
      </Link>
    </div>
  )
}

export default BibleHeader
