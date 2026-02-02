export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_URL}/api/v1`

// 401 에러 처리를 위한 fetch wrapper
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options)

  // 401 Unauthorized 에러 처리
  if (response.status === 401) {
    // 토큰 제거
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    
    // 현재 페이지 저장 (로그인 후 돌아오기 위해)
    const currentPath = window.location.pathname + window.location.search
    if (currentPath !== '/login' && currentPath !== '/register') {
      sessionStorage.setItem('redirect_after_login', currentPath)
    }
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login'
    
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
  }

  return response
}
