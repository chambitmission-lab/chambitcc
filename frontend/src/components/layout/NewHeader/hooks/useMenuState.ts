import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'

export const useMenuState = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // 모바일 뒤로가기 시 앱 종료 대신 메뉴만 닫기
  useModalBackButton(() => setIsMenuOpen(false), isMenuOpen)

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
