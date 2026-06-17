import { useEffect, useRef } from 'react'

/**
 * 모달이 열린 동안 브라우저/안드로이드 뒤로가기를 가로채 모달만 닫는다.
 *
 * - 마운트 시 히스토리 엔트리를 하나 쌓는다
 * - 뒤로가기(popstate) → 가장 최근에 열린 모달 하나만 onClose() (페이지/홈 이동 대신)
 * - 버튼/배경 클릭으로 닫힌 경우 쌓아둔 엔트리를 history.back()으로 정리
 *
 * 여러 모달이 겹쳐 열려도 뒤로가기 한 번에 최상단 모달 하나만 닫히도록
 * 모듈 전역 스택으로 닫기 콜백을 관리한다.
 *
 * @param onClose 모달을 닫는 콜백
 * @param enabled 기본 true. isOpen 처럼 조건부로 떠야 하면 열림 여부를 넘긴다.
 */

type StackEntry = { id: number; close: () => void }

const closeStack: StackEntry[] = []
let listenerAttached = false
let suppressNextPop = false
let counter = 0

const handlePop = () => {
  // 버튼/배경 클릭 정리용으로 우리가 호출한 history.back() 은 무시
  if (suppressNextPop) {
    suppressNextPop = false
    return
  }
  const top = closeStack.pop()
  if (top) top.close()
}

export function useModalBackButton(onClose: () => void, enabled = true) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!enabled) return

    const id = ++counter
    const entry: StackEntry = { id, close: () => onCloseRef.current() }
    closeStack.push(entry)
    window.history.pushState({ modalBack: id }, '')

    if (!listenerAttached) {
      window.addEventListener('popstate', handlePop)
      listenerAttached = true
    }

    return () => {
      const idx = closeStack.findIndex((e) => e.id === id)
      const stillOnTop = idx !== -1
      if (stillOnTop) closeStack.splice(idx, 1)

      // 버튼/배경 클릭으로 닫혔다면(=우리 엔트리가 아직 히스토리 top) 쌓아둔 엔트리 정리
      if (stillOnTop && window.history.state?.modalBack === id) {
        suppressNextPop = true
        window.history.back()
      }
    }
  }, [enabled])
}
