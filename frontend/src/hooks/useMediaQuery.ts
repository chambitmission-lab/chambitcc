import { useCallback, useSyncExternalStore } from 'react'

// matchMedia 를 React 상태로 — CSS 로 숨기는 대신 "아예 마운트하지 않기" 위한 훅.
// display:none 이어도 React 가 마운트되면 그 안의 쿼리·lazy 청크가 전부 살아나므로,
// PC 전용 레일 같은 것은 실제로 보이는 폭에서만 렌더해야 한다.
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
