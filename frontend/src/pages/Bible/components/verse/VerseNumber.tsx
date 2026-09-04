import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { HOLD_TO_READ_MS } from './useHoldToRead'

interface VerseNumberProps {
  number: number
  isRead: boolean
  /** 길게 누르기(읽음 표시) 제스처가 살아 있는지 — 안내 문구·텍스트 선택 차단에 쓰인다 */
  canHoldToRead: boolean
  /** 누르고 있는 동안 번호 자리가 브랜드 색으로 차오른다 */
  isHolding: boolean
  holdHandlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
    onPointerLeave: () => void
    onClick: (e: ReactMouseEvent<HTMLElement>) => void
    onContextMenu: (e: ReactMouseEvent<HTMLElement>) => void
  }
}

/** 절 번호 — 절별/이어읽기 두 보기 공통. 읽음 색·길게 누르기·차오름 표시를 품는다. */
const VerseNumber = ({ number, isRead, canHoldToRead, isHolding, holdHandlers }: VerseNumberProps) => (
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
    {...holdHandlers}
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
    {isHolding && (
      <span
        aria-hidden
        className="verse-hold-fill"
        style={{ animationDuration: `${HOLD_TO_READ_MS}ms` }}
      />
    )}
    <span style={{ position: 'relative' }}>{number}</span>
  </span>
)

export default VerseNumber
