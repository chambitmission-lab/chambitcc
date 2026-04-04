interface Comment {
  id: number
  user_name: string
  content: string
  created_at: string
}

interface CommentsSectionProps {
  comments?: Comment[]
  comment: string
  setComment: (value: string) => void
  submitting: boolean
  isLoggedIn: boolean
  onSubmit: (e: React.FormEvent) => void
  onDelete: (commentId: number) => void
  t: any
}

export const CommentsSection = ({
  comments,
  comment,
  setComment,
  submitting,
  isLoggedIn,
  onSubmit,
  onDelete,
  t,
}: CommentsSectionProps) => {
  return (
    <div className="comments-section">
      <div className="section-badge">
        💬 {t.comments} ({comments?.length || 0})
      </div>

      {isLoggedIn && (
        <form onSubmit={onSubmit} className="comment-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.writeComment}
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="submit-btn"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      )}

      <div className="comments-list">
        {comments?.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-header">
              <span className="comment-author">👤 {c.user_name}</span>
              <span className="comment-date">
                {new Date(c.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <p className="comment-content">{c.content}</p>
            {isLoggedIn && (
              <button
                onClick={() => onDelete(c.id)}
                className="delete-comment-btn"
              >
                {t.deleteComment}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
