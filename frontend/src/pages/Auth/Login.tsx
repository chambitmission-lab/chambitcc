import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_V1 } from '../../config/api'
import { clearAllPersistedCache } from '../../config/persister'
import { restorePushSubscriptionForUser } from '../../utils/pushNotification'

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
        // 백엔드 detail 문구는 한국어/영어로 고정되어 있으므로 그대로 노출하지 않고,
        // 현재 선택된 언어에 맞는 번역 메시지로 변환해서 보여준다.
        // 403은 사유가 여러 개(승인 대기 / 거절 / 정지)라 X-Auth-Reason 헤더로 구분한다.
        let message = t('loginFailed')
        if (response.status === 401) {
          message = t('loginInvalidCredentials')
        } else if (response.status === 403) {
          const reason = response.headers.get('X-Auth-Reason')
          message =
            reason === 'pending_approval'
              ? t('loginPendingApproval')
              : reason === 'rejected'
                ? t('loginRejectedAccount')
                : t('loginInactiveAccount')
        }
        throw new Error(message)
      }

      // 토큰 저장
      localStorage.setItem('access_token', data.access_token)
      
      // Refresh token 저장 (백엔드에서 제공하는 경우)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      // 사용자 정보 저장 (username과 full_name)
      if (data.username) {
        localStorage.setItem('user_username', data.username)
        localStorage.setItem('last_cached_username', data.username)
      } else {
        // 백엔드에서 username을 반환하지 않으면 입력한 값 사용
        localStorage.setItem('user_username', formData.username)
        localStorage.setItem('last_cached_username', formData.username)
      }
      if (data.full_name) {
        localStorage.setItem('user_full_name', data.full_name)
      }
      
      // 이전 사용자의 캐시 완전히 제거 (사용자별 캐시 분리)
      clearAllPersistedCache()

      // React Query 캐시 초기화 (메모리 캐시)
      queryClient.clear()

      // 같은 사용자가 이전 세션에서 푸시 알림을 켜뒀다면 자동으로 재구독.
      // 로그아웃 시 브라우저 구독은 정리되지만 사용자별 'push_pref_<username>'
      // 플래그는 localStorage에 남아있어 복원이 가능하다. 다른 사용자로 로그인하면
      // 그 사용자의 플래그가 따로 적용되므로 사용자 간 격리는 유지된다.
      // 화면 전환을 막지 않도록 await 없이 백그라운드로 복원한다.
      const loggedInUsername = data.username || formData.username
      restorePushSubscriptionForUser(loggedInUsername).catch((pushError) => {
        console.warn('로그인 후 푸시 자동 복원 중 에러 (무시):', pushError)
      })

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
    <div className="bg-surface screen-fit-minus-header flex items-center justify-center p-4">
      <div className="max-w-sm w-full my-auto">
        {/* Logo — 토스 블루 플랫: 앰버 글로우 대신 담백한 타이포 + 브랜드 포인트 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter font-display text-gray-900 dark:text-white mb-2">
            {t('aboutChurchName')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('loginWelcome')}
          </p>
        </div>

        {/* Login Card */}
        <div className="feed-card rounded-2xl p-8 mb-4">
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand hover:bg-brand-dim text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_8px_24px_-8px_var(--brand-glow)]"
            >
              {loading ? t('loginLoading') : t('loginButton')}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="feed-card rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('loginNoAccount')}{' '}
            <Link
              to="/register"
              className="font-semibold text-brand hover:text-brand-dim transition-colors"
            >
              {t('loginSignUp')}
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
          >
            {t('loginBackHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
