import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const navigate = useNavigate()

  const isLoggedIn = () => {
    return !!localStorage.getItem('access_token')
  }

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn()) {
      navigate('/login')
      return false
    }
    action()
    return true
  }

  const requireAuthWithRedirect = (path: string) => {
    if (!isLoggedIn()) {
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
