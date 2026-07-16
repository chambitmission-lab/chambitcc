import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_V1 } from '../../config/api'

const Register = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError(t('registerPasswordMismatch'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_V1}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || t('registerFailed'))
      }

      alert(t('registerSuccess'))
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerFailed'))
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
            {t('registerWelcome')}
          </p>
        </div>

        {/* Register Card */}
        <div className="feed-card rounded-2xl p-8 mb-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('registerUsername')}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder={t('registerFullName')}
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
                placeholder={t('registerPassword')}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('registerConfirmPassword')}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand hover:bg-brand-dim text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_8px_24px_-8px_var(--brand-glow)] mt-4"
            >
              {loading ? t('registerLoading') : t('registerButton')}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="feed-card rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('registerHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-semibold text-brand hover:text-brand-dim transition-colors"
            >
              {t('registerLogin')}
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

export default Register
