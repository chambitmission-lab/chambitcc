import type { ResumePosition } from '../../../api/bibleReading'
import { BibleBookIcon } from './BibleToolIcons'
import { parseApiDate } from '../../../utils/dateUtils'
import { useLanguage } from '../../../contexts/LanguageContext'

interface ResumeReadingCardProps {
  latest: ResumePosition | null
  /** 이번 주(KST 월~주일) 읽은 날짜 'YYYY-MM-DD' — 없으면(구버전 캐시) 요일 줄을 숨긴다 */
  weekDays?: string[]
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

const DAY_LABELS = {
  ko: ['월', '화', '수', '목', '금', '토', '주일'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

/** 이번 주 월~주일 KST 날짜 7개와 오늘 칸 위치 — 서버가 KST 주 기준으로 week_days 를 주므로 같은 기준 */
const kstWeek = (): { dates: string[]; todayIndex: number } => {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayIndex = (kstNow.getUTCDay() + 6) % 7
  const monday = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - todayIndex)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(monday + i * 86_400_000).toISOString().slice(0, 10))
  return { dates, todayIndex }
}

// 모바일 카드 왼쪽 칸은 버튼 옆에 짧은 말만 들어가 — 뒷말(.resume-streak__more)은 PC(lg+)에서만 붙인다.
// 줄바꿈되면 카드가 스켈레톤보다 길어져 아래 목록이 밀린다.
const weekSummary = (count: number, readToday: boolean, language: 'ko' | 'en') => {
  const more = (text: string) => <span className="resume-streak__more">{text}</span>
  if (language === 'en') {
    if (count === 0) return <>New week{more(' — start today')}</>
    if (count === 7) return <><b>Every day</b>{more(' this week')}</>
    return <><b>{count}</b> {count === 1 ? 'day' : 'days'}{more(' this week')}</>
  }
  if (count === 0) return <>새로운 한 주{more(' · 첫걸음을 내디뎌요')}</>
  if (count === 7) return <><b>매일</b> 함께했어요</>
  return <>이번 주 <b>{count}일</b>{more(readToday ? ' 함께했어요' : ' · 오늘도 이어가요')}</>
}

// 이어 읽기 — 사용자가 가장 자주 누르는 본연 기능이라 강조 카드로 단독 노출.
// 다른 책의 이어 읽기는 책 선택 영역의 "최근 읽은 책" 슬라이더가 담당한다.
// 위치만 보여 주던 카드가 밋밋해서, 이번 주 요일 점 + 분명한 버튼으로 습관의 리듬을 함께 보여 준다.
const ResumeReadingCard = ({ latest, weekDays, onResume, bookNameEn }: ResumeReadingCardProps) => {
  const { language } = useLanguage()
  if (!latest) return null

  const title =
    language === 'en'
      ? `${bookNameEn || latest.book_name_ko} ${latest.chapter}:${latest.verse}`
      : `${latest.book_name_ko} ${latest.chapter}장 ${latest.verse}절`

  const read = new Set(weekDays ?? [])
  const { dates, todayIndex } = kstWeek()
  const readToday = read.has(dates[todayIndex])
  const count = dates.filter(d => read.has(d)).length

  return (
    <button type="button" onClick={() => onResume(latest)} className="dash-card dash-card--resume">
      <span className="resume-stack">
        <span className="resume-head">
          <span className="dash-card__icon">
            <BibleBookIcon className="dash-card__glyph" />
          </span>
          <span className="dash-card__body">
            <span className="dash-card__label">
              {language === 'en' ? 'Continue reading' : '이어 읽기'} · {formatRelativeTime(latest.read_at, language)}
            </span>
            <span className="dash-card__title">{title}</span>
          </span>
        </span>

        {/* 이번 주 리듬 — 읽은 날은 체크 점, 오늘은 테두리 강조, 아직 안 온 날은 점선 */}
        {weekDays && (
          <span className="resume-week" aria-label={language === 'en' ? `Read ${count} days this week` : `이번 주 ${count}일 읽음`}>
            {dates.map((d, i) => (
              <span
                key={d}
                aria-hidden="true"
                className={[
                  'resume-week__day',
                  read.has(d) && 'is-read',
                  i === todayIndex && 'is-today',
                ].filter(Boolean).join(' ')}
              >
                <i />
                {DAY_LABELS[language][i]}
              </span>
            ))}
          </span>
        )}

        <span className="resume-foot">
          <span className="resume-cta">
            {language === 'en' ? 'Keep reading' : '이어서 읽기'}
            <span className="material-icons-round" aria-hidden="true">arrow_forward</span>
          </span>
          {weekDays && <span className="resume-streak">{weekSummary(count, readToday, language)}</span>}
        </span>
      </span>
    </button>
  )
}

export default ResumeReadingCard
