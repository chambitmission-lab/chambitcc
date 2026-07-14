// 기도 카드 컴포넌트 (그룹 배지 포함)
import type { Prayer } from '../../types/prayer'
import './PrayerCard.css'

interface PrayerCardProps {
  prayer: Prayer
  onPrayerToggle?: (prayerId: number) => void
  onReplyClick?: (prayerId: number) => void
  onAnswerToggle?: (prayerId: number) => void
  /** 응답된 기도에 대해 작성자가 간증을 수정하려고 누를 때 */
  onEditAnswer?: (prayerId: number) => void
  /** 응답된 기도의 응답 등록을 취소할 때 */
  onCancelAnswer?: (prayerId: number) => void
  isToggling?: boolean
  showAnswerButton?: boolean
}

const PrayerCard = ({
  prayer,
  onPrayerToggle,
  onReplyClick,
  onAnswerToggle,
  onEditAnswer,
  onCancelAnswer,
  isToggling = false,
  showAnswerButton = true
}: PrayerCardProps) => {
  return (
    <div className={`prayer-card ${prayer.is_answered ? 'answered' : ''}`}>
      {/* 그룹 배지 */}
      {prayer.group && (
        <div className="prayer-group-badge">
          <span className="badge-icon">{prayer.group.icon}</span>
          <span className="badge-name">{prayer.group.name}</span>
        </div>
      )}
      
      {/* 헤더 */}
      <div className="prayer-card-header">
        <div className="prayer-author">
          <span className="author-name">{prayer.display_name}</span>
          <span className="prayer-time">{prayer.time_ago}</span>
        </div>
        <div className="header-badges">
          {prayer.is_answered && (
            <span className="answered-badge">✨ 응답됨</span>
          )}
          {prayer.is_owner && (
            <span className="owner-badge">내 기도</span>
          )}
        </div>
      </div>
      
      {/* 제목 (선택) */}
      {prayer.title && <h3 className="prayer-title">{prayer.title}</h3>}

      {/* 내용 */}
      <p className="prayer-content">{prayer.content}</p>
      
      {/* 간증 내용 (응답된 경우) */}
      {prayer.is_answered && prayer.testimony && (
        <div className="testimony-section">
          <div className="testimony-header">
            <span className="testimony-icon">🎉</span>
            <span className="testimony-label">간증</span>
          </div>
          <p className="testimony-content">{prayer.testimony}</p>
        </div>
      )}
      
      {/* 액션 버튼 */}
      <div className="prayer-actions">
        <button
          className={`action-button ${prayer.is_prayed ? 'active' : ''}`}
          onClick={() => onPrayerToggle?.(prayer.id)}
          disabled={isToggling}
        >
          <span className="action-icon">🙏</span>
          <span className="action-text">
            {prayer.is_prayed ? '기도했어요' : '기도하기'}
          </span>
          <span className="action-count">{prayer.prayer_count}</span>
        </button>
        
        <button
          className="action-button"
          onClick={() => onReplyClick?.(prayer.id)}
        >
          <span className="action-icon">💬</span>
          <span className="action-text">댓글</span>
          <span className="action-count">{prayer.reply_count}</span>
        </button>
        
        {/* 응답 버튼 (내 기도이고, 아직 응답 안됨) */}
        {showAnswerButton && prayer.is_owner && !prayer.is_answered && (
          <button
            className="action-button answer-button"
            onClick={() => onAnswerToggle?.(prayer.id)}
            disabled={isToggling}
          >
            <span className="action-icon">✨</span>
            <span className="action-text">응답</span>
          </button>
        )}

        {/* 응답 수정/취소 버튼 (내 기도이고, 이미 응답된 경우) */}
        {showAnswerButton && prayer.is_owner && prayer.is_answered && (
          <>
            {onEditAnswer && (
              <button
                className="action-button answer-button"
                onClick={() => onEditAnswer(prayer.id)}
                disabled={isToggling}
              >
                <span className="action-icon">✏️</span>
                <span className="action-text">간증 수정</span>
              </button>
            )}
            {onCancelAnswer && (
              <button
                className="action-button"
                onClick={() => onCancelAnswer(prayer.id)}
                disabled={isToggling}
                title="응답 등록 취소"
              >
                <span className="action-icon">↩️</span>
                <span className="action-text">응답 취소</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PrayerCard
