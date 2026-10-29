import type { ReactNode } from 'react'
import type { BibleVerse } from '../../../../types/bible'
import type { VerseBookmark } from '../../../../api/bibleBookmark'
import { copyVerses, shareVerses, type VerseCopyTarget } from '../verseCopy'

/** 액션 메뉴의 주요 칸: 선 아이콘 + 아래 짧은 라벨.
 *  tone: default / active(기록 있음 — 등불색 + 점) */
type VerseActionTone = 'default' | 'active'

const VerseAction = ({
  icon,
  label,
  title,
  onClick,
  tone = 'default',
}: {
  icon: string
  label: string
  title?: string
  onClick: () => void
  tone?: VerseActionTone
}) => (
  <button
    type="button"
    role="menuitem"
    className={`verse-action-item verse-action-item--${tone}`}
    onClick={onClick}
    title={title ?? label}
    aria-label={title ?? label}
  >
    <span className="verse-action-btn">
      <span className="material-icons-round">{icon}</span>
    </span>
    <span className="verse-action-label">{label}</span>
  </button>
)

/** 아래 줄의 글자 버튼 — 덜 자주 쓰는 동작 */
const VerseLink = ({
  label,
  title,
  onClick,
  className = '',
  disabled,
  onPointerDown,
  children,
}: {
  label: string
  title?: string
  onClick: () => void
  className?: string
  disabled?: boolean
  onPointerDown?: () => void
  children?: ReactNode
}) => (
  <button
    type="button"
    role="menuitem"
    className={`verse-lamp-link ${className}`}
    onClick={onClick}
    onPointerDown={onPointerDown}
    disabled={disabled}
    title={title ?? label}
  >
    {children}
    {label}
  </button>
)

/** 머리줄 불꽃 — 어느 테마든 등불 주황 그대로 (빛 색만 테마를 따른다) */
const LampFlame = () => (
  <svg width="10" height="13" viewBox="0 0 10 13" aria-hidden>
    <path d="M5 .5C7 3.3 8.6 5.4 8.6 8a3.6 3.6 0 0 1-7.2 0C1.4 5.4 3 3.3 5 .5z" fill="#ffb246" />
    <path d="M5 6c.9 1.2 1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 .6-1.8 1.5-3z" fill="#fff3c4" />
  </svg>
)

/** 음성 낭독 상태 — useVerseReading의 결과 중 메뉴가 필요로 하는 부분만 */
export interface VerseReadingControls {
  isSupported: boolean
  isReading: boolean
  isStarting: boolean
  onStart: () => void
  onStop: () => void
  onPrime: () => void
}

/** 메뉴 항목이 눌렸을 때 부모가 처리하는 동작들. 없는 항목은 메뉴에서 빠진다. */
export interface VerseActionHandlers {
  onOpenBookmark: () => void
  onEnterWordSelect: () => void
  onToggleRead?: (verse: BibleVerse, nextRead: boolean) => void
  onShowCommentary?: (verse: BibleVerse) => void
  onListenFrom?: (verse: BibleVerse) => void
  onEnterSelection?: (verse: BibleVerse) => void
  onShare?: (target: VerseCopyTarget) => void
  onEdit?: (verse: BibleVerse) => void
  /** 함께 읽기 — 이 절의 묵상 나눔 시트 */
  onOpenReflections?: () => void
}

interface VerseActionPopoverProps {
  verse: BibleVerse
  /** 머리줄에 찍을 장절 (예: '베드로전서 2:11') */
  reference: string
  copyTarget: VerseCopyTarget
  isRead: boolean
  isAdminUser: boolean
  bookmark: VerseBookmark | null | undefined
  hasWordNotes: boolean
  hasCommentary: boolean
  /** 이 절에 남겨진 공개 묵상 수 — 있으면 '나눔' 항목을 강조 */
  reflectionCount?: number
  reading: VerseReadingControls
  handlers: VerseActionHandlers
  /** 항목을 고르면 메뉴를 닫는다 — 열림 상태는 부모(VerseList)가 관리 */
  onClose: () => void
}

/** 머리줄 안내 — 이 절에 이미 있는 것들을 한 줄로 */
const summaryOf = (hasCommentary: boolean, reflectionCount: number, bookmark: VerseBookmark | null | undefined) => {
  const parts: string[] = []
  if (hasCommentary) parts.push('해석')
  if (reflectionCount > 0) parts.push(`성도 묵상 ${reflectionCount}`)
  if (bookmark?.note) parts.push('내 노트')
  return parts.length ? parts.join(' · ') : '이 말씀에 머물러 보세요'
}

