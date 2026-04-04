import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyReply } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'

interface MyRepliesListProps {
  replies: MyReply[]
  onReplyClick?: (prayerId: number) => void
}

const MyRepliesList = ({ replies, onReplyClick }: MyRepliesListProps) => {
  const { t } = useLanguage()
  
  if (replies.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">💬</span>
        <p className="empty-text">{t('profileEmptyReplies')}</p>
      </div>
    )
  }

  return (
    <div className="content-list">
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="content-item"
          onClick={() => onReplyClick?.(reply.prayer_id)}
        >
          <div className="item-header">
            <span className="item-label">{t('profileReplyLabel')}</span>
            <span className="item-prayer-title">{reply.prayer_title}</span>
          </div>
          <p className="item-content reply-content">{reply.content}</p>
          <div className="item-meta">
            <span className="meta-item">{reply.display_name}{t('profileWrittenAs')}</span>
            <span className="meta-item meta-time">
              {getRelativeTime(reply.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyRepliesList
