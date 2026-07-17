import { useState, useEffect } from 'react'
import type { BibleVerse } from '../../../types/bible'
import { useVerseReading } from '../../../hooks/useVerseReading'
import { useKaraokeProgress } from '../../../hooks/useKaraokeProgress'
import VerseReadingButton from '../../../components/prayer/VerseReadingButton'
import { isAdmin } from '../../../utils/auth'
import { useVerseBookmark } from '../../../hooks/useBibleBookmark'
import VerseBookmarkModal, { HIGHLIGHT_COLOR_BG } from './VerseBookmarkModal'
import VerseNoteSheet from './VerseNoteSheet'
import { HeartIcon, BookOpenIcon } from '../../../components/icons/ActionIcons'

interface VerseItemProps {
  verse: BibleVerse
  bookNameKo?: string
  chapter?: number
  isRead: boolean
  onReadSuccess: (verseId: number, similarity: number) => void
  onEdit?: (verse: BibleVerse) => void
  onShowCommentary?: (verse: BibleVerse) => void
  hasCommentary?: boolean
  // 오디오북이 지금 낭독 중인 절 — 듣기-보기 동기화 하이라이트
  isAudioActive?: boolean
  // 액션바 열림 상태는 부모(VerseList)가 관리한다 — 한 번에 한 절의 메뉴만 열려
  // 다른 절을 탭하면 이전 메뉴가 닫힌다(예전 풀스크린 백드롭의 역할을 대체).
  actionsOpen: boolean
  onActionsOpenChange: (open: boolean) => void
}

