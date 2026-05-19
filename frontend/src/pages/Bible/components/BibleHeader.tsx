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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 hover:bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 dark:hover:bg-purple-500/25 transition-all"
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
