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
    feedback,
    startReading,
    stopReading
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
  
  // 이미 읽은 구절은 읽기 시작 방지
  const handleStartReading = () => {
    if (isRead) {
      return
    }
    startReading()
  }

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
              onClick={isReading ? stopReading : handleStartReading}
              disabled={isRead}
              size="sm"
            />
          </div>
        )}
      </div>
      
      {/* 읽는 중 안내 메시지 */}
      {isReading && !feedback && (
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(252, 211, 77, 0.05))',
          borderRadius: '0.75rem',
          fontSize: '0.9375rem',
          color: 'var(--ig-primary)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginLeft: '3.25rem',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
        }}>
          <span className="material-icons-outlined" style={{ 
            fontSize: '1.25rem',
            color: 'rgba(251, 191, 36, 0.8)',
            animation: 'gentlePulse 2s ease-in-out infinite'
          }}>
            mic
          </span>
          <span>말씀을 읽어주세요...</span>
          <style>{`
            @keyframes gentlePulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.1); }
            }
          `}</style>
        </div>
      )}
      
      {/* 피드백 메시지 - 임팩트 있게 */}
      {showFeedback && feedback && (
        <div style={{
          padding: '1.25rem',
          background: feedback.type === 'success' 
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(252, 211, 77, 0.1))' 
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.05))',
          borderRadius: '0.75rem',
          fontSize: '1.0625rem',
          color: feedback.type === 'success' 
            ? '#b45309'
            : 'var(--ig-error)',
          fontWeight: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginLeft: '3.25rem',
          border: feedback.type === 'success'
            ? '2px solid rgba(251, 191, 36, 0.3)'
            : '1px solid rgba(239, 68, 68, 0.2)',
          boxShadow: feedback.type === 'success'
            ? '0 4px 16px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            : '0 2px 8px rgba(239, 68, 68, 0.1)',
          animation: 'fadeInScale 0.4s ease-out',
          textAlign: 'center'
        }}>
          <span 
            className="material-icons-round" 
            style={{ 
              fontSize: '2.5rem',
              color: feedback.type === 'success' ? 'rgba(251, 191, 36, 0.9)' : 'var(--ig-error)',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
            }}
          >
            {feedback.type === 'success' ? 'auto_awesome' : 'refresh'}
          </span>
          <div style={{ lineHeight: 1.5 }}>
            {feedback.message}
          </div>
          <style>{`
            @keyframes fadeInScale {
              0% {
                opacity: 0;
                transform: scale(0.9) translateY(-10px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

export default VerseItem
