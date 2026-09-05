import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../../../utils/auth'
import { can } from '../../../../utils/access'

export const useAuthState = () => {
  // 초기값을 lazy initializer로 즉시 계산한다.
  // useState(false)로 시작하면 새로고침 시 첫 렌더에 비로그인 CTA가 잠깐 그려졌다가
  // useEffect 이후 알림+아바타로 교체되는 깜빡임이 생긴다.
  // localStorage 읽기는 동기라 첫 렌더부터 정답을 알 수 있다.
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated())
  const [isAdminUser, setIsAdminUser] = useState(() => can('admin:access'))
  const location = useLocation()

  // 라우트 이동 시 재확인 — 로그인/로그아웃 직후 페이지 전환에서 상태를 따라잡는다.
  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setIsAdminUser(can('admin:access'))
  }, [location])

  return {
    isLoggedIn,
    isAdminUser,
    setIsLoggedIn,
    setIsAdminUser
  }
}
