import { useState } from 'react'
import type { BibleVerse } from '../../../types/bible'
import { useVerseReading } from '../../../hooks/useVerseReading'
import VerseReadingButton from '../../../components/prayer/VerseReadingButton'

interface VerseItemProps {
  verse: BibleVerse
  readingMode: boolean
  isRead: boolean
  onReadSuccess: (verseId: number, similarity: number) => void
}

const VerseItem = ({ verse, readingMode, isRead, onReadSuccess }: VerseItemProps) => {
  const [showFeedback, setShowFeedback] = useState(false)

  const {
    isReading,
    isSupported,
    spokenText,
    feedback,
    startReading,
    stopReading,
    manualVerify
  } = useVerseReading({
    verseText: verse.text,
    onSuccess: (similarity) => {
      setShowFeedback(true)
      onReadSuccess(verse.id, similarity)
      setTimeout(() => {
        setShowFeedback(false)
      }, 3000)
    },
    onError: (error) => {
      console.error('Verse reading error:', error)
    },
    threshold: 0.75
  })

  return (
    <div 
      className={`bible-verse-item ${isRead ? 'verse-read' : ''} ${isReading ? 'verse-reading' : ''}`}
      style={{
        position: 'relative',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      {/* 구절 번호와 텍스트 */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        <span className="bible-verse-number">{verse.verse}</span>
        <span className="bible-verse-text" style={{ flex: 1 }}>
          {verse.text || '(구절 내용 없음)'}
        </span>
        
        {/* 읽기 모드일 때만 버튼 표시 */}
        {readingMode && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            flexShrink: 0
          }}>
            {isRead && (
              <span 
                className="material-icons-round" 
                style={{ 
                  color: 'var(--ig-success)', 
                  fontSize: '1.25rem' 
                }}
                title="읽음 완료"
              >
                check_circle
              </span>
            )}
            <VerseReadingButton
              isReading={isReading}
              isSupported={isSupported}
              onClick={isReading ? stopReading : startReading}
              disabled={isRead}
              size="sm"
            />
          </div>
        )}
      </div>
      
      {/* 음성 인식 중 표시 */}
      {isReading && spokenText && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--ig-secondary-text)',
          marginLeft: '3.25rem' // 구절 번호 너비만큼 들여쓰기
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--ig-primary)' }}>
              📝 읽은 내용:
            </div>
            <button
              onClick={manualVerify}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: 'var(--ig-primary)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                check
              </span>
              확인
            </button>
          </div>
          <div style={{ lineHeight: 1.6 }}>{spokenText}</div>
        </div>
      )}
      
      {/* 피드백 메시지 */}
      {showFeedback && feedback && (
        <div style={{
          padding: '0.75rem',
          background: feedback.type === 'success' 
            ? 'rgba(34, 197, 94, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: feedback.type === 'success' 
            ? 'var(--ig-success)' 
            : 'var(--ig-error)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginLeft: '3.25rem' // 구절 번호 너비만큼 들여쓰기
        }}>
          <span className="material-icons-round" style={{ fontSize: '1rem' }}>
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {feedback.message}
        </div>
      )}
    </div>
  )
}

export default VerseItem
