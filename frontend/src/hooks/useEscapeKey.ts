import { useEffect, useRef } from 'react'

/**
 * 키보드가 있는 환경에서 Esc 로 모달·시트·팝오버를 닫는다.
 * (모바일 뒤로가기는 useModalBackButton 이 맡는다 — 둘은 별개다)
 *
 * Esc 가 "닫기" 외에 다른 일도 해야 하는 화면(Enter 확인, 방향키 이동, 입력 중이면 칸만
 * 빠져나오기 등)은 이 훅 대신 keydown 핸들러를 직접 둔다.
 *
 * 콜백은 ref 로 들고 있어 매 렌더 새 함수를 넘겨도 리스너를 다시 달지 않는다.
 *
 * @param onEscape 닫기 콜백
 * @param enabled 기본 true. 열려 있을 때만 듣게 하려면 열림 여부를 넘긴다.
 */
export const useEscapeKey = (onEscape: () => void, enabled: boolean = true): void => {
  const handlerRef = useRef(onEscape)
  useEffect(() => {
    handlerRef.current = onEscape
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlerRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
