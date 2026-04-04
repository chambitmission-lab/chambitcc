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
    <div className="bg-gray-50 dark:bg-black h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-sm w-full my-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* 주변 빛 확산 효과 */}
            <div className="absolute inset-0 bg-amber-300/30 blur-md animate-pulse"></div>
            
            <h1 className="text-3xl font-bold tracking-tighter font-display text-gray-900 dark:text-white mb-2 relative z-10 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
              {t('aboutChurchName')}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('registerWelcome')}
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-8 mb-4">
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
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg text-sm hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm mt-4"
            >
              {loading ? t('registerLoading') : t('registerButton')}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('registerHaveAccount')}{' '}
            <Link 
              to="/login" 
              className="font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              {t('registerLogin')}
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-block text-sm font-medium relative group"
          >
            {/* 은은한 빛 효과 */}
            <span className="absolute inset-0 bg-gradient-to-r from-amber-300 to-yellow-300 blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></span>
            
            {/* 텍스트 */}
            <span className="relative bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-yellow-300 transition-all duration-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
              {t('loginBackHome')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
