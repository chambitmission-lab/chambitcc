import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'

/** 절 번호를 이만큼 누르고 있으면 읽음 표시로 확정된다 */
export const HOLD_TO_READ_MS = 600

/** 손가락이 이보다 움직이면 스크롤 의도로 보고 취소 */
const MOVE_TOLERANCE_PX = 10

interface UseHoldToReadOptions {
  /** 제스처 활성 여부 — 선택/단어 모드나 음성 낭독 중엔 번호 탭이 다른 의미라 끈다 */
  enabled: boolean
  /** 서버 처리 중이면 중복 발화 방지 */
  busy?: boolean
  onHold: () => void
}

/**
 * 절 번호 길게 누르기 = 읽음 표시.
 * 액션바를 열고 체크 버튼까지 두 번 누르던 흐름을 한 동작으로 줄인다.
 * 짧게 탭하면 기존대로 click이 흘러가 액션바가 열린다.
 * 반환된 handlers를 번호 요소에 spread 하면 된다.
 */
export const useHoldToRead = ({ enabled, busy = false, onHold }: UseHoldToReadOptions) => {
  const timerRef = useRef<number | null>(null)
  // 길게 누르기가 성사되면 뒤따라오는 click이 액션바를 열지 않도록 삼킨다
  const firedRef = useRef(false)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const [isHolding, setIsHolding] = useState(false)

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    originRef.current = null
    setIsHolding(false)
  }

  // 절이 화면에서 사라질 때(가상 스크롤/장 이동) 타이머가 남지 않도록
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || busy) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    firedRef.current = false
    originRef.current = { x: e.clientX, y: e.clientY }
    setIsHolding(true)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      firedRef.current = true
      setIsHolding(false)
      // 화면을 안 봐도 "됐다"를 알 수 있게 한 번만 짧게.
      // Android 전용 — iOS는 vibrate 미지원이라 조용히 무시된다.
      if ('vibrate' in navigator) navigator.vibrate(18)
      onHold()
    }, HOLD_TO_READ_MS)
  }

  // pointercancel이 안 오는 브라우저 대비
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const origin = originRef.current
    if (!origin) return
    if (Math.abs(e.clientX - origin.x) > MOVE_TOLERANCE_PX || Math.abs(e.clientY - origin.y) > MOVE_TOLERANCE_PX) {
      clear()
    }
  }

  // 길게 누르기가 성사된 뒤의 click은 액션바를 열지 않도록 여기서 끊는다
  const onClick = (e: ReactMouseEvent<HTMLElement>) => {
    if (firedRef.current) {
      firedRef.current = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // 길게 누를 때 모바일의 텍스트 선택/콜아웃 메뉴가 뜨지 않도록
  const onContextMenu = (e: ReactMouseEvent<HTMLElement>) => {
    if (enabled) e.preventDefault()
  }

  return {
    isHolding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onClick,
      onContextMenu,
    },
  }
}
