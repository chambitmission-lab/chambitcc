import { useLanguage } from '../../../contexts/LanguageContext'

// 플랜/가계도 진입점은 하단 네비게이션(BibleBottomNav)으로 이동 — 헤더는 타이틀만 남겨 깔끔하게
const BibleHeader = () => {
  const { language } = useLanguage()

  const title = language === 'ko' ? '성경 공부' : 'Bible Study'

  return (
    <div className="bible-study-header flex items-center justify-between">
      <h1 className="bible-study-title">
        <span className="material-icons-round">auto_stories</span>
        {title}
      </h1>
    </div>
  )
}

export default BibleHeader
