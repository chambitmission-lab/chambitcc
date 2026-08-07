// 기도 카드 컴포넌트 (그룹 배지 포함)
import type { Prayer } from '../../types/prayer'
import { HandHeartIcon, CommentIcon, SparklesIcon } from '../icons/ActionIcons'
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
  // 간증 서명 줄에 붙는 "응답된 달" — 파싱 실패 시 조용히 숨긴다
  const answeredMonth = (() => {
    if (!prayer.answered_at) return null
    const d = new Date(prayer.answered_at)
    if (Number.isNaN(d.getTime())) return null
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  })()

  return (
    <div className={`legacy-prayer-card ${prayer.is_answered ? 'answered' : ''}`}>
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
      
      {/* 간증 내용 (응답된 경우) — "응답의 기록" 엽서 무드 */}
      {prayer.is_answered && prayer.testimony && (
        <div className="testimony-section">
          <span className="testimony-spark" aria-hidden>✦</span>
          <div className="testimony-header">
            <span className="testimony-icon">
              <SparklesIcon size={13} />
            </span>
            <span className="testimony-label">응답의 기록</span>
            <span className="testimony-rule" aria-hidden />
          </div>
          <p className="testimony-content">{prayer.testimony}</p>
          <div className="testimony-sign">
            <span className="testimony-sign-name">— {prayer.display_name}</span>
            {answeredMonth && <span className="testimony-sign-date">{answeredMonth}</span>}
          </div>
        </div>
      )}
      
      {/* 액션 — 좌: 참여(기도·댓글), 우: 소유자 관리(작게, 위계 낮춤) */}
      <div className="prayer-actions">
        <div className="actions-main">
          <button
            className={`action-button ${prayer.is_prayed ? 'active' : ''}`}
            onClick={() => onPrayerToggle?.(prayer.id)}
            disabled={isToggling}
          >
            <span className="action-icon">
              <HandHeartIcon size={16} filled={prayer.is_prayed} />
            </span>
            <span className="action-text">
              {prayer.is_prayed ? '기도했어요' : '기도하기'}
            </span>
            <span className="action-count">{prayer.prayer_count}</span>
          </button>

          <button
            className="action-button"
            onClick={() => onReplyClick?.(prayer.id)}
          >
            <span className="action-icon">
              <CommentIcon size={16} />
            </span>
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
        </div>

        {/* 응답 수정/취소 (내 기도이고, 이미 응답된 경우) — 조용한 텍스트 링크 */}
        {showAnswerButton && prayer.is_owner && prayer.is_answered && (
          <div className="actions-owner">
            {onEditAnswer && (
              <button
                className="owner-link"
                onClick={() => onEditAnswer(prayer.id)}
                disabled={isToggling}
              >
                간증 수정
              </button>
            )}
            {onEditAnswer && onCancelAnswer && (
              <span className="owner-sep" aria-hidden>·</span>
            )}
            {onCancelAnswer && (
              <button
                className="owner-link"
                onClick={() => onCancelAnswer(prayer.id)}
                disabled={isToggling}
                title="응답 등록 취소"
              >
                응답 취소
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrayerCard
