import type { ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'
import { useLanguage } from '../../../contexts/LanguageContext'

interface ResumeReadingCardProps {
  latest: ResumePosition | null
  onResume: (pos: ResumePosition) => void
  /** 영어 모드에서 쓸 책 이름 — books API의 book_name_en (없으면 한글로 폴백) */
  bookNameEn?: string
}

const formatRelativeTime = (iso: string, language: 'ko' | 'en'): string => {
  const date = parseApiDate(iso)
  const then = date.getTime()
  const now = Date.now()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (language === 'en') {
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin} min ago`
    if (diffHour < 24) return `${diffHour} hr ago`
    if (diffDay === 1) return 'yesterday'
    if (diffDay < 7) return `${diffDay} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 이어 읽기 — 사용자가 가장 자주 누르는 본연 기능이라 강조 카드로 단독 노출.
// 다른 책의 이어 읽기는 책 선택 영역의 "최근 읽은 책" 슬라이더가 담당한다.
const ResumeReadingCard = ({ latest, onResume, bookNameEn }: ResumeReadingCardProps) => {
  const { language } = useLanguage()
  if (!latest) return null

  const title =
    language === 'en'
      ? `${bookNameEn || latest.book_name_ko} ${latest.chapter}:${latest.verse}`
      : `${latest.book_name_ko} ${latest.chapter}장 ${latest.verse}절`

  return (
    <button type="button" onClick={() => onResume(latest)} className="dash-card dash-card--resume">
      <span className="dash-card__icon">
        <span className="material-icons-round">menu_book</span>
      </span>
      <span className="dash-card__body">
        <span className="dash-card__label">
          {language === 'en' ? 'Continue reading' : '이어 읽기'} · {formatRelativeTime(latest.read_at, language)}
        </span>
        <span className="dash-card__title">{title}</span>
        <span className="dash-card__text">{latest.text}</span>
      </span>
      <span className="material-icons-round dash-card__chevron">chevron_right</span>
    </button>
  )
}

export default ResumeReadingCard
