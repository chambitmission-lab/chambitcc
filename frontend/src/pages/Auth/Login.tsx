import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_V1 } from '../../config/api'
import { queryClient } from '../../config/queryClient'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formBody = new URLSearchParams()
      formBody.append('username', formData.username)
      formBody.append('password', formData.password)

      const response = await fetch(`${API_V1}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || '로그인에 실패했습니다')
      }

      localStorage.setItem('access_token', data.access_token)
      // 사용자 정보 저장 (username과 full_name)
      if (data.username) {
        localStorage.setItem('user_username', data.username)
      } else {
        // 백엔드에서 username을 반환하지 않으면 입력한 값 사용
        localStorage.setItem('user_username', formData.username)
      }
      if (data.full_name) {
        localStorage.setItem('user_full_name', data.full_name)
      }
      
      // 저장된 리다이렉트 경로가 있으면 그곳으로, 없으면 홈으로
      const redirectPath = sessionStorage.getItem('redirect_after_login')
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login')
        window.location.href = redirectPath
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter font-display text-gray-900 dark:text-white mb-2">
            참빛교회
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            참빛교회에 오신 것을 환영합니다
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-8 mb-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="아이디"
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호"
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
