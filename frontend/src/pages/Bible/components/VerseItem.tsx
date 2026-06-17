import { useState, useMemo, useRef, useEffect } from 'react'
import type { BibleVerse } from '../../../types/bible'
import { useVerseReading } from '../../../hooks/useVerseReading'
import VerseReadingButton from '../../../components/prayer/VerseReadingButton'
import { isAdmin } from '../../../utils/auth'
import { useVerseBookmark } from '../../../hooks/useBibleBookmark'
import VerseBookmarkModal, { HIGHLIGHT_COLOR_BG } from './VerseBookmarkModal'

interface VerseItemProps {
  verse: BibleVerse
  bookNameKo?: string
  chapter?: number
  isRead: boolean
  onReadSuccess: (verseId: number, similarity: number) => void
  onEdit?: (verse: BibleVerse) => void
  onShowCommentary?: (verse: BibleVerse) => void
  hasCommentary?: boolean
}

const VerseItem = ({ verse, bookNameKo, chapter, isRead, onReadSuccess, onEdit, onShowCommentary, hasCommentary }: VerseItemProps) => {
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const maxProgressRef = useRef(0) // 최대 진행률 추적
  const isAdminUser = isAdmin()
  const { data: bookmark } = useVerseBookmark(verse.id)
  const highlightBg = bookmark?.highlight_color
    ? HIGHLIGHT_COLOR_BG[bookmark.highlight_color]
    : null

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

  // 음성 인식 중에는 액션바가 닫혀서 마이크 버튼이 가려지지 않도록 보장
  useEffect(() => {
    if (isReading) {
      setShowActions(true)
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
    // 보조 다듬기: 한 번의 인식 업데이트로 경계가 훌쩍 점프하지 않게 전진 폭을 제한한다.
    // (반복 단어를 indexOf가 본문 뒤쪽에서 잘못 매칭하면 진행률이 급등해 색칠 영역이
    //  확 튀는데, 이를 단계적으로 따라가게 만들어 어지럼증을 줄인다.)
    const MAX_FORWARD_STEP = 15 // % — 정상 낭독은 한 번에 이 정도 이상 잘 안 뛴다
    if (currentProgress > maxProgressRef.current) {
      maxProgressRef.current = Math.min(
        currentProgress,
        maxProgressRef.current + MAX_FORWARD_STEP
      )
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
      id={`bible-verse-${verse.verse}`}
      data-verse={verse.verse}
      className={`bible-verse-item ${isRead ? 'verse-read' : ''} ${isReading ? 'verse-reading' : ''} ${showActions && !isReading ? 'verse-selected' : ''}`}
      style={{
        position: 'relative',
        // 'all'을 쓰면 :hover의 margin/padding 같은 레이아웃 속성까지 애니메이션돼 버벅인다.
        // 색/그림자 등 합성 가능한 속성만 전환하고 박스 지오메트리는 즉시 적용.
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        scrollMarginTop: '5rem',
      }}
    >
      {/* 구절 번호와 텍스트 (탭하면 액션바 토글) */}
      <div
        onClick={() => setShowActions(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setShowActions(prev => !prev)
          }
        }}
        aria-expanded={showActions}
        aria-label={`${verse.verse}절 액션 ${showActions ? '닫기' : '열기'}`}
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'flex-start',
          cursor: 'pointer',
          userSelect: 'text',
          ...(highlightBg && !isReading
            ? {
                // 다크 배경 위에서 파스텔 형광펜이 탁하게 떡지지 않도록:
                // 색 정체성은 왼쪽 바로 또렷하게 주고, 면은 아주 옅은 틴트만.
                background: `linear-gradient(to right, ${highlightBg}26, ${highlightBg}0d)`,
                borderLeft: `3px solid ${highlightBg}`,
                borderRadius: '0.375rem',
                padding: '0.375rem 0.5rem',
              }
            : {}),
        }}
      >
        <span className="bible-verse-number">{verse.verse}</span>
        <span
          className={`bible-verse-text ${highlightBg && !isReading ? 'is-highlighted' : ''}`}
          style={{ flex: 1, minWidth: 0 }}
        >
          {isReading && highlightedText ? (
            <>
              <span style={{
                color: '#f0abfc',
                // 읽은 부분도 본문과 동일한 굵기(400) 유지 — bold면 경계가 전진할 때마다
                // 폭이 바뀌어 줄바꿈이 재계산된다(출렁임).
                textShadow: '0 0 8px rgba(236, 72, 153, 0.35)',
                transition: 'color 0.2s ease'
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

        {/* 가벼운 상태 인디케이터 (점/체크) - 본문 폭을 거의 잡아먹지 않음 */}
        {(isRead || bookmark || hasCommentary) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0,
              paddingTop: '0.375rem',
            }}
          >
            {isRead && (
              <span
                className="material-icons-round"
                style={{ color: 'var(--ig-success)', fontSize: '1rem' }}
                title="읽음 완료"
              >
                check_circle
              </span>
            )}
            {bookmark && (
              <span
                title={bookmark.is_favorite ? '즐겨찾기' : bookmark.note ? '묵상 노트' : '북마크'}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: bookmark.is_favorite ? '#ec4899' : '#a855f7',
                }}
              />
            )}
            {hasCommentary && (
              <span
                title="해석 있음"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#a855f7',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* 액션바 - 탭 시 본문 아래로 등장.
          높이(grid-template-rows)는 '즉시' 토글해 레이아웃 애니메이션을 없앤다 →
          펼침/접힘 동안 프레임마다 아래 구절이 reflow되며 버벅이던 현상 제거.
          버튼은 opacity/transform(GPU 합성)으로만 부드럽게 페이드한다. */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showActions ? '1fr' : '0fr',
          marginLeft: '3.25rem',
        }}
        aria-hidden={!showActions}
      >
        {/* 펼쳐진 상태에선 overflow를 풀어 버튼 글로우가 사각형으로 잘리지 않게 한다. */}
        <div style={{ overflow: showActions ? 'visible' : 'hidden' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingTop: '0.5rem',
              opacity: showActions ? 1 : 0,
              transform: showActions ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
          >
            {/* 주요 액션: 북마크·해석 (가장 자주 쓰는 묵상 동작을 앞에 배치) */}
            <button
              onClick={() => setShowBookmarkModal(true)}
              className="verse-action-btn"
              style={
                bookmark?.is_favorite
                  ? {
                      background: 'rgba(236, 72, 153, 0.16)',
                      border: '1px solid rgba(236, 72, 153, 0.5)',
                      boxShadow: '0 2px 10px rgba(236, 72, 153, 0.18)',
                    }
                  : bookmark
                    ? {
                        background: 'rgba(236, 72, 153, 0.14)',
                        border: '1px solid rgba(236, 72, 153, 0.45)',
                        boxShadow: '0 2px 10px rgba(236, 72, 153, 0.16)',
                      }
                    : {
                        background: 'rgba(236, 72, 153, 0.09)',
                        border: '1px solid rgba(236, 72, 153, 0.22)',
                      }
              }
              title={bookmark ? '묵상 노트 수정' : '묵상/북마크 추가'}
              tabIndex={showActions ? 0 : -1}
            >
              <span
                className="material-icons-round"
                style={{
                  fontSize: '1.125rem',
                  color: bookmark?.is_favorite ? '#ec4899' : '#f472b6',
                  opacity: bookmark ? 1 : 0.85,
                }}
              >
                {bookmark
                  ? bookmark.is_favorite
                    ? 'favorite'
                    : bookmark.note
                      ? 'bookmark'
                      : 'brush'
                  : 'bookmark_border'}
              </span>
            </button>

            {onShowCommentary && (
              <button
                onClick={() => onShowCommentary(verse)}
                className="verse-action-btn"
                style={
                  hasCommentary
                    ? {
                        background: 'rgba(168, 85, 247, 0.16)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        boxShadow: '0 2px 10px rgba(168, 85, 247, 0.18)',
                      }
                    : {
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.22)',
                      }
                }
                title={hasCommentary ? '해석 보기' : '해석 (등록된 해석 없음)'}
                tabIndex={showActions ? 0 : -1}
              >
                <span
                  className="material-icons-round"
                  style={{
                    fontSize: '1.125rem',
                    color: '#a855f7',
                    opacity: hasCommentary ? 1 : 0.8,
                  }}
                >
                  menu_book
                </span>
              </button>
            )}

            {/* 구분선: 주요(묵상) ↔ 보조(음성/관리자) 그룹 분리 */}
            {(isSupported || (isAdminUser && onEdit)) && (
              <span
                aria-hidden
                style={{
                  width: '1px',
                  height: '1.25rem',
                  background: 'var(--ig-border, rgba(255,255,255,0.12))',
                  margin: '0 0.125rem',
                  flexShrink: 0,
                }}
              />
            )}

            {/* 보조 액션: 음성 낭독 (톤다운) */}
            {isSupported && (
              <span style={{ display: 'inline-flex', opacity: 0.9 }}>
                <VerseReadingButton
                  isReading={isReading}
                  isSupported={isSupported}
                  onClick={isReading ? stopReading : handleStartReading}
                  disabled={isRead}
                  size="sm"
                />
              </span>
            )}

            {/* 보조 액션: 구절 수정 (관리자) */}
            {isAdminUser && onEdit && (
              <button
                onClick={() => onEdit(verse)}
                className="verse-action-btn"
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  opacity: 0.85,
                }}
                title="구절 수정 (관리자)"
                tabIndex={showActions ? 0 : -1}
              >
                <span className="material-icons-round" style={{ fontSize: '1.0625rem', color: '#94a3b8' }}>
                  edit
                </span>
              </button>
            )}
          </div>
        </div>
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

      {/* 묵상 메모 미리보기 */}
      {bookmark?.note && (
        <div
          onClick={() => setShowBookmarkModal(true)}
          style={{
            marginLeft: '3.25rem',
            padding: '0.625rem 0.875rem',
            background: 'rgba(168, 85, 247, 0.08)',
            borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--ig-secondary-text)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
          title="클릭해서 수정"
        >
          <span
            className="material-icons-round"
            style={{ fontSize: '0.875rem', marginRight: '0.375rem', verticalAlign: 'middle', color: '#a855f7' }}
          >
            edit_note
          </span>
          {bookmark.note.length > 100 ? bookmark.note.slice(0, 100) + '...' : bookmark.note}
        </div>
      )}

      {/* 북마크/묵상 모달 */}
      {showBookmarkModal && (
        <VerseBookmarkModal
          verseId={verse.id}
          verseReference={`${bookNameKo ?? verse.book_name_ko ?? ''} ${chapter ?? verse.chapter}:${verse.verse}`.trim()}
          verseText={verse.text}
          existing={bookmark ?? null}
          onClose={() => setShowBookmarkModal(false)}
        />
      )}
    </div>
  )
}

export default VerseItem
