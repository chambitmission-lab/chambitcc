import { useEffect, type RefObject } from 'react'

/**
 * 열려 있는 팝오버·메뉴를 바깥 클릭(pointerdown) 또는 Esc 로 닫는다.
 * `open=false` 면 리스너를 달지 않는다.
 */
export const useDismissOnOutside = (
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
): void => {
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}
