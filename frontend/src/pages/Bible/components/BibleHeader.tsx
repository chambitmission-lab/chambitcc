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
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50/80 text-amber-700 border border-amber-200/60 hover:bg-amber-100/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20 dark:hover:bg-amber-500/15 transition-all"
      >
        <span className="material-icons-round" style={{ fontSize: 16 }}>
          account_tree
        </span>
        {genealogyLabel}
      </Link>
    </div>
  )
}

export default BibleHeader
