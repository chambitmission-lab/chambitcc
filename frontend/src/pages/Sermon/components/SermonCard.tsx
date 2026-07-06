// 설교 카드 컴포넌트 - Instagram Feed 스타일
import type { Sermon } from '../../../types/sermon'
import './SermonCard.css'

interface SermonCardProps {
  sermon: Sermon
  onClick: () => void
}

const SermonCard = ({ sermon, onClick }: SermonCardProps) => {
  // 예배 날짜는 정확히 인지되는 것이 중요 — 요일까지 표기
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  // 상대 시간은 보조 정보로만
  const formatRelative = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`
    return `${Math.floor(diffDays / 365)}년 전`
  }

  return (
    <article className="sermon-card" onClick={onClick}>
      {/* 헤더 - Instagram 포스트 헤더 */}
      <div className="sermon-card-header">
        <div className="sermon-header-left">
          <div className="sermon-avatar">
            <span className="sermon-avatar-emoji">📖</span>
          </div>
          <div className="sermon-header-info">
            <div className="sermon-pastor-name">{sermon.pastor}</div>
            <div className="sermon-date">
              <span className="sermon-date-full">{formatFullDate(sermon.sermon_date)}</span>
              <span className="sermon-date-sep">·</span>
              <span className="sermon-date-relative">{formatRelative(sermon.sermon_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 본문 - Instagram 캡션 스타일 */}
      <div className="sermon-card-body">
        {/* 성경 구절 배지 */}
        <div className="sermon-bible-badge">
          <span>📖</span>
          <span>{sermon.bible_verse}</span>
        </div>

        {/* 제목 */}
        <h3 className="sermon-title">{sermon.title}</h3>

        {/* 내용 미리보기 */}
        <p className="sermon-preview">{sermon.content}</p>
        <span className="sermon-preview-more">더 보기</span>

        {/* 하단 정보 */}
        <div className="sermon-footer">
          {/* 조회수 & 미디어 배지 */}
          <div className="sermon-stats">
            <div className="sermon-stat">
              <span className="material-icons-outlined sermon-stat-icon">visibility</span>
              <span>{sermon.views.toLocaleString()}</span>
            </div>
            {sermon.audio_url && (
              <div className="sermon-media-badge audio">
                <span className="material-icons-outlined sermon-media-badge-icon">headphones</span>
                <span>음성</span>
              </div>
            )}
            {sermon.video_url && (
              <div className="sermon-media-badge video">
                <span className="material-icons-outlined sermon-media-badge-icon">play_circle</span>
                <span>영상</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default SermonCard