const VerseItem = ({ verse, bookNameKo, chapter, isRead, onReadSuccess, onEdit, onShowCommentary, hasCommentary, isAudioActive, actionsOpen, onActionsOpenChange }: VerseItemProps) => {
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [showNoteSheet, setShowNoteSheet] = useState(false)
  const showActions = actionsOpen
  const isAdminUser = isAdmin()
  const { data: bookmark } = useVerseBookmark(verse.id)
  const highlightBg = bookmark?.highlight_color
    ? HIGHLIGHT_COLOR_BG[bookmark.highlight_color]
    : null

  const {
    isReading,
    isStarting,
    isSupported,
    feedback,
    spokenText,
    startReading,
    stopReading,
    primeMicrophone
  } = useVerseReading({
    verseText: verse.text,
    onSuccess: (similarity) => {
      // 피드백 메시지는 표시하지 않음 (폭죽만)
      // 햅틱(성공 진동)은 현재 비활성화. 다시 켜려면 아래 상수만 true로.
      // Android 전용 — iOS는 vibrate 미지원이라 조용히 무시된다.
      const HAPTIC_ENABLED = false
      if (HAPTIC_ENABLED && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 90])
      }
      onReadSuccess(verse.id, similarity)
    },
    onError: (error) => {
      console.error('Verse reading error:', error)
    },
    threshold: 0.5
  })

  // 노래방 하이라이트 — 색칠 경계(원본 텍스트 인덱스). 매칭/보간 로직은 훅에.
  const karaokeSplitIndex = useKaraokeProgress({
    isReading,
    verseText: verse.text,
    spokenText,
  })

  // 음성 인식 중에는 액션바가 닫혀서 마이크 버튼이 가려지지 않도록 보장
  useEffect(() => {
    if (isReading) {
      onActionsOpenChange(true)
    }
    // onActionsOpenChange는 매 렌더 새로 생성되지만, 의도적으로 isReading 변화에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReading])

  const hasNote = !!bookmark?.note

  // 구절 본문에 줄 좌측 강조(블록 지정). 색 형광펜이 우선, 없으면 노트가 있을 때
  // 은은한 보라 틴트로 "여긴 내가 묵상한 절"임을 본문 읽기를 방해하지 않는 선에서 표시.
  const rowAccent =
    highlightBg && !isReading
      ? {
          // 다크 배경 위에서 파스텔 형광펜이 탁하게 떡지지 않도록:
          // 색 정체성은 왼쪽 바로 또렷하게 주고, 면은 아주 옅은 틴트만.
          background: `linear-gradient(to right, ${highlightBg}26, ${highlightBg}0d)`,
          borderLeft: `3px solid ${highlightBg}`,
          borderRadius: '0.375rem',
          padding: '0.375rem 0.5rem',
        }
      : hasNote && !isReading
        ? {
            background: 'var(--brand-soft)',
            borderLeft: '3px solid var(--brand)',
            borderRadius: '0.375rem',
            padding: '0.375rem 0.5rem',
          }
        : {}

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
      className={`bible-verse-item ${isRead ? 'verse-read' : ''} ${isReading ? 'verse-reading' : ''} ${showActions && !isReading ? 'verse-selected' : ''} ${isAudioActive ? 'verse-audio-active' : ''}`}
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
        onClick={() => onActionsOpenChange(!showActions)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActionsOpenChange(!showActions)
          }
        }}
        aria-expanded={showActions}
        aria-label={`${verse.verse}절 메뉴 ${showActions ? '닫기' : '열기'}`}
        style={{
          position: 'relative',
          display: 'flex',
          gap: '1.25rem',
          // 번호/점은 첫 줄 라인박스(--verse-line-box) 중앙에 맞춘다.
          // baseline 정렬은 작은 숫자가 한글 본문 대비 살짝 처져 보였음.
          alignItems: 'flex-start',
          cursor: 'pointer',
          userSelect: 'text',
          ...rowAccent,
        }}
      >
        {/* 읽음 완료 표시는 번호 자체의 색(초록) + 등장 팝으로 —
            체크 아이콘을 본문 행에 끼우면 재줄바꿈으로 높이가 출렁이고,
            absolute 오버레이는 어디에 둬도 붕 떠 보여서 요소 추가 없이 해결.
            (읽은 절은 행 전체 흐림 + 초록 틴트가 함께 깔려 상태가 충분히 읽힌다) */}
        <span
          className="bible-verse-number"
          title={isRead ? '읽음 완료' : undefined}
          style={
            isRead
              ? {
                  color: 'var(--ig-success)',
                  animation: 'verseNumberPop 0.4s ease-out',
                }
              : undefined
          }
        >
          {verse.verse}
        </span>
        <span
          className={`bible-verse-text ${highlightBg && !isReading ? 'is-highlighted' : ''}`}
          style={{ flex: 1, minWidth: 0 }}
        >
          {isReading && verse.text ? (
            <>
              <span style={{
                color: 'var(--brand)',
                // 읽은 부분도 본문과 동일한 굵기(400) 유지 — bold면 경계가 전진할 때마다
                // 폭이 바뀌어 줄바꿈이 재계산된다(출렁임).
                textShadow: '0 0 8px var(--brand-glow)',
              }}>
                {verse.text.slice(0, karaokeSplitIndex)}
              </span>
              <span style={{ color: 'var(--ig-primary-text)' }}>
                {verse.text.slice(karaokeSplitIndex)}
              </span>
            </>
          ) : (
            verse.text || '(구절 내용 없음)'
          )}
        </span>

        {/* 가벼운 상태 인디케이터 - 본문 폭을 거의 잡아먹지 않음.
            하이라이트는 좌측 바+배경, 노트는 아래 칩으로 이미 보이므로 여기선 생략(중복 방지).
            남는 두 상태는 모양으로 구분: 채운 하트=즐겨찾기(내 표시), 라인 책=해석 있음(콘텐츠).
            읽음 체크는 절 번호 색으로 이동 — 읽음 처리 순간 이 행에
            아이콘이 끼어들며 본문이 재줄바꿈되던 출렁임을 없앤다. */}
        {(bookmark?.is_favorite || hasCommentary) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              flexShrink: 0,
              // 본문 첫 줄 라인박스 중앙에 11px 아이콘을 맞춘다 (변수는 verse-display.css 정의)
              paddingTop: 'calc(var(--verse-line-box) / 2 - 5.5px)',
            }}
          >
            {bookmark?.is_favorite && (
              <span title="즐겨찾기" style={{ display: 'inline-flex', color: 'var(--brand)' }}>
                <HeartIcon size={11} filled />
              </span>
            )}
            {hasCommentary && (
              <span
                title="해석 있음"
                style={{ display: 'inline-flex', color: 'var(--brand)', opacity: 0.75 }}
              >
                <BookOpenIcon size={11} strokeWidth={2.2} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* 액션 메뉴 - 절을 탭하면 본문 흐름 안에서 바로 아래에 펼쳐진다.
          예전 absolute 오버레이는 다음 절을 가렸고, 닫기용 풀스크린 fixed 백드롭이
          모바일 스크롤을 막았다. 인라인(in-flow) 배치로 두 문제를 함께 해결한다.
          (다른 절을 탭하면 부모가 이 메뉴를 닫아 항상 한 절만 열린다) */}
      {showActions && (
          <div
            role="menu"
            className="verse-action-popover"
            style={{
              alignSelf: 'flex-start',
              marginLeft: '3.25rem',
              marginTop: '0.5rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              padding: '0.4rem 0.5rem',
              borderRadius: '1.5rem',
              animation: 'versePopIn 0.16s ease-out',
            }}
          >
            {/* 주요 액션: 북마크·해석 (가장 자주 쓰는 묵상 동작을 앞에 배치) */}
            <button
              onClick={() => { onActionsOpenChange(false); setShowBookmarkModal(true) }}
              className="verse-action-btn"
              style={
                bookmark?.is_favorite
                  ? {
                      background: 'var(--brand-soft-strong)',
                      border: '1px solid var(--brand)',
                      boxShadow: '0 2px 10px var(--brand-glow)',
                    }
                  : bookmark
                    ? {
                        background: 'var(--brand-soft-strong)',
                        border: '1px solid var(--brand)',
                        boxShadow: '0 2px 10px var(--brand-glow)',
                      }
                    : {
                        background: 'var(--brand-soft)',
                        border: '1px solid var(--brand-soft-strong)',
                      }
              }
              title={bookmark ? '묵상 노트 수정' : '묵상/북마크 추가'}
              tabIndex={showActions ? 0 : -1}
            >
              <span
                className="material-icons-round"
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--brand)',
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
                onClick={() => { onActionsOpenChange(false); onShowCommentary(verse) }}
                className="verse-action-btn"
                style={
                  hasCommentary
                    ? {
                        background: 'var(--brand-soft-strong)',
                        border: '1px solid var(--brand)',
                        boxShadow: '0 2px 10px var(--brand-glow)',
                      }
                    : {
                        background: 'var(--brand-soft)',
                        border: '1px solid var(--brand-soft-strong)',
                      }
                }
                title={hasCommentary ? '해석 보기' : '해석 (등록된 해석 없음)'}
                tabIndex={showActions ? 0 : -1}
              >
                <span
                  className="material-icons-round"
                  style={{
                    fontSize: '1.125rem',
                    color: 'var(--brand)',
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
                  isStarting={isStarting}
                  isSupported={isSupported}
                  onClick={isReading ? stopReading : handleStartReading}
                  onPrime={primeMicrophone}
                  disabled={isRead}
                  size="sm"
                />
              </span>
            )}

            {/* 보조 액션: 구절 수정 (관리자) */}
            {isAdminUser && onEdit && (
              <button
                onClick={() => { onActionsOpenChange(false); onEdit(verse) }}
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
      )}


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

      {/* 묵상 노트 칩 - 메모 본문을 흐름에 그대로 풀어놓아 성경 본문과 섞이던 문제를
          해결. 작은 칩만 두고, 누르면 하단 시트가 올라와 메모를 또렷하게 보여준다. */}
      {hasNote && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowNoteSheet(true) }}
          style={{
            alignSelf: 'flex-start',
            marginLeft: '3.25rem',
            marginTop: '0.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            maxWidth: 'calc(100% - 3.25rem)',
            padding: '0.3rem 0.7rem 0.3rem 0.55rem',
            background: 'var(--brand-soft)',
            border: '1px solid var(--brand-soft-strong)',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            color: 'var(--ig-secondary-text)',
            lineHeight: 1.3,
            WebkitTapHighlightColor: 'transparent',
          }}
          title="묵상 노트 보기"
        >
          <span className="material-icons-round" style={{ fontSize: '1rem', color: 'var(--brand)', flexShrink: 0 }}>
            sticky_note_2
          </span>
          <span style={{ fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>묵상 노트</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.85,
            }}
          >
            {bookmark!.note}
          </span>
        </button>
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

      {/* 묵상 노트 읽기 시트 - 수정 누르면 편집 모달로 전환 */}
      {showNoteSheet && bookmark?.note && (
        <VerseNoteSheet
          verseReference={`${bookNameKo ?? verse.book_name_ko ?? ''} ${chapter ?? verse.chapter}:${verse.verse}`.trim()}
          verseText={verse.text}
          bookmark={bookmark}
          onEdit={() => { setShowNoteSheet(false); setShowBookmarkModal(true) }}
          onClose={() => setShowNoteSheet(false)}
        />
      )}
    </div>
  )
}

export default VerseItem
