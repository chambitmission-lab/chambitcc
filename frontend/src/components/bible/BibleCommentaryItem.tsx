import { Markdown } from '../../utils/markdown'
import type { BibleCommentary } from '../../types/bibleCommentary'

interface BibleCommentaryItemProps {
  commentary: BibleCommentary
  isAdmin: boolean
  onEdit?: (commentary: BibleCommentary) => void
  onDelete?: (commentary: BibleCommentary) => void
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const formatRange = (c: BibleCommentary) => {
  if (c.verse_start === c.verse_end) return `${c.verse_start}절`
  return `${c.verse_start}-${c.verse_end}절`
}

const BibleCommentaryItem = ({
  commentary,
  isAdmin,
  onEdit,
  onDelete,
}: BibleCommentaryItemProps) => {
  const authorName =
    commentary.author?.full_name ||
    commentary.author?.username ||
    '관리자'

  return (
    <article
      style={{
        background: 'var(--ig-secondary-background, #f7f7f8)',
        border: '1px solid var(--ig-border, rgba(0,0,0,0.06))',
        borderRadius: '0.75rem',
        padding: '0.875rem 1rem',
        marginBottom: '0.75rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#6366f1',
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
          }}
        >
          {formatRange(commentary)}
        </span>
        {commentary.category && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--ig-secondary-text, #666)',
              background: 'rgba(0,0,0,0.04)',
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
            }}
          >
            {commentary.category}
          </span>
        )}
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--ig-secondary-text, #888)',
            marginLeft: 'auto',
          }}
        >
          {authorName} · {formatDate(commentary.updated_at)}
        </span>
      </header>

      {commentary.title && (
        <h4
          style={{
            margin: '0 0 0.375rem',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--ig-primary-text, #111)',
          }}
        >
          {commentary.title}
        </h4>
      )}

      <Markdown source={commentary.content} />

      {isAdmin && (
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            justifyContent: 'flex-end',
            marginTop: '0.5rem',
          }}
        >
          {onEdit && (
            <button
              onClick={() => onEdit(commentary)}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.08)',
                color: '#7c3aed',
                cursor: 'pointer',
              }}
            >
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(commentary)}
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                background: 'rgba(220, 38, 38, 0.06)',
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default BibleCommentaryItem