/** 절 아래(list) 또는 문단 흐름 안(flow)에서 펼쳐지는 절 액션 메뉴 — '은은한 등불' */
const VerseActionPopover = ({
  verse,
  reference,
  copyTarget,
  isRead,
  isAdminUser,
  bookmark,
  hasWordNotes,
  hasCommentary,
  reflectionCount = 0,
  reading,
  handlers,
  onClose,
}: VerseActionPopoverProps) => {
  // 메뉴 항목은 하나 고르면 닫힌다
  const pick = (fn: () => void) => () => {
    onClose()
    fn()
  }
  const readingActive = reading.isReading || reading.isStarting

  return (
    <div role="menu" className="verse-action-popover" style={{ animation: 'versePopIn 0.16s ease-out' }}>
      <div className="verse-lamp-head">
        <LampFlame />
        <strong>{reference}</strong>
        <span>· {summaryOf(hasCommentary, reflectionCount, bookmark)}</span>
      </div>

      {/* 자주 쓰는 다섯 — 묵상(해석·북마크·듣기) → 나눔(나눔·공유) 순 */}
      <div className="verse-lamp-main">
        {handlers.onShowCommentary && (
          <VerseAction
            icon="menu_book"
            label="해석"
            title={hasCommentary ? '해석 보기' : '해석 (등록된 해석 없음)'}
            tone={hasCommentary ? 'active' : 'default'}
            onClick={pick(() => handlers.onShowCommentary?.(verse))}
          />
        )}

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
          onClick={pick(handlers.onOpenBookmark)}
        />

        {/* 여기부터 듣기 — 오디오북을 이 절부터 재생 */}
        {handlers.onListenFrom && (
          <VerseAction
            icon="play_circle"
            label="듣기"
            title="여기부터 듣기"
            onClick={pick(() => handlers.onListenFrom?.(verse))}
          />
        )}

        {/* 함께 읽기 — 같은 말씀을 읽는 성도들과 묵상 나누기 */}
        {handlers.onOpenReflections && (
          <VerseAction
            icon="forum"
            label="나눔"
            title={reflectionCount > 0 ? `성도의 묵상 ${reflectionCount}개 보기` : '이 말씀에 묵상 남기기'}
            tone={reflectionCount > 0 ? 'active' : 'default'}
            onClick={pick(() => handlers.onOpenReflections?.())}
          />
        )}

        {/* 공유 — 미리보기 시트를 띄운다 (부모가 없으면 네이티브 공유로 폴백) */}
        <VerseAction
          icon="share"
          label="공유"
          title="구절 공유"
          onClick={pick(() => {
            if (handlers.onShare) handlers.onShare(copyTarget)
            else shareVerses(copyTarget)
          })}
        />
      </div>

      <div className="verse-lamp-links">
        <VerseLink
          label="단어"
          title="모르는 단어 체크"
          className={hasWordNotes ? 'verse-lamp-link--on' : ''}
          onClick={pick(handlers.onEnterWordSelect)}
        />

        {/* 소리 내어 읽기 — 메뉴를 닫지 않는다(읽는 동안 '멈추기'가 여기 남아야 한다).
            누르기 직전(pointerdown)에 마이크 권한을 미리 확보해 첫 탭 지연을 줄인다. */}
        {reading.isSupported && (
          <VerseLink
            label={reading.isStarting ? '준비 중…' : reading.isReading ? '멈추기' : '소리 내어 읽기'}
            title={reading.isReading ? '음성 낭독 멈추기' : '소리 내어 읽고 읽음 표시'}
            className={readingActive ? 'verse-lamp-link--on' : ''}
            disabled={isRead && !readingActive}
            onPointerDown={() => { if (!readingActive && !isRead) reading.onPrime() }}
            onClick={reading.isReading ? reading.onStop : reading.onStart}
          >
            {readingActive && <span className="material-icons-round">graphic_eq</span>}
          </VerseLink>
        )}

        <VerseLink label="복사" title="구절 복사" onClick={pick(() => copyVerses(copyTarget))} />

        {/* 여러 절 선택 — 이 절부터 구간으로 묶어 복사/공유 */}
        {handlers.onEnterSelection && (
          <VerseLink
            label="여러 절"
            title="여러 절 선택"
            onClick={pick(() => handlers.onEnterSelection?.(verse))}
          />
        )}

        {/* 구절 수정 (관리자) */}
        {isAdminUser && handlers.onEdit && (
          <VerseLink
            label="수정"
            title="구절 수정 (관리자)"
            className="verse-lamp-link--muted"
            onClick={pick(() => handlers.onEdit?.(verse))}
          />
        )}
      </div>
    </div>
  )
}

export default VerseActionPopover
