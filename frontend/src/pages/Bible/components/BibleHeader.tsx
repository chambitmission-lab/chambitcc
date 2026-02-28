import { useLanguage } from '../../../contexts/LanguageContext'

const BibleHeader = () => {
  const { language } = useLanguage()
  
  const title = language === 'ko' ? '성경 공부' : 'Bible Study'
  
  return (
    <div className="bible-study-header">
      <h1 className="bible-study-title">
        <span className="material-icons-round">auto_stories</span>
        {title}
      </h1>
    </div>
  )
}

export default BibleHeader
