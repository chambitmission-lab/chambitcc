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
// 닫힌 모달의 엔트리 정리(back) 타이머. history.back()은 비동기 트래버설이라
// 곧바로 이어지는 pushState(StrictMode 재마운트, 모달 연속 전환)와 순서가 엉키면
// 모달 엔트리가 forward 쪽 고아로 남아 뒤로가기 한 번에 페이지까지 빠져나간다.
// 그래서 back을 한 틱 미루고, 그 사이 새 모달이 열리면 취소 후 엔트리를 재사용한다.
let pendingCleanup: number | null = null

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

    if (pendingCleanup !== null && window.history.state?.modalBack != null) {
      // 직전 모달의 엔트리가 아직 정리(back) 전 — back을 취소하고 엔트리를 물려받는다
      window.clearTimeout(pendingCleanup)
      pendingCleanup = null
      window.history.replaceState({ modalBack: id }, '')
    } else {
      window.history.pushState({ modalBack: id }, '')
    }

    if (!listenerAttached) {
      window.addEventListener('popstate', handlePop)
      listenerAttached = true
    }

    return () => {
      const idx = closeStack.findIndex((e) => e.id === id)
      const stillOnTop = idx !== -1
      if (stillOnTop) closeStack.splice(idx, 1)

      // 버튼/배경 클릭으로 닫혔다면(=우리 엔트리가 아직 히스토리 top) 쌓아둔 엔트리 정리.
      // 실행 시점에 다시 검사하므로 사용자가 그 사이 뒤로가기를 눌렀어도 이중 back이 없다.
      if (stillOnTop && window.history.state?.modalBack === id) {
        pendingCleanup = window.setTimeout(() => {
          pendingCleanup = null
          if (window.history.state?.modalBack === id) {
            suppressNextPop = true
            window.history.back()
          }
        }, 0)
      }
    }
  }, [enabled])
}
