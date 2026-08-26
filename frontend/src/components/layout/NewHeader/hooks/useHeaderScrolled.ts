import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// 헤더 하단 경계를 "스크롤할 때만" 세우기 위한 훅.
// 맨 위에선 헤더(흰 크롬)와 캔버스가 색 차이만으로 구분되므로 선/그림자를 지우고,
// 콘텐츠가 헤더 밑으로 파고들기 시작하면 헤어라인 + 미세 그림자를 켠다.
const THRESHOLD = 4

export const useHeaderScrolled = (): boolean => {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      setScrolled(window.scrollY > THRESHOLD)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(read)
    }
    read() // 라우트 진입 시점의 스크롤 위치로 초기화
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pathname])

  return scrolled
}
