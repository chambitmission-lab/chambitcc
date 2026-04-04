// 설교에서 언급된 성경 구절 섹션 컴포넌트
import { useNavigate } from 'react-router-dom'
import type { BibleReference } from '../../../types/sermon'
import './BibleReferencesSection.css'

interface BibleReferencesSectionProps {
  references: BibleReference[]
  videoId?: string | null
  hasAudio?: boolean
  onTimestampClick?: (timestamp: number) => void
}

export const BibleReferencesSection = ({
  references,
  videoId,
  hasAudio = false,
  onTimestampClick,
}: BibleReferencesSectionProps) => {
  const navigate = useNavigate()

  if (!references || references.length === 0) {
    return null
  }

  const handleReferenceClick = (ref: BibleReference) => {
    // 성경 상세보기로 이동
    navigate(`/bible/${ref.book_number}/${ref.chapter}`)
  }

  const handleTimestampClick = (e: React.MouseEvent, timestamp: number) => {
    e.stopPropagation()
    if (onTimestampClick) {
      onTimestampClick(timestamp)
    }
  }

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 타임스탬프 버튼 표시 여부 (오디오 또는 비디오가 있을 때)
  const showTimestamp = hasAudio || videoId

  return (
    <div className="bible-references-section">
      <div className="bible-references-header">
        <span className="material-icons-outlined">menu_book</span>
        <h3>언급된 성경 구절</h3>
        <span className="bible-references-count">{references.length}</span>
      </div>

      <div className="bible-references-list">
        {references.map((ref) => (
          <div
            key={ref.id}
            className="bible-reference-card"
            onClick={() => handleReferenceClick(ref)}
          >
            <div className="bible-reference-header">
              <div className="bible-reference-title">
                <span className="bible-reference-book">{ref.book_name}</span>
                <span className="bible-reference-chapter-verse">
                  {ref.chapter}:{ref.verse}
                </span>
              </div>
              {showTimestamp && (
                <button
                  className={`bible-reference-timestamp ${hasAudio ? 'audio-timestamp' : 'video-timestamp'}`}
                  onClick={(e) => handleTimestampClick(e, ref.timestamp)}
                  title={hasAudio ? "음성 해당 시간으로 이동" : "비디오 해당 시간으로 이동"}
                >
                  <span className="material-icons-outlined">
                    {hasAudio ? 'volume_up' : 'play_circle'}
                  </span>
                  <span>{formatTimestamp(ref.timestamp)}</span>
                </button>
              )}
            </div>

            {ref.segment_text && (
              <div className="bible-reference-context">
                <span className="material-icons-outlined">format_quote</span>
                <p>{ref.segment_text}</p>
              </div>
            )}

            {ref.bible_text && (
              <div className="bible-reference-text">
                <p>{ref.bible_text}</p>
              </div>
            )}

            <div className="bible-reference-action">
              <span className="material-icons-outlined">arrow_forward</span>
              <span>성경 보기</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
