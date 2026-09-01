import { useState, useEffect, useMemo, useRef, memo, Fragment, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import type { BibleVerse } from '../../../types/bible'
import type { WordNote } from '../../../api/bibleWordNote'
import type { VerseBookmark } from '../../../api/bibleBookmark'
import { useVerseReading } from '../../../hooks/useVerseReading'
import { useKaraokeProgress } from '../../../hooks/useKaraokeProgress'
import VerseReadingButton from '../../../components/prayer/VerseReadingButton'
import { isAdmin, isAuthenticated } from '../../../utils/auth'
import { useVerseBookmark } from '../../../hooks/useBibleBookmark'
import VerseBookmarkModal, { HIGHLIGHT_COLOR_BG } from './VerseBookmarkModal'
import VerseNoteSheet from './VerseNoteSheet'
import WordNoteSheet from './WordNoteSheet'
import GlossarySheet from './GlossarySheet'
import { useGlossaryChips } from '../hooks/useGlossaryChips'
import type { GlossaryEntry } from '../data/bibleGlossary'
import { HeartIcon } from '../../../components/icons/ActionIcons'
import { copyVerses, shareVerses, type VerseCopyTarget } from './verseCopy'

interface VerseItemProps {
  verse: BibleVerse
  bookNameKo?: string
  bookNumber?: number
  chapter?: number
  isRead: boolean
  onReadSuccess: (verseId: number, similarity: number) => void
  onEdit?: (verse: BibleVerse) => void
  // 음성 낭독 없이 읽음/읽음취소를 수동으로 처리 (로그인한 모든 사용자)
  onToggleRead?: (verse: BibleVerse, nextRead: boolean) => void
  // 이 절의 수동 읽음 처리가 진행 중 (중복 클릭 방지)
  isTogglingRead?: boolean
  onShowCommentary?: (verse: BibleVerse) => void
  // 오디오북을 이 절부터 재생 (절 메뉴 '여기부터 듣기')
  onListenFrom?: (verse: BibleVerse) => void
  hasCommentary?: boolean
  // 오디오북이 지금 낭독 중인 절 — 듣기-보기 동기화 하이라이트
  isAudioActive?: boolean
  // 액션바 열림 상태는 부모(VerseList)가 관리한다 — 한 번에 한 절의 메뉴만 열려
  // 다른 절을 탭하면 이전 메뉴가 닫힌다(예전 풀스크린 백드롭의 역할을 대체).
  // 콜백은 verseId를 함께 받아 부모가 절마다 클로저를 만들지 않아도 되게 한다(memo 유지).
  actionsOpen: boolean
  onActionsOpenChange: (verseId: number, open: boolean) => void
  // 이 절에 저장된 단어 노트들 — 부모가 장 단위로 배치 조회해 나눠준다
  wordNotes?: WordNote[]
  // 이 절의 북마크 — 부모(VerseList)가 장 단위로 배치 조회해 나눠준다.
  // undefined = 장 데이터 없음(로딩/미배포) → 기존 절별 조회로 폴백,
  // null = 장 데이터는 있는데 이 절엔 북마크 없음
  chapterBookmark?: VerseBookmark | null
  // 여러 절 선택 모드 — 켜지면 절을 탭할 때 액션바 대신 선택이 토글된다
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (verseId: number) => void
  // 액션바의 '여러 절' 버튼 — 이 절을 첫 선택으로 두고 선택 모드에 진입
  onEnterSelection?: (verse: BibleVerse) => void
  // 공유 — 부모(VerseList)가 공유 시트를 띄운다. 없으면 네이티브 공유로 폴백.
  onShare?: (target: VerseCopyTarget) => void
}

// 액션바의 '읽음 표시' 체크 버튼 — 절 번호 길게 누르기(HOLD_TO_READ_MS)로 같은 일을
// 할 수 있어 중복이라 숨겨둔다. 되살리려면 true로만 바꾸면 된다.
/** 절 액션 메뉴의 한 항목: 원형 아이콘 + 아래 짧은 라벨.
 *  tone: default(브랜드 연함) / active(강조·기록 있음) / success(읽음) / muted(관리자 보조) */
type VerseActionTone = 'default' | 'active' | 'success' | 'muted'
const VerseAction = ({
  icon,
  label,
  title,
  onClick,
  tone = 'default',
  busy = false,
  pressed,
  tabbable = true,
}: {
  icon: string
  label: string
  title?: string
  onClick: () => void
  tone?: VerseActionTone
  busy?: boolean
  pressed?: boolean
  tabbable?: boolean
}) => (
  <button
    type="button"
    role="menuitem"
    className={`verse-action-item verse-action-item--${tone}`}
    onClick={onClick}
    disabled={busy}
    title={title ?? label}
    aria-label={title ?? label}
    aria-pressed={pressed}
    tabIndex={tabbable ? 0 : -1}
    style={busy ? { opacity: 0.5, cursor: 'wait' } : undefined}
  >
    <span className="verse-action-btn">
      <span className="material-icons-round">{icon}</span>
    </span>
    <span className="verse-action-label">{label}</span>
  </button>
)

const SHOW_MANUAL_READ_BUTTON = false

/** 토큰 앞뒤의 문장부호를 떼고 단어만 남긴다 ("긍휼히," → "긍휼히") */
const cleanWord = (token: string) =>
  token.replace(/^[^0-9A-Za-z가-힣]+|[^0-9A-Za-z가-힣]+$/g, '')

/**
 * 단어 노트의 밑줄 범위를 확정한다. 저장된 위치가 현재 본문과 맞으면 그대로,
 * 본문이 수정돼 어긋났으면 단어 검색으로 fallback, 그래도 없으면 null(밑줄 생략).
 */
const resolveNoteRange = (note: WordNote, text: string): [number, number] | null => {
  if (
    note.char_start != null &&
    note.char_end != null &&
    note.char_start >= 0 &&
    note.char_start < note.char_end &&
    note.char_end <= text.length
  ) {
    const slice = text.slice(note.char_start, note.char_end)
    // 토큰(조사 포함)에서 단어를 다듬어 저장하므로 포함 관계면 유효한 위치로 본다
    if (slice.includes(note.word) || note.word.includes(slice)) {
      return [note.char_start, note.char_end]
    }
  }
  const idx = text.indexOf(note.word)
  return idx >= 0 ? [idx, idx + note.word.length] : null
}

const VerseItem = ({ verse, bookNameKo, bookNumber, chapter, isRead, onReadSuccess, onEdit, onToggleRead, isTogglingRead, onShowCommentary, onListenFrom, hasCommentary, isAudioActive, actionsOpen, onActionsOpenChange: setActionsOpenById, wordNotes, chapterBookmark, selectionMode, isSelected, onToggleSelect, onEnterSelection, onShare }: VerseItemProps) => {
  // 내부에선 이 절 기준의 (open) 시그니처가 편해 verse.id를 미리 물린 래퍼를 쓴다
  const onActionsOpenChange = (open: boolean) => setActionsOpenById(verse.id, open)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [showNoteSheet, setShowNoteSheet] = useState(false)
  // 단어 선택 모드 — 켜지면 본문이 단어 단위 탭 타깃으로 바뀐다
  const [wordSelectMode, setWordSelectMode] = useState(false)
  // 단어 뜻 입력/보기 시트. existing이 있으면 수정 모드
  const [wordSheet, setWordSheet] = useState<{
    initialWord: string
    charStart: number | null
    charEnd: number | null
    existing: WordNote | null
  } | null>(null)
  // 인물·지명 사전 칩을 탭하면 열리는 한 줄 설명 시트
  const [glossaryEntry, setGlossaryEntry] = useState<GlossaryEntry | null>(null)
  // 선택 모드에선 액션바가 뜨지 않는다 (탭은 선택 토글에 쓰인다)
  const showActions = actionsOpen && !selectionMode
  const isAdminUser = isAdmin()
  // 수동 읽음 처리는 로그인만 하면 누구나 (기록은 사용자별로 저장된다)
  const loggedIn = isAuthenticated()
  // 장 배치 데이터(chapterBookmark)가 오면 절별 요청은 끄고 장 데이터를 쓴다 — N+1 제거.
  // 저장/삭제 직후의 즉시 반영은 뮤테이션이 장 배치 캐시를 직접 갱신해 처리한다.
  // (detail 캐시를 우선하면 persist로 복원된 오래된 절 캐시가 신선한 장 데이터를 덮는다)
  const chapterProvided = chapterBookmark !== undefined
  const { data: fetchedBookmark } = useVerseBookmark(verse.id, !chapterProvided)
  const bookmark = chapterProvided ? chapterBookmark : fetchedBookmark
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

  // 저장된 단어 노트의 밑줄 구간 (위치순 정렬, 겹치는 건 앞선 것만)
  const noteSegments = useMemo(() => {
    if (!wordNotes?.length || !verse.text) return []
    const resolved = wordNotes
      .map((n) => ({ note: n, range: resolveNoteRange(n, verse.text) }))
      .filter((r): r is { note: WordNote; range: [number, number] } => r.range !== null)
      .sort((a, b) => a.range[0] - b.range[0])
    const out: { note: WordNote; start: number; end: number }[] = []
    let lastEnd = 0
    for (const { note, range } of resolved) {
      if (range[0] < lastEnd) continue
      out.push({ note, start: range[0], end: range[1] })
      lastEnd = range[1]
    }
    return out
  }, [wordNotes, verse.text])

  // 인물·지명 사전 칩 — 장에서 처음 나온 표제어에만, 절당 최대 3개.
  // 단어장 밑줄과 겹치는 구간은 사용자 기록(단어장)이 우선이라 칩을 버린다.
  const glossaryMatches = useGlossaryChips(
    bookNumber ?? verse.book_number,
    chapter ?? verse.chapter,
    verse.verse,
    verse.text
  )
  const glossarySegments = useMemo(
    () =>
      glossaryMatches.filter(
        (g) => !noteSegments.some((n) => n.start < g.end && n.end > g.start)
      ),
    [glossaryMatches, noteSegments]
  )

  // 단어 선택 모드용 토큰 (원본 텍스트 내 위치 보존 — 공백/줄바꿈 그대로 복원)
  const wordTokens = useMemo(() => {
    if (!verse.text) return []
    const out: { text: string; start: number; end: number }[] = []
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(verse.text))) {
      out.push({ text: m[0], start: m.index, end: m.index + m[0].length })
    }
    return out
  }, [verse.text])

  const openWordSheetForToken = (token: { text: string; start: number; end: number }) => {
    setWordSelectMode(false)
    // 이 토큰과 범위가 겹치는 노트가 있으면 수정 모드로 연다 (중복 생성 방지).
    // 단어 다듬기로 범위가 토큰 일부("완악")로 좁혀질 수 있어 시작 위치 일치만으론 부족.
    const existing =
      noteSegments.find((s) => s.start < token.end && s.end > token.start)?.note ??
      wordNotes?.find(
        (n) =>
          n.char_start != null &&
          n.char_end != null &&
          n.char_start < token.end &&
          n.char_end > token.start
      ) ??
      null
    setWordSheet({
      initialWord: cleanWord(token.text) || token.text,
      charStart: token.start,
      charEnd: token.end,
      existing,
    })
  }

  // 단어 선택 모드: 본문을 단어 단위 탭 타깃으로 렌더링
  const renderSelectableText = () => {
    const parts: ReactNode[] = []
    let cursor = 0
    wordTokens.forEach((token, i) => {
      if (token.start > cursor) {
        parts.push(<Fragment key={`gap-${i}`}>{verse.text.slice(cursor, token.start)}</Fragment>)
      }
      const isMarked = noteSegments.some((s) => s.start < token.end && s.end > token.start)
      parts.push(
        <span
          key={`tok-${i}`}
          role="button"
          onClick={(e) => {
            e.stopPropagation()
            openWordSheetForToken(token)
          }}
          style={{
            background: isMarked ? 'var(--brand-soft-strong)' : 'var(--brand-soft)',
            borderRadius: '0.25rem',
            boxShadow: '0 0 0 1px var(--brand-soft-strong)',
            cursor: 'pointer',
          }}
        >
          {token.text}
        </span>
      )
      cursor = token.end
    })
    if (cursor < verse.text.length) {
      parts.push(<Fragment key="tail">{verse.text.slice(cursor)}</Fragment>)
    }
    return parts
  }

  // 일반 모드: 저장된 단어(형광펜+실선)와 사전 칩(옅은 점선)을 위치순으로 합성한다.
  // 두 장식은 위에서 겹침을 제거했으므로 여기선 정렬만 하면 된다.
  const renderDecoratedText = () => {
    if (!noteSegments.length && !glossarySegments.length) return verse.text
    const decorations = [
      ...noteSegments.map((seg) => ({ kind: 'note' as const, seg })),
      ...glossarySegments.map((g) => ({
        kind: 'chip' as const,
        seg: { start: g.start, end: g.end, entry: g.entry },
      })),
    ].sort((a, b) => a.seg.start - b.seg.start)

    const parts: ReactNode[] = []
    let cursor = 0
    decorations.forEach((deco, i) => {
      const { seg } = deco
      if (seg.start > cursor) {
        parts.push(<Fragment key={`plain-${i}`}>{verse.text.slice(cursor, seg.start)}</Fragment>)
      }
      if (deco.kind === 'chip') {
        parts.push(
          <span
            key={`chip-${i}`}
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              setGlossaryEntry(deco.seg.entry)
            }}
            style={{
              // 단어장(실선+형광펜)과 구별되는, 은은한 점선 — 읽기를 방해하지 않는 힌트
              textDecoration: 'underline dotted',
              textDecorationColor: 'color-mix(in srgb, var(--brand) 55%, transparent)',
              textDecorationThickness: '1.5px',
              textUnderlineOffset: '0.24em',
              cursor: 'pointer',
            }}
          >
            {verse.text.slice(seg.start, seg.end)}
          </span>
        )
        cursor = seg.end
        return
      }
      renderNoteSegment(parts, deco.seg)
      cursor = seg.end
    })
    if (cursor < verse.text.length) {
      parts.push(<Fragment key="tail">{verse.text.slice(cursor)}</Fragment>)
    }
    return parts
  }

  const renderNoteSegment = (
    parts: ReactNode[],
    seg: { note: WordNote; start: number; end: number }
  ) => {
    parts.push(
      <span
        key={`note-${seg.note.id}`}
          role="button"
          title={seg.note.note || seg.note.word}
          onClick={(e) => {
            e.stopPropagation()
            setWordSheet({
              initialWord: seg.note.word,
              charStart: seg.start,
              charEnd: seg.end,
              existing: seg.note,
            })
          }}
          style={{
            // 형광펜: 글자 아래쪽 40%에 브랜드 틴트를 깔아 다크 배경에서도 확 띈다
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--brand) 34%, transparent) 0 40%, transparent 40%)',
            WebkitBoxDecorationBreak: 'clone',
            boxDecorationBreak: 'clone',
            borderRadius: '3px',
            padding: '0 1px',
            textDecoration: 'underline solid var(--brand) 2px',
            textUnderlineOffset: '0.22em',
            cursor: 'pointer',
          }}
      >
        {verse.text.slice(seg.start, seg.end)}
      </span>
    )
  }

  // 음성 인식 중에는 액션바가 닫혀서 마이크 버튼이 가려지지 않도록 보장
  useEffect(() => {
    if (isReading) {
      onActionsOpenChange(true)
    }
    // onActionsOpenChange는 매 렌더 새로 생성되지만, 의도적으로 isReading 변화에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReading])

  const hasNote = !!bookmark?.note

  // 복사/공유 대상 — 이 절 하나 (여러 절은 VerseList의 선택 바가 따로 만든다)
  const copyTarget = {
    bookNameKo: bookNameKo ?? verse.book_name_ko ?? '',
    bookNumber: bookNumber ?? verse.book_number ?? 0,
    chapter: chapter ?? verse.chapter,
    verses: [{ verse: verse.verse, text: verse.text }],
  }

  // 구절 본문에 줄 좌측 강조(블록 지정). 선택 모드에서는 선택 여부가 최우선,
  // 그다음 색 형광펜, 없으면 노트가 있을 때 은은한 브랜드 틴트로
  // "여긴 내가 묵상한 절"임을 본문 읽기를 방해하지 않는 선에서 표시.
  const rowAccent = isSelected
    ? {
        background: 'var(--brand-soft-strong)',
        borderLeft: '3px solid var(--brand)',
        borderRadius: '0.375rem',
        padding: '0.375rem 0.5rem',
      }
    : highlightBg && !isReading
      ? {
          // 다크 배경 위에서 파스텔 형광펜이 탁하게 떡지지 않도록:
          // 색 정체성은 왼쪽 바로 또렷하게 주고, 면은 아주 옅은 틴트만.
          // (highlightBg는 var(--hl-*)라 hex 알파를 못 붙인다 → color-mix)
          background: `linear-gradient(to right, color-mix(in srgb, ${highlightBg} 15%, transparent), color-mix(in srgb, ${highlightBg} 5%, transparent))`,
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

  // ── 절 번호 길게 누르기 = 읽음 표시 ──────────────────────────────────
  // 액션바를 열고 체크 버튼까지 두 번 누르던 흐름을 한 동작으로 줄인다.
  // 짧게 탭하면 기존대로 액션바가 열려서 다른 기능은 그대로 쓸 수 있다.
  const HOLD_TO_READ_MS = 600
  const holdTimerRef = useRef<number | null>(null)
  // 길게 누르기가 성사되면 뒤따라오는 click이 액션바를 열지 않도록 삼킨다
  const holdFiredRef = useRef(false)
  const holdOriginRef = useRef<{ x: number; y: number } | null>(null)
  const [isHoldingNumber, setIsHoldingNumber] = useState(false)

  // 선택/단어 모드나 음성 낭독 중엔 번호 탭이 다른 의미를 가지므로 제스처를 끈다
  const canHoldToRead = !!(loggedIn && onToggleRead && !selectionMode && !wordSelectMode && !isReading)

  const clearHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    holdOriginRef.current = null
    setIsHoldingNumber(false)
  }

  // 절이 화면에서 사라질 때(가상 스크롤/장 이동) 타이머가 남지 않도록
  useEffect(() => () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current)
  }, [])

  const handleHoldStart = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!canHoldToRead || isTogglingRead) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    holdFiredRef.current = false
    holdOriginRef.current = { x: e.clientX, y: e.clientY }
    setIsHoldingNumber(true)
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null
      holdFiredRef.current = true
      setIsHoldingNumber(false)
      // 화면을 안 봐도 "됐다"를 알 수 있게 한 번만 짧게.
      // Android 전용 — iOS는 vibrate 미지원이라 조용히 무시된다.
      if ('vibrate' in navigator) navigator.vibrate(18)
      onToggleRead?.(verse, !isRead)
    }, HOLD_TO_READ_MS)
  }

  // 손가락이 움직이면 스크롤 의도로 보고 취소 (pointercancel이 안 오는 브라우저 대비)
  const handleHoldMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const origin = holdOriginRef.current
    if (!origin) return
    if (Math.abs(e.clientX - origin.x) > 10 || Math.abs(e.clientY - origin.y) > 10) {
      clearHold()
    }
  }

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
        // 상단 정렬 스크롤(block:'start') 시 고정 헤더(56px)+오디오 미니 플레이어
        // (top-14에 뜨는 한 줄 바)에 가려지지 않도록 그 아래 지점으로 맞춘다.
        scrollMarginTop: '7rem',
      }}
    >
      {/* 구절 번호와 텍스트 (탭하면 액션바 토글) */}
      <div
        onClick={() => {
          // 여러 절 선택 모드에서는 탭이 선택 토글로 동작한다
          if (selectionMode) {
            onToggleSelect?.(verse.id)
            return
          }
          // 단어 선택 모드에서 빈 곳을 탭하면 모드만 종료 (액션바 토글 방지)
          if (wordSelectMode) {
            setWordSelectMode(false)
            return
          }
          onActionsOpenChange(!showActions)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (selectionMode) {
              onToggleSelect?.(verse.id)
              return
            }
            if (wordSelectMode) {
              setWordSelectMode(false)
              return
            }
            onActionsOpenChange(!showActions)
          }
        }}
        aria-expanded={selectionMode ? undefined : showActions}
        aria-pressed={selectionMode ? !!isSelected : undefined}
        aria-label={
          selectionMode
            ? `${verse.verse}절 ${isSelected ? '선택 해제' : '선택'}`
            : `${verse.verse}절 메뉴 ${showActions ? '닫기' : '열기'}`
        }
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
            absolute 오버레이는 어디에 둬도 붕 떠 보여서 요소 추가 없이 해결.
            (읽은 절은 행 전체 흐림 + 초록 틴트가 함께 깔려 상태가 충분히 읽힌다) */}
        <span
          className="bible-verse-number"
          title={
            canHoldToRead
              ? isRead
                ? '읽음 완료 — 길게 누르면 읽음 취소'
                : '길게 누르면 읽음 표시'
              : isRead
                ? '읽음 완료'
                : undefined
          }
          // 길게 눌러 읽음 처리 — 손가락을 떼거나 스크롤하면 취소된다
          onPointerDown={handleHoldStart}
          onPointerMove={handleHoldMove}
          onPointerUp={clearHold}
          onPointerCancel={clearHold}
          onPointerLeave={clearHold}
          // 길게 누르기가 성사된 뒤의 click은 액션바를 열지 않도록 여기서 끊는다
          onClick={(e) => {
            if (holdFiredRef.current) {
              holdFiredRef.current = false
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          // 길게 누를 때 모바일의 텍스트 선택/콜아웃 메뉴가 뜨지 않도록
          onContextMenu={(e) => { if (canHoldToRead) e.preventDefault() }}
          style={{
            ...(isRead
              ? { color: 'var(--ig-success)', animation: 'verseNumberPop 0.4s ease-out' }
              : null),
            ...(canHoldToRead
              ? {
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }
              : null),
          }}
        >
          {/* 누르고 있는 동안 번호 자리가 브랜드 색으로 차오른다 — 언제 완료되는지 보이게 */}
          {isHoldingNumber && (
            <span
              aria-hidden
              className="verse-hold-fill"
              style={{ animationDuration: `${HOLD_TO_READ_MS}ms` }}
            />
          )}
          <span style={{ position: 'relative' }}>{verse.verse}</span>
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
          ) : wordSelectMode && verse.text ? (
            renderSelectableText()
          ) : verse.text ? (
            renderDecoratedText()
          ) : (
            '(구절 내용 없음)'
          )}
        </span>

        {/* 가벼운 상태 인디케이터 - 본문 폭을 거의 잡아먹지 않음.
            하이라이트는 좌측 바+배경, 노트는 아래 칩으로 이미 보이므로 여기선 생략(중복 방지).
            남는 두 상태는 모양으로 구분: 채운 하트=즐겨찾기(내 표시), 라인 책=해석 있음(콘텐츠).
            읽음 체크는 절 번호 색으로 이동 — 읽음 처리 순간 이 행에
            아이콘이 끼어들며 본문이 재줄바꿈되던 출렁임을 없앤다. */}
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
      {wordSelectMode && (
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
            onClick={(e) => { e.stopPropagation(); setWordSelectMode(false) }}
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

      {/* 액션 메뉴 - 절을 탭하면 본문 흐름 안에서 바로 아래에 펼쳐진다.
          예전 absolute 오버레이는 다음 절을 가렸고, 닫기용 풀스크린 fixed 백드롭이
          모바일 스크롤을 막았다. 인라인(in-flow) 배치로 두 문제를 함께 해결한다.
          (다른 절을 탭하면 부모가 이 메뉴를 닫아 항상 한 절만 열린다)
          아이콘만으로는 기능을 짐작하기 어려워, 각 아이콘 아래에 짧은 라벨을 붙인다. */}
      {showActions && (
          <div
            role="menu"
            className="verse-action-popover"
            style={{ animation: 'versePopIn 0.16s ease-out' }}
          >
            {/* 음성 낭독 — 왼손 엄지로 누르기 쉽게 맨 왼쪽에 배치 */}
            {isSupported && (
              <div className="verse-action-item verse-action-item--static">
                <VerseReadingButton
                  isReading={isReading}
                  isStarting={isStarting}
                  isSupported={isSupported}
                  onClick={isReading ? stopReading : handleStartReading}
                  onPrime={primeMicrophone}
                  disabled={isRead}
                  size="sm"
                />
                <span className="verse-action-label">{isReading ? '중지' : '낭독'}</span>
              </div>
            )}

            {isSupported && <span aria-hidden className="verse-action-sep" />}

            {/* 읽음 표시 — 음성 낭독이 어려운 상황(조용한 곳·마이크 미지원)에서도
                직접 읽은 절을 체크할 수 있게 한다. 로그인한 사용자면 누구나 사용. */}
            {SHOW_MANUAL_READ_BUTTON && loggedIn && onToggleRead && (
              <VerseAction
                icon={isRead ? 'remove_done' : 'task_alt'}
                label={isRead ? '읽음 취소' : '읽음'}
                title={isRead ? '읽음 취소' : '읽음 표시'}
                tone={isRead ? 'success' : 'default'}
                busy={isTogglingRead}
                pressed={isRead}
                tabbable={showActions}
                onClick={() => { if (!isTogglingRead) onToggleRead(verse, !isRead) }}
              />
            )}

            {/* 주요 액션: 북마크·해석 (가장 자주 쓰는 묵상 동작을 앞에 배치) */}
            <VerseAction
              icon={
                bookmark
                  ? bookmark.is_favorite
                    ? 'favorite'
                    : bookmark.note
                      ? 'bookmark'
                      : 'brush'
                  : 'bookmark_border'
              }
              label={bookmark ? (bookmark.note ? '노트' : '북마크') : '북마크'}
              title={bookmark ? '묵상 노트 수정' : '묵상/북마크 추가'}
              tone={bookmark ? 'active' : 'default'}
              tabbable={showActions}
              onClick={() => { onActionsOpenChange(false); setShowBookmarkModal(true) }}
            />

            {/* 모르는 단어 체크 — 단어 선택 모드 진입 */}
            <VerseAction
              icon="spellcheck"
              label="단어"
              title="모르는 단어 체크"
              tone={(wordNotes?.length ?? 0) > 0 ? 'active' : 'default'}
              tabbable={showActions}
              onClick={() => { onActionsOpenChange(false); setWordSelectMode(true) }}
            />

            {onShowCommentary && (
              <VerseAction
                icon="menu_book"
                label="해석"
                title={hasCommentary ? '해석 보기' : '해석 (등록된 해석 없음)'}
                tone={hasCommentary ? 'active' : 'default'}
                tabbable={showActions}
                onClick={() => { onActionsOpenChange(false); onShowCommentary(verse) }}
              />
            )}

            {/* 여기부터 듣기 — 오디오북을 이 절부터 재생 */}
            {onListenFrom && (
              <VerseAction
                icon="play_circle"
                label="듣기"
                title="여기부터 듣기"
                tabbable={showActions}
                onClick={() => { onActionsOpenChange(false); onListenFrom(verse) }}
              />
            )}

            {/* 구분선: 묵상 ↔ 나눔 그룹 분리 */}
            <span aria-hidden className="verse-action-sep" />

            {/* 나눔: 복사 — 좋은 구절을 바로 클립보드로 */}
            <VerseAction
              icon="content_copy"
              label="복사"
              title="구절 복사"
              tabbable={showActions}
              onClick={() => { onActionsOpenChange(false); copyVerses(copyTarget) }}
            />

            {/* 나눔: 공유 — 미리보기 시트를 띄운다 (부모가 없으면 네이티브 공유로 폴백) */}
            <VerseAction
              icon="share"
              label="공유"
              title="구절 공유"
              tabbable={showActions}
              onClick={() => {
                onActionsOpenChange(false)
                if (onShare) onShare(copyTarget)
                else shareVerses(copyTarget)
              }}
            />

            {/* 나눔: 여러 절 선택 — 이 절부터 구간으로 묶어 복사/공유 */}
            {onEnterSelection && (
              <VerseAction
                icon="checklist"
                label="여러 절"
                title="여러 절 선택"
                tabbable={showActions}
                onClick={() => { onActionsOpenChange(false); onEnterSelection(verse) }}
              />
            )}

            {/* 보조 액션: 구절 수정 (관리자) */}
            {isAdminUser && onEdit && (
              <>
                <span aria-hidden className="verse-action-sep" />
                <VerseAction
                  icon="edit"
                  label="수정"
                  title="구절 수정 (관리자)"
                  tone="muted"
                  tabbable={showActions}
                  onClick={() => { onActionsOpenChange(false); onEdit(verse) }}
                />
              </>
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

      {/* 단어 뜻/메모 시트 - 단어 선택 또는 밑줄 단어 탭으로 열림 */}
      {wordSheet && (
        <WordNoteSheet
          verseId={verse.id}
          verseReference={`${bookNameKo ?? verse.book_name_ko ?? ''} ${chapter ?? verse.chapter}:${verse.verse}`.trim()}
          verseText={verse.text}
          initialWord={wordSheet.initialWord}
          charStart={wordSheet.charStart}
          charEnd={wordSheet.charEnd}
          existing={wordSheet.existing}
          onClose={() => setWordSheet(null)}
        />
      )}

      {/* 인물·지명 사전 시트 — 점선 칩을 탭했을 때 */}
      {glossaryEntry && (
        <GlossarySheet entry={glossaryEntry} onClose={() => setGlossaryEntry(null)} />
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

// 장의 모든 절이 이 컴포넌트로 렌더된다(시편 119편은 176개). memo가 없으면
// 오디오 하이라이트 이동·액션바 토글 같은 부모 상태 변화마다 전 절이 재렌더되므로
// 부모(VerseList)는 콜백을 useCallback으로 안정화해 내려보내야 한다.
export default memo(VerseItem)
