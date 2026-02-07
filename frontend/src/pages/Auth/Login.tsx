import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_V1 } from '../../config/api'

const Login = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
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
        throw new Error(data.detail || t('loginFailed'))
      }

      // 토큰 저장
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
      
      // React Query 캐시 초기화
      await queryClient.invalidateQueries()
      
      // 저장된 리다이렉트 경로가 있으면 그곳으로, 없으면 홈으로
      const redirectPath = sessionStorage.getItem('redirect_after_login')
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login')
        navigate(redirectPath, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-sm w-full my-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter font-display text-gray-900 dark:text-white mb-2">
            {t('aboutChurchName')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('loginWelcome')}
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
                placeholder={t('loginUsername')}
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
                placeholder={t('loginPassword')}
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg text-sm hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
            >
              {loading ? t('loginLoading') : t('loginButton')}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('loginNoAccount')}{' '}
            <Link 
              to="/register" 
              className="font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              {t('loginSignUp')}
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            {t('loginBackHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
