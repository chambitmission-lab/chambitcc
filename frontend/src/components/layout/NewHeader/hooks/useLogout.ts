import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export const useLogout = (setIsLoggedIn: (value: boolean) => void, setIsAdminUser: (value: boolean) => void) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    // 1. 진행 중인 쿼리 취소
    await queryClient.cancelQueries()
    
    // 2. React Query 메모리 캐시 삭제
    queryClient.clear()
    
    // 3. localStorage 정리 (토큰, 사용자 정보, 영구 캐시)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_username')
    localStorage.removeItem('user_full_name')
    localStorage.removeItem('user_fingerprint')
    localStorage.removeItem('REACT_QUERY_CACHE')
    
    // 4. 상태 업데이트
    setIsLoggedIn(false)
    setIsAdminUser(false)
    
    // 5. 홈으로 이동 (리로드 없이 React Router로 처리)
    navigate('/', { replace: true })
  }

  return { handleLogout }
}
