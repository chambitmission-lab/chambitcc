import { useLanguage } from '../../../contexts/LanguageContext'

interface BibleHeaderProps {
  /** 하단 네비게이션의 활성 탭 — 타이틀·아이콘을 동기화해 "지금 어디에 있는지"를 일치시킨다 */
  tab?: 'read' | 'search'
}

// 플랜/가계도 진입점은 하단 네비게이션(BibleBottomNav)으로 이동 — 헤더는 타이틀만 남겨 깔끔하게
const BibleHeader = ({ tab = 'read' }: BibleHeaderProps) => {
  const { language } = useLanguage()

  const title =
    tab === 'search'
      ? language === 'ko' ? '성경 검색' : 'Bible Search'
      : language === 'ko' ? '성경 공부' : 'Bible Study'
  const icon = tab === 'search' ? 'search' : 'auto_stories'

  return (
    <div className="bible-study-header flex items-center justify-between">
      <h1 className="bible-study-title">
        <span className="material-icons-round">{icon}</span>
        {title}
      </h1>
    </div>
  )
}

export default BibleHeader
