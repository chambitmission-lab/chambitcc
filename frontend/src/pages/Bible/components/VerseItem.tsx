import { useState, useEffect, memo, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { BibleVerse } from '../../../types/bible'
import type { WordNote } from '../../../api/bibleWordNote'
import type { VerseBookmark } from '../../../api/bibleBookmark'
import { useVerseReading } from '../../../hooks/useVerseReading'
import { useKaraokeProgress } from '../../../hooks/useKaraokeProgress'
import { isAuthenticated } from '../../../utils/auth'
import { useVerseBookmark } from '../../../hooks/useBibleBookmark'
import { HIGHLIGHT_COLOR_BG } from './VerseBookmarkModal'
import { useGlossaryChips } from '../hooks/useGlossaryChips'
import type { GlossaryEntry } from '../data/bibleGlossary'
import { HeartIcon } from '../../../components/icons/ActionIcons'
import type { VerseCopyTarget } from './verseCopy'
import { useVerseListActions, useVerseListSettings } from './verse/VerseListContext'
import VerseNumber from './verse/VerseNumber'
import VerseText from './verse/VerseText'
import VerseActionPopover from './verse/VerseActionPopover'
import VerseSheets from './verse/VerseSheets'
import { useHoldToRead } from './verse/useHoldToRead'
import { useWordSelection } from './verse/useWordSelection'
import { useGlossarySegments, useNoteSegments, useWordTokens } from './verse/verseTextSegments'
import { can } from '../../../utils/access'

interface VerseItemProps {
  verse: BibleVerse
  bookNameKo?: string
  bookNumber?: number
  chapter?: number
  isRead: boolean
  // 이 절의 수동 읽음 처리가 진행 중 (중복 클릭 방지)
  isTogglingRead?: boolean
  hasCommentary?: boolean
  // 오디오북이 지금 낭독 중인 절 — 듣기-보기 동기화 하이라이트
  isAudioActive?: boolean
  // 액션바 열림 여부 — 열림 상태 자체는 목록(VerseListContext.onActionsOpenChange)이 관리한다
  actionsOpen: boolean
  // 이 절에 저장된 단어 노트들 — 부모가 장 단위로 배치 조회해 나눠준다
  wordNotes?: WordNote[]
  // 이 절의 북마크 — 부모(VerseList)가 장 단위로 배치 조회해 나눠준다.
  // undefined = 장 데이터 없음(로딩/미배포) → 기존 절별 조회로 폴백,
  // null = 장 데이터는 있는데 이 절엔 북마크 없음
  chapterBookmark?: VerseBookmark | null
  isSelected?: boolean
  // 본문 보기 — list(절마다 한 줄, 기본) / flow(문단으로 이어 붙이고 번호는 위첨자).
  // flow일 땐 부모가 단락(div.verse-paragraph__body) 안에 인라인으로 나열한다.
  layout?: 'list' | 'flow'
}

const ROW_ACCENT_BASE: CSSProperties = {
  borderRadius: '0.375rem',
  padding: '0.375rem 0.5rem',
}

/**
 * 절 하나. 상태를 모아 하위 조각(번호·본문·액션 메뉴·시트)에 나눠주고
 * 절별(list)/이어읽기(flow) 두 레이아웃으로 배치하는 역할만 맡는다.
 * 제스처·단어 선택·본문 장식 계산은 ./verse/ 아래 훅과 컴포넌트가 담당.
 */
const VerseItem = ({
  verse, bookNameKo, bookNumber, chapter, isRead, isTogglingRead, hasCommentary, isAudioActive, actionsOpen,
  wordNotes, chapterBookmark, isSelected, layout = 'list',
}: VerseItemProps) => {
  // 목록 수준 액션·설정은 컨텍스트에서 — 절 props 는 "이 절"에 관한 것만 받는다
  const {
    onReadSuccess, onEdit, onToggleRead, onShowCommentary, onListenFrom,
    onActionsOpenChange: setActionsOpenById, onToggleSelect, onEnterSelection, onShare,
  } = useVerseListActions()
  const { selectionMode } = useVerseListSettings()
  const isFlow = layout === 'flow'
  // 내부에선 이 절 기준의 (open) 시그니처가 편해 verse.id를 미리 물린 래퍼를 쓴다
  const onActionsOpenChange = (open: boolean) => setActionsOpenById(verse.id, open)
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [showNoteSheet, setShowNoteSheet] = useState(false)
  // 인물·지명 사전 칩을 탭하면 열리는 한 줄 설명 시트
  const [glossaryEntry, setGlossaryEntry] = useState<GlossaryEntry | null>(null)
  // 선택 모드에선 액션바가 뜨지 않는다 (탭은 선택 토글에 쓰인다)
  const showActions = actionsOpen && !selectionMode
  const isAdminUser = can('bible:edit')
  // 수동 읽음 처리는 로그인만 하면 누구나 (기록은 사용자별로 저장된다)
  const loggedIn = isAuthenticated()

  // ── 북마크: 장 배치 데이터(chapterBookmark)가 오면 절별 요청은 끄고 장 데이터를 쓴다 — N+1 제거.
  // 저장/삭제 직후의 즉시 반영은 뮤테이션이 장 배치 캐시를 직접 갱신해 처리한다.
  // (detail 캐시를 우선하면 persist로 복원된 오래된 절 캐시가 신선한 장 데이터를 덮는다)
  const chapterProvided = chapterBookmark !== undefined
  const { data: fetchedBookmark } = useVerseBookmark(verse.id, !chapterProvided)
  const bookmark = chapterProvided ? chapterBookmark : fetchedBookmark
  const highlightBg = bookmark?.highlight_color ? HIGHLIGHT_COLOR_BG[bookmark.highlight_color] : null
  const hasNote = !!bookmark?.note

  // ── 음성 낭독 + 노래방 하이라이트
  const { isReading, isStarting, isSupported, spokenText, startReading, stopReading, primeMicrophone } =
    useVerseReading({
      verseText: verse.text,
      onSuccess: (similarity) => onReadSuccess(verse.id, similarity),
      onError: (error) => console.error('Verse reading error:', error),
      threshold: 0.5,
    })
  const karaokeSplitIndex = useKaraokeProgress({ isReading, verseText: verse.text, spokenText })
  // 이미 읽은 구절은 읽기 시작 방지
  const handleStartReading = () => {
    if (!isRead) startReading()
  }
  // 음성 인식 중에는 액션바가 닫혀서 마이크 버튼이 가려지지 않도록 보장
  useEffect(() => {
    if (isReading) onActionsOpenChange(true)
    // onActionsOpenChange는 매 렌더 새로 생성되지만, 의도적으로 isReading 변화에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReading])

  // ── 본문 장식: 단어장 밑줄 → 사전 칩(겹치면 단어장 우선) → 선택 모드용 토큰
  const noteSegments = useNoteSegments(wordNotes, verse.text)
  const glossaryMatches = useGlossaryChips(
    bookNumber ?? verse.book_number,
    chapter ?? verse.chapter,
    verse.verse,
    verse.text
  )
  const glossarySegments = useGlossarySegments(glossaryMatches, noteSegments)
  const wordTokens = useWordTokens(verse.text)
  const words = useWordSelection({ noteSegments, wordNotes })

  // ── 절 번호 길게 누르기 = 읽음 표시
  // 선택/단어 모드나 음성 낭독 중엔 번호 탭이 다른 의미를 가지므로 제스처를 끈다
  const canHoldToRead = !!(loggedIn && onToggleRead && !selectionMode && !words.selectMode && !isReading)
  const hold = useHoldToRead({
    enabled: canHoldToRead,
    busy: isTogglingRead,
    onHold: () => onToggleRead?.(verse, !isRead),
  })

  // ── 클릭/키보드: 절 본문 탭 = 액션바 토글 (선택 모드에선 선택 토글, 단어 모드에선 종료)
  const handleBodyActivate = () => {
    if (selectionMode) {
      onToggleSelect?.(verse.id)
      return
    }
    if (words.selectMode) {
      words.exitSelectMode()
      return
    }
    onActionsOpenChange(!showActions)
  }
  const bodyA11y = {
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleBodyActivate()
      }
    },
    'aria-expanded': selectionMode ? undefined : showActions,
    'aria-pressed': selectionMode ? !!isSelected : undefined,
    'aria-label': selectionMode
      ? `${verse.verse}절 ${isSelected ? '선택 해제' : '선택'}`
      : `${verse.verse}절 메뉴 ${showActions ? '닫기' : '열기'}`,
  }

  // 복사/공유 대상 — 이 절 하나 (여러 절은 VerseList의 선택 바가 따로 만든다)
  const copyTarget: VerseCopyTarget = {
    bookNameKo: bookNameKo ?? verse.book_name_ko ?? '',
    bookNumber: bookNumber ?? verse.book_number ?? 0,
    chapter: chapter ?? verse.chapter,
    verses: [{ verse: verse.verse, text: verse.text }],
  }
  const verseReference = `${bookNameKo ?? verse.book_name_ko ?? ''} ${chapter ?? verse.chapter}:${verse.verse}`.trim()

  const itemClassName = `bible-verse-item ${isFlow ? 'bible-verse-item--flow' : ''} ${isRead ? 'verse-read' : ''} ${isReading ? 'verse-reading' : ''} ${showActions && !isReading ? 'verse-selected' : ''} ${isAudioActive ? 'verse-audio-active' : ''}`

  // ── 공통 조각 ─────────────────────────────────────────────────────
  const numberEl = (
    <VerseNumber
      number={verse.verse}
      isRead={isRead}
      canHoldToRead={canHoldToRead}
      isHolding={hold.isHolding}
      holdHandlers={hold.handlers}
    />
  )

  const textEl = (
    <VerseText
      text={verse.text}
      isFlow={isFlow}
      isHighlighted={!!highlightBg && !isReading}
      isReading={isReading}
      karaokeSplitIndex={karaokeSplitIndex}
      wordSelectMode={words.selectMode}
      wordTokens={wordTokens}
      noteSegments={noteSegments}
      glossarySegments={glossarySegments}
      onTokenTap={words.openForToken}
      onNoteTap={words.openForNote}
      onGlossaryTap={setGlossaryEntry}
    />
  )

  const popoverEl = showActions && (
    <VerseActionPopover
      verse={verse}
      copyTarget={copyTarget}
      isRead={isRead}
      isTogglingRead={!!isTogglingRead}
      loggedIn={loggedIn}
      isAdminUser={isAdminUser}
      bookmark={bookmark}
      hasWordNotes={(wordNotes?.length ?? 0) > 0}
      hasCommentary={!!hasCommentary}
      reading={{
        isSupported,
        isReading,
        isStarting,
        onStart: handleStartReading,
        onStop: stopReading,
        onPrime: primeMicrophone,
      }}
      handlers={{
        onOpenBookmark: () => setShowBookmarkModal(true),
        onEnterWordSelect: words.enterSelectMode,
        onToggleRead,
        onShowCommentary,
        onListenFrom,
        onEnterSelection,
        onShare,
        onEdit,
      }}
      onClose={() => onActionsOpenChange(false)}
    />
  )

  const sheetsEl = (
    <VerseSheets
      verseId={verse.id}
      verseReference={verseReference}
      verseText={verse.text}
      bookmark={bookmark}
      showBookmarkModal={showBookmarkModal}
      onCloseBookmarkModal={() => setShowBookmarkModal(false)}
      wordSheet={words.sheet}
      onCloseWordSheet={words.closeSheet}
      glossaryEntry={glossaryEntry}
      onCloseGlossary={() => setGlossaryEntry(null)}
      showNoteSheet={showNoteSheet}
      onCloseNoteSheet={() => setShowNoteSheet(false)}
      onEditNote={() => {
        setShowNoteSheet(false)
        setShowBookmarkModal(true)
      }}
    />
  )

  // ── 이어읽기(문단) 보기 ──────────────────────────────────────────
  // 절 하나가 인라인 span으로 문단에 섞여 흐른다. 강조(선택/형광펜/노트)는 좌측 바 대신
  // 글자 뒤 마커 배경(box-decoration-break: clone)으로 줄이 바뀌어도 이어진다.
  if (isFlow) {
    const flowAccent: CSSProperties = isSelected
      ? { background: 'var(--brand-soft-strong)', boxShadow: '0 0 0 2px var(--brand-soft-strong)' }
      : highlightBg && !isReading
        ? { background: `color-mix(in srgb, ${highlightBg} 34%, transparent)` }
        : hasNote && !isReading
          ? { background: 'var(--brand-soft)' }
          : {}
    return (
      <span
        id={`bible-verse-${verse.verse}`}
        data-verse={verse.verse}
        className={itemClassName}
        style={{ scrollMarginTop: '7rem' }}
      >
        <span
          className="bible-verse-flow-body"
          onClick={handleBodyActivate}
          {...bodyA11y}
          style={{ userSelect: selectionMode ? 'none' : 'text', ...flowAccent }}
        >
          {/* 선택 모드: 번호 앞 고정 슬롯 — 토글마다 생겼다 사라지면 문단이 재줄바꿈된다 */}
          {selectionMode && (
            <span aria-hidden className={`bible-verse-flow-check ${isSelected ? 'is-on' : ''}`}>
              {isSelected && <span className="material-icons-round">check</span>}
            </span>
          )}
          {numberEl}
          {textEl}
          {!selectionMode && bookmark?.is_favorite && (
            <span title="즐겨찾기" className="bible-verse-flow-fav">
              <HeartIcon size={11} filled />
            </span>
          )}
        </span>
        {/* 묵상 노트 — 문단을 어지럽히지 않게 아이콘 칩만, 누르면 읽기 시트 */}
        {hasNote && (
          <button
            type="button"
            className="bible-verse-flow-note"
            onClick={(e) => { e.stopPropagation(); setShowNoteSheet(true) }}
            title="묵상 노트 보기"
            aria-label={`${verse.verse}절 묵상 노트 보기`}
          >
            <span className="material-icons-round">sticky_note_2</span>
          </button>
        )}
        {words.selectMode && (
          <span className="bible-verse-flow-wordhint" style={{ animation: 'versePopIn 0.16s ease-out' }}>
            <span className="material-icons-round">touch_app</span>
            뜻을 남길 단어를 탭하세요
            <button type="button" onClick={(e) => { e.stopPropagation(); words.exitSelectMode() }}>
              취소
            </button>
          </span>
        )}
        {' '}
        {popoverEl}
        {sheetsEl}
      </span>
    )
  }

  // ── 절별(목록) 보기 ─────────────────────────────────────────────
  // 구절 본문에 줄 좌측 강조(블록 지정). 선택 모드에서는 선택 여부가 최우선,
  // 그다음 색 형광펜, 없으면 노트가 있을 때 은은한 브랜드 틴트로
  // "여긴 내가 묵상한 절"임을 본문 읽기를 방해하지 않는 선에서 표시.
  const rowAccent: CSSProperties = isSelected
    ? { ...ROW_ACCENT_BASE, background: 'var(--brand-soft-strong)', borderLeft: '3px solid var(--brand)' }
    : highlightBg && !isReading
      ? {
          ...ROW_ACCENT_BASE,
          // 다크 배경 위에서 파스텔 형광펜이 탁하게 떡지지 않도록:
          // 색 정체성은 왼쪽 바로 또렷하게 주고, 면은 아주 옅은 틴트만.
          // (highlightBg는 var(--hl-*)라 hex 알파를 못 붙인다 → color-mix)
          background: `linear-gradient(to right, color-mix(in srgb, ${highlightBg} 15%, transparent), color-mix(in srgb, ${highlightBg} 5%, transparent))`,
          borderLeft: `3px solid ${highlightBg}`,
        }
      : hasNote && !isReading
        ? { ...ROW_ACCENT_BASE, background: 'var(--brand-soft)', borderLeft: '3px solid var(--brand)' }
        : {}

  return (
    <div
      id={`bible-verse-${verse.verse}`}
      data-verse={verse.verse}
      className={itemClassName}
      style={{
        position: 'relative',
        // 'all'을 쓰면 :hover의 margin/padding 같은 레이아웃 속성까지 애니메이션돼 버벅인다.
        // 색/그림자 등 합성 가능한 속성만 전환하고 박스 지오메트리는 즉시 적용.
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        // 상단 정렬 스크롤(block:'start') 시 고정 헤더(56px)+오디오 미니 플레이어
        // (top-14에 뜨는 한 줄 바)에 가려지지 않도록 그 아래 지점으로 맞춘다.
        scrollMarginTop: '7rem',
      }}
    >
      {/* 구절 번호와 텍스트 (탭하면 액션바 토글) */}
      <div
        onClick={handleBodyActivate}
        {...bodyA11y}
        style={{
          position: 'relative',
          display: 'flex',
          gap: '1.25rem',
          // 번호/점은 첫 줄 라인박스(--verse-line-box) 중앙에 맞춘다.
          // baseline 정렬은 작은 숫자가 한글 본문 대비 살짝 처져 보였음.
          alignItems: 'flex-start',
          cursor: 'pointer',
          // 선택 모드에선 탭마다 텍스트가 파랗게 잡히는 걸 막는다
          userSelect: selectionMode ? 'none' : 'text',
          ...rowAccent,
        }}
      >
        {/* 읽음 완료 표시는 번호 자체의 색(초록) + 등장 팝으로 —
            체크 아이콘을 본문 행에 끼우면 재줄바꿈으로 높이가 출렁이고,
            absolute 오버레이는 어디에 둬도 붕 떠 보여서 요소 추가 없이 해결. */}
        {numberEl}
        {textEl}

        {/* 가벼운 상태 인디케이터 - 본문 폭을 거의 잡아먹지 않음.
            하이라이트는 좌측 바+배경, 노트는 아래 칩으로 이미 보이므로 여기선 생략(중복 방지).
            채운 하트=즐겨찾기(내 표시). 읽음 체크는 절 번호 색으로 이동. */}
        {selectionMode ? (
          // 선택 모드에선 이 자리를 항상 체크 슬롯으로 고정 —
          // 토글할 때마다 아이콘이 생겼다 사라지면 본문이 재줄바꿈된다.
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              paddingTop: 'calc(var(--verse-line-box) / 2 - 9px)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: isSelected ? '1px solid var(--brand)' : '1.5px solid var(--ig-border)',
                background: isSelected ? 'var(--brand)' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
            >
              {isSelected && (
                <span className="material-icons-round" style={{ fontSize: '0.875rem', color: '#fff' }}>
                  check
                </span>
              )}
            </span>
          </div>
        ) : bookmark?.is_favorite ? (
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
            <span title="즐겨찾기" style={{ display: 'inline-flex', color: 'var(--brand)' }}>
              <HeartIcon size={11} filled />
            </span>
          </div>
        ) : null}
      </div>

      {/* 단어 선택 모드 안내 칩 */}
      {words.selectMode && (
        <div
          style={{
            alignSelf: 'flex-start',
            marginLeft: '3.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.3rem 0.7rem',
            background: 'var(--brand-soft)',
            border: '1px solid var(--brand-soft-strong)',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--brand)',
            animation: 'versePopIn 0.16s ease-out',
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '1rem' }}>touch_app</span>
          뜻을 남길 단어를 탭하세요
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); words.exitSelectMode() }}
            style={{
              marginLeft: '0.25rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--ig-secondary-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 액션 메뉴 — 절 아래 인라인(in-flow)으로 펼쳐진다 (다른 절을 탭하면 부모가 닫는다) */}
      {popoverEl}

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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
            {bookmark!.note}
          </span>
        </button>
      )}

      {sheetsEl}
    </div>
  )
}

// 장의 모든 절이 이 컴포넌트로 렌더된다(시편 119편은 176개). memo가 없으면
// 오디오 하이라이트 이동·액션바 토글 같은 부모 상태 변화마다 전 절이 재렌더되므로
// 부모(VerseList)는 콜백을 useCallback으로 안정화해 내려보내야 한다.
export default memo(VerseItem)
