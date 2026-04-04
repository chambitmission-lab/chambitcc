import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

export const useAuth = () => {
  const navigate = useNavigate()

  const isLoggedIn = () => {
    return !!localStorage.getItem('access_token')
  }

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn()) {
      showToast('로그인이 필요합니다', 'info')
      setTimeout(() => navigate('/login'), 500) // 토스트 보여주고 이동
      return false
    }
    action()
    return true
  }

  const requireAuthWithRedirect = (path: string) => {
    if (!isLoggedIn()) {
      showToast('로그인이 필요합니다', 'info')
      setTimeout(() => navigate('/login'), 500) // 토스트 보여주고 이동
      return false
    }
    navigate(path)
    return true
  }

  return {
    isLoggedIn,
    requireAuth,
    requireAuthWithRedirect
  }
}
