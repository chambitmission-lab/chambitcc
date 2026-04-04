import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export const useMenuState = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return {
    isMenuOpen,
    setIsMenuOpen,
    menuRef
  }
}
