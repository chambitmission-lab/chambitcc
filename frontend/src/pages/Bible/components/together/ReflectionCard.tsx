import { useState } from 'react'
import type { VerseReflection } from '../../../../api/bibleReflection'
import { CommentIcon, HeartIcon } from '../../../../components/icons/ActionIcons'
import ReflectionReplies from './ReflectionReplies'
import RtAvatar from './RtAvatar'

interface ReflectionCardProps {
  reflection: VerseReflection
  verseId: number
  canModerate: boolean
  onToggleLike: (r: VerseReflection) => void
  onEdit: (r: VerseReflection, content: string) => void
  onDelete: (r: VerseReflection) => void
  editPending: boolean
}

const REFLECTION_MAX = 1000

/** 묵상 한 장 — 작성자·본문·공감/댓글 액션. 댓글은 펼칠 때만 불러온다. */
const ReflectionCard = ({
  reflection: r,
  verseId,
  canModerate,
  onToggleLike,
  onEdit,
  onDelete,
  editPending,
}: ReflectionCardProps) => {
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(r.content)

  const saveEdit = () => {
    const content = draft.trim()
    if (!content || content === r.content) {
      setEditing(false)
      return
    }
    onEdit(r, content)
    setEditing(false)
  }

  return (
    <article className={`rt-card ${r.is_mine ? 'rt-card--mine' : ''}`}>
      <div className="rt-card__head">
        <RtAvatar author={r.author} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="rt-card__name">
            {r.author.display_name}
            {r.is_mine && <span className="rt-card__meta"> · 나</span>}
          </div>
          <div className="rt-card__meta">
            {r.time_ago}
            {r.is_edited ? ' · 수정됨' : ''}
          </div>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            className="rt-textarea"
            value={draft}
            maxLength={REFLECTION_MAX}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="rt-prompt__actions">
            <span className="rt-counter">{draft.length}/{REFLECTION_MAX}</span>
            <span style={{ display: 'flex', gap: '0.25rem' }}>
              <button type="button" className="rt-action" onClick={() => { setEditing(false); setDraft(r.content) }}>
                취소
              </button>
              <button type="button" className="rt-btn-primary" onClick={saveEdit} disabled={editPending || !draft.trim()}>
                저장
              </button>
            </span>
          </div>
        </>
      ) : (
        <p className="rt-card__body">{r.content}</p>
      )}

      <div className="rt-card__actions">
        <button
          type="button"
          className={`rt-action ${r.is_liked ? 'rt-action--on' : ''}`}
          onClick={() => onToggleLike(r)}
          aria-pressed={r.is_liked}
          title={r.is_liked ? '공감 취소' : '공감'}
        >
          <HeartIcon size={15} filled={r.is_liked} />
          {r.like_count > 0 ? r.like_count : '공감'}
        </button>
        <button
          type="button"
          className={`rt-action ${repliesOpen ? 'rt-action--on' : ''}`}
          onClick={() => setRepliesOpen((v) => !v)}
          aria-expanded={repliesOpen}
          title="댓글"
        >
          <CommentIcon size={15} />
          {r.reply_count > 0 ? r.reply_count : '댓글'}
        </button>
        <span className="rt-action__spacer" />
        {r.is_mine && !editing && (
          <button type="button" className="rt-action" onClick={() => setEditing(true)}>
            수정
          </button>
        )}
        {(r.is_mine || canModerate) && (
          <button
            type="button"
            className="rt-action rt-action--danger"
            onClick={() => {
              if (window.confirm('이 묵상을 삭제할까요?')) onDelete(r)
            }}
          >
            삭제
          </button>
        )}
      </div>

      {repliesOpen && <ReflectionReplies verseId={verseId} reflectionId={r.id} canModerate={canModerate} />}
    </article>
  )
}

export default ReflectionCard
