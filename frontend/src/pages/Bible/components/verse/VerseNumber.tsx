import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { HOLD_TO_READ_MS } from './useHoldToRead'

interface VerseNumberProps {
  /** 찍을 번호 — 보통 절 번호지만 병합 구간은 '18-19'처럼 범위다 */
  label: string
  isRead: boolean
  /** 방금 사용자가 읽음으로 바꾼 절만 튀어오른다 — 서버 상태가 뒤늦게 도착해 칠해지는 절은 색만 스르르 */
  pop: boolean
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
const VerseNumber = ({ label, isRead, pop, canHoldToRead, isHolding, holdHandlers }: VerseNumberProps) => (
  <span
    // '18-19' 같은 병합 범위는 두 자리용 거터에 안 들어간다 — CSS 가 줄바꿈을 막는다
    className={`bible-verse-number${label.includes('-') ? ' bible-verse-number--range' : ''}`}
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
      transition: 'color 0.35s ease',
      ...(isRead
        ? { color: 'var(--ig-success)', animation: pop ? 'verseNumberPop 0.4s ease-out' : undefined }
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
    <span style={{ position: 'relative' }}>{label}</span>
  </span>
)

export default VerseNumber
