import type { BibleVerse } from '../../../../types/bible'
import type { VerseBookmark } from '../../../../api/bibleBookmark'
import VerseReadingButton from '../../../../components/prayer/VerseReadingButton'
import { copyVerses, shareVerses, type VerseCopyTarget } from '../verseCopy'

/** 액션 메뉴의 한 항목: 원형 아이콘 + 아래 짧은 라벨.
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
}: {
  icon: string
  label: string
  title?: string
  onClick: () => void
  tone?: VerseActionTone
  busy?: boolean
  pressed?: boolean
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
    style={busy ? { opacity: 0.5, cursor: 'wait' } : undefined}
  >
    <span className="verse-action-btn">
      <span className="material-icons-round">{icon}</span>
    </span>
    <span className="verse-action-label">{label}</span>
  </button>
)

// 액션바의 '읽음 표시' 체크 버튼 — 절 번호 길게 누르기로 같은 일을
// 할 수 있어 중복이라 숨겨둔다. 되살리려면 true로만 바꾸면 된다.
const SHOW_MANUAL_READ_BUTTON = false

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
}

interface VerseActionPopoverProps {
  verse: BibleVerse
  copyTarget: VerseCopyTarget
  isRead: boolean
  isTogglingRead: boolean
  loggedIn: boolean
  isAdminUser: boolean
  bookmark: VerseBookmark | null | undefined
  hasWordNotes: boolean
  hasCommentary: boolean
  reading: VerseReadingControls
  handlers: VerseActionHandlers
  /** 항목을 고르면 메뉴를 닫는다 — 열림 상태는 부모(VerseList)가 관리 */
  onClose: () => void
}

/** 절 아래(list) 또는 문단 흐름 안(flow)에서 펼쳐지는 절 액션 메뉴 */
const VerseActionPopover = ({
  verse,
  copyTarget,
  isRead,
  isTogglingRead,
  loggedIn,
  isAdminUser,
  bookmark,
  hasWordNotes,
  hasCommentary,
  reading,
  handlers,
  onClose,
}: VerseActionPopoverProps) => {
  // 메뉴 항목은 하나 고르면 닫힌다
  const pick = (fn: () => void) => () => {
    onClose()
    fn()
  }

  return (
    <div role="menu" className="verse-action-popover" style={{ animation: 'versePopIn 0.16s ease-out' }}>
      {/* 음성 낭독 — 왼손 엄지로 누르기 쉽게 맨 왼쪽에 배치 */}
      {reading.isSupported && (
        <div className="verse-action-item verse-action-item--static">
          <VerseReadingButton
            isReading={reading.isReading}
            isStarting={reading.isStarting}
            isSupported={reading.isSupported}
            onClick={reading.isReading ? reading.onStop : reading.onStart}
            onPrime={reading.onPrime}
            disabled={isRead}
            size="sm"
          />
          <span className="verse-action-label">{reading.isReading ? '중지' : '낭독'}</span>
        </div>
      )}

      {reading.isSupported && <span aria-hidden className="verse-action-sep" />}

      {/* 읽음 표시 — 음성 낭독이 어려운 상황(조용한 곳·마이크 미지원)에서도
          직접 읽은 절을 체크할 수 있게 한다. 로그인한 사용자면 누구나 사용. */}
      {SHOW_MANUAL_READ_BUTTON && loggedIn && handlers.onToggleRead && (
        <VerseAction
          icon={isRead ? 'remove_done' : 'task_alt'}
          label={isRead ? '읽음 취소' : '읽음'}
          title={isRead ? '읽음 취소' : '읽음 표시'}
          tone={isRead ? 'success' : 'default'}
          busy={isTogglingRead}
          pressed={isRead}
          onClick={() => {
            if (!isTogglingRead) handlers.onToggleRead?.(verse, !isRead)
          }}
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
        onClick={pick(handlers.onOpenBookmark)}
      />

      {/* 모르는 단어 체크 — 단어 선택 모드 진입 */}
      <VerseAction
        icon="spellcheck"
        label="단어"
        title="모르는 단어 체크"
        tone={hasWordNotes ? 'active' : 'default'}
        onClick={pick(handlers.onEnterWordSelect)}
      />

      {handlers.onShowCommentary && (
        <VerseAction
          icon="menu_book"
          label="해석"
          title={hasCommentary ? '해석 보기' : '해석 (등록된 해석 없음)'}
          tone={hasCommentary ? 'active' : 'default'}
          onClick={pick(() => handlers.onShowCommentary?.(verse))}
        />
      )}

      {/* 여기부터 듣기 — 오디오북을 이 절부터 재생 */}
      {handlers.onListenFrom && (
        <VerseAction
          icon="play_circle"
          label="듣기"
          title="여기부터 듣기"
          onClick={pick(() => handlers.onListenFrom?.(verse))}
        />
      )}

      {/* 구분선: 묵상 ↔ 나눔 그룹 분리 */}
      <span aria-hidden className="verse-action-sep" />

      {/* 나눔: 복사 — 좋은 구절을 바로 클립보드로 */}
      <VerseAction icon="content_copy" label="복사" title="구절 복사" onClick={pick(() => copyVerses(copyTarget))} />

      {/* 나눔: 공유 — 미리보기 시트를 띄운다 (부모가 없으면 네이티브 공유로 폴백) */}
      <VerseAction
        icon="share"
        label="공유"
        title="구절 공유"
        onClick={pick(() => {
          if (handlers.onShare) handlers.onShare(copyTarget)
          else shareVerses(copyTarget)
        })}
      />

      {/* 나눔: 여러 절 선택 — 이 절부터 구간으로 묶어 복사/공유 */}
      {handlers.onEnterSelection && (
        <VerseAction
          icon="checklist"
          label="여러 절"
          title="여러 절 선택"
          onClick={pick(() => handlers.onEnterSelection?.(verse))}
        />
      )}

      {/* 보조 액션: 구절 수정 (관리자) */}
      {isAdminUser && handlers.onEdit && (
        <>
          <span aria-hidden className="verse-action-sep" />
          <VerseAction
            icon="edit"
            label="수정"
            title="구절 수정 (관리자)"
            tone="muted"
            onClick={pick(() => handlers.onEdit?.(verse))}
          />
        </>
      )}
    </div>
  )
}

export default VerseActionPopover
