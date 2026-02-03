import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

export const useAuth = () => {
  const navigate = useNavigate()

  const isLoggedIn = () => {
    return !!localStorage.getItem('access_token')
  }

  const requireAuth = (action: () => void, message = '로그인이 필요합니다') => {
    if (!isLoggedIn()) {
      showToast(message, 'error')
      return false
    }
    action()
    return true
  }

  const requireAuthWithRedirect = (path: string, message = '로그인 후 사용할 수 있습니다') => {
    if (!isLoggedIn()) {
      showToast(message, 'info')
      navigate('/login')
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
