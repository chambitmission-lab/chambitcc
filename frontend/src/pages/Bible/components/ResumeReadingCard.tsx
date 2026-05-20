import { useState } from 'react'
import type { ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'

interface ResumeReadingCardProps {
  latest: ResumePosition | null
  recentBooks: ResumePosition[]
  onResume: (pos: ResumePosition) => void
}

const formatRelativeTime = (iso: string): string => {
  const date = parseApiDate(iso)
  const then = date.getTime()
  const now = Date.now()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const ResumeReadingCard = ({ latest, recentBooks, onResume }: ResumeReadingCardProps) => {
  const [expanded, setExpanded] = useState(false)

  if (!latest) return null

  // 전역 최신은 recent_books[0] 과 동일하므로 더보기 목록에서는 제외
  const others = recentBooks.filter(
    p => !(p.book_number === latest.book_number && p.verse_id === latest.verse_id)
  )

  return (
    <div
      style={{
        margin: '0 1rem 1rem',
        borderRadius: '0.875rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
        border: '1px solid rgba(99,102,241,0.25)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => onResume(latest)}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span
          className="material-icons-round"
          style={{
            fontSize: '1.75rem',
            color: '#a855f7',
            flexShrink: 0,
          }}
        >
          play_circle
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--ig-secondary-text)',
              marginBottom: '0.125rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            이어 읽기 · {formatRelativeTime(latest.read_at)}
          </div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--ig-primary-text)',
              marginBottom: '0.25rem',
            }}
          >
            {latest.book_name_ko} {latest.chapter}장 {latest.verse}절
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--ig-secondary-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {latest.text}
          </div>
        </div>
        <span
          className="material-icons-round"
          style={{ fontSize: '1.25rem', color: 'var(--ig-secondary-text)', flexShrink: 0 }}
        >
          chevron_right
        </span>
      </button>

      {others.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid rgba(99,102,241,0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              color: 'var(--ig-secondary-text)',
              fontWeight: 500,
            }}
          >
            다른 책 이어 읽기 ({others.length})
            <span className="material-icons-round" style={{ fontSize: '1rem' }}>
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {expanded && (
            <div style={{ padding: '0.25rem 0.5rem 0.75rem' }}>
              {others.map(pos => (
                <button
                  key={pos.book_number}
                  type="button"
                  onClick={() => onResume(pos)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                      {pos.book_name_ko} {pos.chapter}:{pos.verse}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ig-secondary-text)' }}>
                      {formatRelativeTime(pos.read_at)}
                    </div>
                  </div>
                  <span
                    className="material-icons-round"
                    style={{ fontSize: '1.125rem', color: 'var(--ig-secondary-text)' }}
                  >
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResumeReadingCard
