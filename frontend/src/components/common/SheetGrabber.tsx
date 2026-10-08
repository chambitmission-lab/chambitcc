import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * 바텀시트 손잡이(그랩바) — 손잡이를 잡고 끌어내리면 시트가 따라 내려가고,
 * 일정 거리(또는 빠른 플릭) 넘게 내리면 onClose. 아니면 제자리로 복귀.
 *
 * 본문 스크롤과 다투지 않도록 손잡이에서 시작한 끌기만 받는다(본문 끌어닫기는 쓰지 않음).
 * 끌리는 대상은 손잡이와 윗변을 공유하는 가장 바깥 조상(= 시트 패널) — 화면 전체를 덮는
 * 오버레이·딤까지는 올라가지 않는다. 특별한 구조면 패널에 data-sheet-root 를 달면 그걸 쓴다.
 * framer 가 transform 을 쥔 요소여도 충돌하지 않게 CSS 개별 속성 `translate` 로 옮긴다.
 *
 * 생김새는 기존 손잡이 className 을 그대로 받는다(.sheet-grabber 가 보이지 않는 터치 영역을 넓혀 줌).
 */
export function SheetGrabber({
  onClose,
  className,
  style,
  threshold = 100,
}: {
  onClose: () => void
  className?: string
  style?: CSSProperties
  threshold?: number
}) {
  const drag = useRef<{ id: number; startY: number; startT: number; dy: number; target: HTMLElement } | null>(null)

  const findSheet = (handle: HTMLElement): HTMLElement => {
    const root = handle.closest<HTMLElement>('[data-sheet-root]')
    if (root) return root
    const top = handle.getBoundingClientRect().top
    let el = handle.parentElement
    let sheet: HTMLElement = el ?? handle
    while (el && el !== document.body) {
      if (el.getBoundingClientRect().top < top - 48) break
      sheet = el
      el = el.parentElement
    }
    return sheet
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = findSheet(e.currentTarget)
    drag.current = { id: e.pointerId, startY: e.clientY, startT: e.timeStamp, dy: 0, target }
    e.currentTarget.setPointerCapture(e.pointerId)
    target.style.transition = 'none'
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const raw = e.clientY - d.startY
    // 위로는 살짝만 고무줄처럼
    d.dy = raw >= 0 ? raw : -Math.min(12, Math.sqrt(-raw) * 2)
    d.target.style.translate = `0 ${d.dy}px`
  }

  const finish = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const velocity = d.dy / Math.max(1, e.timeStamp - d.startT) // px/ms
    if (!cancelled && (d.dy > threshold || (d.dy > 30 && velocity > 0.5))) {
      // 내려간 자리에서 그대로 퇴장 애니메이션이 이어지도록 translate 는 남겨 둔다
      const el = d.target
      el.style.transition = ''
      onClose()
      // 닫혀도 DOM 에 남는 시트(다시 열 때)를 위해 퇴장 뒤 원위치
      window.setTimeout(() => { el.style.translate = '' }, 600)
      return
    }
    const el = d.target
    el.style.transition = 'translate .25s ease'
    el.style.translate = ''
    window.setTimeout(() => { el.style.transition = '' }, 260)
  }

  return (
    <div
      aria-hidden="true"
      className={`sheet-grabber ${className ?? ''}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      // 끌기 끝의 click 이 딤/오버레이 onClick(닫기)까지 번져 두 번 닫히지 않게
      onClick={(e) => e.stopPropagation()}
    />
  )
}
