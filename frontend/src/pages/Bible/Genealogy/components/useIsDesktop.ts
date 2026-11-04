import { useEffect, useState } from 'react'

/** lg(1024px) 이상 — 열두 지파·제자 보기의 PC 패널 / 모바일 시트 분기 */
export const useIsDesktop = () => {
  const query = '(min-width: 1024px)'
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}
