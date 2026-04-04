import { useState, useMemo, useRef, useEffect } from 'react'
import type { BibleVerse } from '../../../types/bible'
import { useVerseReading } from '../../../hooks/useVerseReading'
import VerseReadingButton from '../../../components/prayer/VerseReadingButton'
import { isAdmin } from '../../../utils/auth'

interface VerseItemProps {
  verse: BibleVerse
  readingMode: boolean
  isRead: boolean
  onReadSuccess: (verseId: number, similarity: number) => void
  onEdit?: (verse: BibleVerse) => void
}

const VerseItem = ({ verse, readingMode, isRead, onReadSuccess, onEdit }: VerseItemProps) => {
  const [showFeedback, setShowFeedback] = useState(false)
  const maxProgressRef = useRef(0) // 최대 진행률 추적
  const isAdminUser = isAdmin()

  const {
    isReading,
    isSupported,
    feedback,
    spokenText,
    startReading,
    stopReading
  } = useVerseReading({
    verseText: verse.text,
    onSuccess: (similarity) => {
      // 피드백 메시지는 표시하지 않음 (폭죽만 터트림)
      // setShowFeedback(true)
      onReadSuccess(verse.id, similarity)
      // setTimeout(() => {
      //   setShowFeedback(false)
      // }, 3000)
    },
    onError: (error) => {
      console.error('Verse reading error:', error)
    },
    threshold: 0.5
  })
  
  // 읽기 시작/종료 시 최대 진행률 초기화
  useEffect(() => {
    if (!isReading) {
      maxProgressRef.current = 0
    }
  }, [isReading])
  
  // 노래방 스타일 하이라이트: 읽은 부분 계산 (유연한 매칭)
  const highlightedText = useMemo(() => {
    if (!isReading || !verse.text) {
      return null
    }
    
    // spokenText가 없으면 이전 최대값 유지
    if (!spokenText) {
      if (maxProgressRef.current === 0) {
        return null
      }
      // 이전 최대값으로 표시
      const charCount = Math.floor((maxProgressRef.current / 100) * verse.text.replace(/\s+/g, '').length)
      let count = 0
      let splitIndex = 0
      for (let i = 0; i < verse.text.length; i++) {
        if (verse.text[i] !== ' ') {
          count++
          if (count === charCount) {
            splitIndex = i + 1
            break
          }
        }
      }
      const readPart = verse.text.substring(0, splitIndex)
      const unreadPart = verse.text.substring(splitIndex)
      return { readPart, unreadPart, progress: maxProgressRef.current }
    }
    
    // 공백 제거 후 비교
    const normalizeText = (text: string) => text.replace(/\s+/g, '').toLowerCase()
    const verseNormalized = normalizeText(verse.text)
    const spokenNormalized = normalizeText(spokenText)
    
    // 유연한 매칭: 읽은 텍스트의 마지막 부분이 성경 텍스트 어디까지 포함되는지 찾기
    let matchLength = 0
    
    // 방법 1: 순차적 매칭 (기존 방식)
    for (let i = 0; i < Math.min(verseNormalized.length, spokenNormalized.length); i++) {
      if (verseNormalized[i] === spokenNormalized[i]) {
        matchLength = i + 1
      } else {
        break
      }
    }
    
    // 방법 2: 부분 문자열 매칭 (더 유연함)
    // 읽은 텍스트의 마지막 5-10글자가 성경 텍스트 어디에 있는지 찾기
    if (spokenNormalized.length >= 5) {
      const recentSpoken = spokenNormalized.slice(-10) // 마지막 10글자
      const foundIndex = verseNormalized.indexOf(recentSpoken)
      
      if (foundIndex !== -1) {
        const potentialMatch = foundIndex + recentSpoken.length
        // 더 긴 매칭을 선택
        matchLength = Math.max(matchLength, potentialMatch)
      }
    }
    
    // 방법 3: 단어 단위 매칭 (가장 유연함)
    // 읽은 텍스트를 단어로 분리해서 성경 텍스트에서 찾기
    const spokenWords = spokenText.trim().split(/\s+/).filter(w => w.length > 0)
    if (spokenWords.length > 0) {
      const lastWord = spokenWords[spokenWords.length - 1]
      const lastWordNormalized = normalizeText(lastWord)
      
      // 마지막 단어가 성경 텍스트 어디에 있는지 찾기
      const wordIndex = verseNormalized.indexOf(lastWordNormalized)
      if (wordIndex !== -1) {
        const potentialMatch = wordIndex + lastWordNormalized.length
        matchLength = Math.max(matchLength, potentialMatch)
      }
    }
    
    const currentProgress = (matchLength / verseNormalized.length) * 100
    
    // 최대 진행률 업데이트 (뒤로 가지 않도록)
    if (currentProgress > maxProgressRef.current) {
      maxProgressRef.current = currentProgress
    }
    
    // 최대 진행률 기준으로 표시
    const displayProgress = maxProgressRef.current
    
    // 원본 텍스트에서 매칭된 위치 찾기 (공백 포함)
    const displayMatchLength = Math.floor((displayProgress / 100) * verseNormalized.length)
    let charCount = 0
    let splitIndex = 0
    for (let i = 0; i < verse.text.length; i++) {
      if (verse.text[i] !== ' ') {
        charCount++
        if (charCount === displayMatchLength) {
          splitIndex = i + 1
          break
        }
      }
    }
    
    const readPart = verse.text.substring(0, splitIndex)
    const unreadPart = verse.text.substring(splitIndex)
    
    return { readPart, unreadPart, progress: displayProgress }
  }, [isReading, spokenText, verse.text])
  
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
          {isReading && highlightedText ? (
            <>
              <span style={{ 
                color: '#fbbf24',
                fontWeight: 600,
                textShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.2s ease'
              }}>
                {highlightedText.readPart}
              </span>
              <span style={{ color: 'var(--ig-primary-text)' }}>
                {highlightedText.unreadPart}
              </span>
            </>
          ) : (
            verse.text || '(구절 내용 없음)'
          )}
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
        
        {/* 관리자 수정 버튼 */}
        {isAdminUser && onEdit && (
          <button
            onClick={() => onEdit(verse)}
            style={{
              padding: '0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
            }}
            title="구절 수정 (관리자)"
          >
            <span className="material-icons-round" style={{ fontSize: '1.125rem', color: '#8b5cf6' }}>
              edit
            </span>
          </button>
        )}
      </div>
      

      
      {/* 피드백 메시지 - 임팩트 있게 */}
      {showFeedback && feedback && (
        <div style={{
          padding: '1.25rem',
          background: feedback.type === 'success' 
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(252, 211, 77, 0.15))' 
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.1))',
          borderRadius: '0.75rem',
          fontSize: '1.125rem',
          color: 'var(--ig-primary-text)',
          fontWeight: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginLeft: '3.25rem',
          border: feedback.type === 'success'
            ? '2px solid rgba(251, 191, 36, 0.4)'
            : '2px solid rgba(239, 68, 68, 0.3)',
          boxShadow: feedback.type === 'success'
            ? '0 4px 16px rgba(251, 191, 36, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            : '0 4px 12px rgba(239, 68, 68, 0.15)',
          animation: 'fadeInScale 0.4s ease-out',
          textAlign: 'center'
        }}>
          <span 
            className="material-icons-round" 
            style={{ 
              fontSize: '2.5rem',
              color: feedback.type === 'success' ? '#d97706' : '#dc2626',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
            }}
          >
            {feedback.type === 'success' ? 'auto_awesome' : 'refresh'}
          </span>
          <div style={{ lineHeight: 1.5 }}>
            {feedback.message}
          </div>
          
          {/* 에러일 때 다시 시도 버튼 */}
          {feedback.type === 'error' && (
            <button
              onClick={() => {
                setShowFeedback(false)
                handleStartReading()
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)'
              }}
            >
              <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                replay
              </span>
              다시 시도
            </button>
          )}
          
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
